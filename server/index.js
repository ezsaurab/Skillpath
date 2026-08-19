import express from 'express'
import cors from 'cors'
import multer from 'multer'
import cookieParser from 'cookie-parser'
import { createHash } from 'node:crypto'
import 'dotenv/config'
import { recommend, YouTubeError } from './youtube.js'
import { analyzeCurriculum, pdfToText, CurriculumError } from './curriculum.js'
import { initCache, cacheGet, cacheSet, cacheBackend } from './cache.js'
import { authRouter } from './auth.js'
import { accountRouter } from './account.js'

const app = express()
// Session cookies ride on these requests, so only trusted origins may send
// them — reflecting any origin would let a third-party site act as the user.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173'
).split(',')
app.use(
  cors({
    credentials: true,
    origin: (origin, cb) =>
      // No Origin header = same-origin/curl; the Vite proxy makes the app itself same-origin.
      cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/me', accountRouter)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})

const PORT = process.env.PORT || 8787
const KEY = process.env.YOUTUBE_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

// Cache TTLs (seconds). Recommendations churn with YouTube trends; a parsed
// curriculum is deterministic for the same input, so it can live longer.
const RECOMMEND_TTL = 60 * 60 * 6 // 6 hours
const CURRICULUM_TTL = 60 * 60 * 24 * 7 // 7 days

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(KEY),
    hasOpenAI: Boolean(OPENAI_KEY),
    cache: cacheBackend(),
  })
})

// Analyze an uploaded/pasted curriculum into a structured learning path.
app.post('/api/curriculum', upload.single('file'), async (req, res) => {
  try {
    let text = (req.body?.text || '').toString().trim()
    let imageDataUrl

    if (req.file) {
      const { mimetype, buffer } = req.file
      if (mimetype === 'application/pdf') {
        text = `${text}\n\n${await pdfToText(buffer)}`.trim()
      } else if (mimetype.startsWith('image/')) {
        imageDataUrl = `data:${mimetype};base64,${buffer.toString('base64')}`
      } else if (mimetype.startsWith('text/')) {
        text = `${text}\n\n${buffer.toString('utf8')}`.trim()
      } else {
        return res.status(415).json({ error: 'Unsupported file type' })
      }
    }

    if (!text && !imageDataUrl) {
      return res
        .status(400)
        .json({ error: 'Paste your curriculum or upload a file.' })
    }

    // Same syllabus in -> same path out; cache by content hash so re-uploads
    // don't cost another OpenAI call.
    const hash = createHash('sha256')
      .update(text)
      .update(imageDataUrl || '')
      .digest('hex')
    const cacheKey = `curriculum:${hash}`
    const cached = await cacheGet(cacheKey)
    if (cached) return res.json(cached)

    const path = await analyzeCurriculum({ text, imageDataUrl, key: OPENAI_KEY })
    await cacheSet(cacheKey, path, CURRICULUM_TTL)
    res.json(path)
  } catch (err) {
    if (err instanceof CurriculumError) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Failed to analyze curriculum' })
  }
})

// Cached recommendation helper shared by /api/recommend and /api/coverage.
async function getRecommendation(query, max) {
  const cacheKey = `recommend:${query.toLowerCase()}::${max}`
  const hit = await cacheGet(cacheKey)
  if (hit) return hit
  const videos = await recommend({ query, key: KEY, max })
  await cacheSet(cacheKey, videos, RECOMMEND_TTL)
  return videos
}

app.get('/api/recommend', async (req, res) => {
  const query = (req.query.q || '').toString().trim()
  if (!query) return res.status(400).json({ error: 'Missing q' })
  const max = Math.min(6, Math.max(1, parseInt(req.query.limit, 10) || 6))

  if (!KEY) {
    return res
      .status(503)
      .json({ error: 'NO_API_KEY', message: 'YOUTUBE_API_KEY not set on server.' })
  }

  try {
    const videos = await getRecommendation(query, max)
    res.json({ videos })
  } catch (err) {
    if (err instanceof YouTubeError) {
      const code =
        err.message === 'NO_API_KEY'
          ? 503
          : err.status === 403
            ? 429
            : err.status || 500
      return res.status(code).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Fetch the single best video for EACH syllabus topic, so a module's videos
// cover every topic instead of clustering on one sub-topic.
app.post('/api/coverage', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'NO_API_KEY' })
  const course = (req.body?.course || '').toString().trim()
  const topics = Array.isArray(req.body?.topics) ? req.body.topics : []
  const list = topics
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 8)

  try {
    // Fetch several ranked candidates per topic (near-synonym topics often
    // share the same top video), then assign greedily so each topic gets a
    // DISTINCT video where possible.
    const perTopic = await Promise.all(
      list.map(async (topic) => {
        const q = `${topic} ${course}`.trim()
        try {
          return { topic, query: q, candidates: await getRecommendation(q, 4) }
        } catch {
          return { topic, query: q, candidates: [] }
        }
      }),
    )

    const used = new Set()
    const items = perTopic.map(({ topic, query, candidates }) => {
      let video = candidates.find((v) => v && !used.has(v.id))
      if (!video) video = candidates[0] || null // allow a repeat only if no alt
      if (video) used.add(video.id)
      return { topic, video, query }
    })
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

const cacheMode = await initCache()
app.listen(PORT, () => {
  console.log(
    `SkillPath API on http://localhost:${PORT}  (YouTube: ${KEY ? 'set' : 'MISSING'}, OpenAI: ${OPENAI_KEY ? 'set' : 'MISSING'}, cache: ${cacheMode})`,
  )
})
