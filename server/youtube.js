// YouTube Data API v3 client + ranking logic.
import { channelBoost } from './channels.js'
import { analyzeComments } from './sentiment.js'

const API = 'https://www.googleapis.com/youtube/v3'

class YouTubeError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function ytGet(path, params, key) {
  const url = new URL(`${API}/${path}`)
  Object.entries({ ...params, key }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  )
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) {
    const reason =
      data?.error?.errors?.[0]?.reason || data?.error?.message || 'YouTube API error'
    throw new YouTubeError(reason, res.status)
  }
  return data
}

const compact = (n) => {
  n = Number(n) || 0
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x))

// Main entry: search, enrich with stats + comment sentiment, rank, return top N.
export async function recommend({ query, key, max = 6 }) {
  if (!key) throw new YouTubeError('NO_API_KEY', 401)

  // 1) Search (India-targeted). 100 quota units.
  const search = await ytGet(
    'search',
    {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '20',
      order: 'relevance',
      regionCode: 'IN',
      relevanceLanguage: 'en',
      videoEmbeddable: 'true',
      safeSearch: 'moderate',
    },
    key,
  )

  const ids = (search.items || []).map((i) => i.id.videoId).filter(Boolean)
  if (!ids.length) return []

  // 2) Fetch statistics for all candidates. 1 quota unit.
  const vids = await ytGet(
    'videos',
    { part: 'snippet,statistics,contentDetails', id: ids.join(',') },
    key,
  )

  let candidates = (vids.items || []).map((v) => {
    const s = v.statistics || {}
    const views = Number(s.viewCount) || 0
    const likes = Number(s.likeCount) || 0
    const comments = Number(s.commentCount) || 0
    const { boost, name } = channelBoost(v.snippet.channelTitle)
    return {
      id: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      publishedAt: v.snippet.publishedAt,
      views,
      likes,
      commentCount: comments,
      boost,
      boostedAs: name,
    }
  })

  // 3) Pre-rank by views+boost, then fetch comments only for the strongest few
  //    to keep quota low (commentThreads = 1 unit each).
  candidates.sort(
    (a, b) => b.views * (1 + b.boost) - a.views * (1 + a.boost),
  )
  // Analyze more candidates than we return so comment sentiment can reorder
  // the top; scale down for small `max` (e.g. per-topic lookups) to save quota.
  const analyzeCount = Math.min(
    candidates.length,
    Math.max(6, Math.min(10, max * 2)),
  )
  const toAnalyze = candidates.slice(0, analyzeCount)

  await Promise.all(
    toAnalyze.map(async (c) => {
      try {
        const ct = await ytGet(
          'commentThreads',
          {
            part: 'snippet',
            videoId: c.id,
            maxResults: '20',
            order: 'relevance',
            textFormat: 'plainText',
          },
          key,
        )
        const texts = (ct.items || []).map(
          (i) => i.snippet?.topLevelComment?.snippet?.textDisplay || '',
        )
        c.sentiment = analyzeComments(texts)
      } catch {
        // Comments may be disabled — neutral sentiment.
        c.sentiment = analyzeComments([])
      }
    }),
  )

  // 4) Composite score. Boosted channels get a multiplier (rank-all, boost-named).
  const scored = toAnalyze.map((c) => {
    const viewNorm = clamp(Math.log10(c.views + 1) / 8) // ~1 at 100M views
    const likeRatio = c.views ? c.likes / c.views : 0
    const likeNorm = clamp(likeRatio / 0.05) // 5% like ratio => max
    const sent = c.sentiment || { score: 0, positiveRatio: null }
    // Use the % of positive comments (what we actually display) as the
    // sentiment signal so ranking matches the metric shown to the user.
    // Fall back to the lexicon score only when no comments were sampled.
    const sentNorm =
      sent.positiveRatio != null
        ? clamp(sent.positiveRatio)
        : clamp((sent.score + 1) / 2)
    // Views and positive reception matter most; like-ratio is a lighter signal.
    const base = 0.4 * viewNorm + 0.2 * likeNorm + 0.4 * sentNorm
    const score = base * (1 + c.boost)
    return {
      ...c,
      viewsLabel: compact(c.views),
      likesLabel: compact(c.likes),
      likePct: c.views ? Math.round(likeRatio * 1000) / 10 : null,
      positivePct:
        sent.positiveRatio == null ? null : Math.round(sent.positiveRatio * 100),
      score: Math.round(score * 1000) / 1000,
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, max)
}

export { YouTubeError }
