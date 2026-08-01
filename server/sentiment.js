// Lightweight lexicon-based sentiment for YouTube comments. No external API.
// Tuned for Indian-student / Hinglish learning comments ("samajh aaya", "mast",
// "best teacher", "thank you sir", etc.).

const POSITIVE = [
  'thank you', 'thanks', 'thank u', 'helpful', 'amazing', 'awesome', 'great',
  'excellent', 'best', 'love', 'loved', 'clear', 'easy', 'understood', 'gold',
  'underrated', 'respect', 'goat', 'op', 'superb', 'perfect', 'wonderful',
  'fantastic', 'brilliant', 'nice', 'good', 'must watch', 'lifesaver',
  // Hinglish
  'samajh aaya', 'samjh aaya', 'samajh aagya', 'mast', 'badhiya', 'bahut accha',
  'bahut acha', 'shukriya', 'dhanyavaad', 'dhanyavad', 'best teacher',
  'thank you sir', 'thanks sir', 'kya baat', 'zabardast', 'shandar', 'top',
]

const NEGATIVE = [
  'waste', 'boring', 'confusing', 'confused', 'worst', 'useless', 'bad',
  'dislike', 'clickbait', 'too fast', 'unclear', 'not helpful', 'disappointing',
  'terrible', 'poor', 'misleading',
  // Hinglish
  'samajh nahi', 'samjh nahi', 'bekar', 'bakwas', 'bakwaas', 'faltu', 'ghatiya',
]

function countMatches(text, words) {
  let n = 0
  for (const w of words) if (text.includes(w)) n++
  return n
}

// Given an array of comment strings, returns:
//   { score: -1..1, positiveRatio: 0..1, sampled: number }
export function analyzeComments(comments = []) {
  if (!comments.length) return { score: 0, positiveRatio: null, sampled: 0 }
  let pos = 0
  let neg = 0
  let positiveComments = 0
  for (const raw of comments) {
    const t = String(raw).toLowerCase()
    const p = countMatches(t, POSITIVE)
    const n = countMatches(t, NEGATIVE)
    pos += p
    neg += n
    if (p > n) positiveComments++
  }
  const total = pos + neg
  const score = total === 0 ? 0 : (pos - neg) / total
  return {
    score,
    positiveRatio: positiveComments / comments.length,
    sampled: comments.length,
  }
}
