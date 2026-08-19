import { Router } from 'express'
import db from './db.js'
import { authRequired, recordEvent } from './auth.js'

export const accountRouter = Router()
accountRouter.use(authRequired)

// Everything is stored in UTC; days are bucketed in the server's local
// timezone so an evening session in India doesn't count as "tomorrow".
const DAY = "date(created_at, 'localtime')"

function localDayString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Activity summary: per-day counts for the heatmap (last 365 days),
// streaks, totals and the most recent raw events.
accountRouter.get('/activity', (req, res) => {
  const uid = req.user.id

  const days = db
    .prepare(
      `SELECT ${DAY} AS day, COUNT(*) AS count
       FROM events WHERE user_id = ? AND created_at >= datetime('now', '-366 days')
       GROUP BY day ORDER BY day`,
    )
    .all(uid)

  const byDay = new Map(days.map((d) => [d.day, d.count]))

  // Streak = consecutive active days ending today (or yesterday, so the
  // streak isn't "broken" before the user has had today to act).
  let streak = 0
  const cursor = new Date()
  if (!byDay.has(localDayString(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (byDay.has(localDayString(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  let longest = 0
  let run = 0
  let prev = null
  for (const { day } of days) {
    if (prev) {
      const next = new Date(prev + 'T12:00:00')
      next.setDate(next.getDate() + 1)
      run = localDayString(next) === day ? run + 1 : 1
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
    prev = day
  }

  const totals = Object.fromEntries(
    db
      .prepare('SELECT type, COUNT(*) AS n FROM events WHERE user_id = ? GROUP BY type')
      .all(uid)
      .map((r) => [r.type, r.n]),
  )

  const recent = db
    .prepare(
      `SELECT type, meta, created_at AS at
       FROM events WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20`,
    )
    .all(uid)
    .map((e) => ({ ...e, meta: e.meta ? JSON.parse(e.meta) : null }))

  res.json({
    days,
    streak,
    longestStreak: longest,
    activeDays: days.length,
    totals,
    recent,
  })
})

/* ------------------------------------------------------------- Pathways */

accountRouter.get('/pathways', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, kind, title, data, created_at AS createdAt
       FROM pathways WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
    )
    .all(req.user.id)
  res.json({ pathways: rows.map((r) => ({ ...r, data: JSON.parse(r.data) })) })
})

accountRouter.post('/pathways', (req, res) => {
  const kind = req.body?.kind === 'curriculum' ? 'curriculum' : 'wizard'
  const title = (req.body?.title || '').toString().trim().slice(0, 120)
  const data = req.body?.data
  if (!title || !data) return res.status(400).json({ error: 'Missing title or data.' })

  const json = JSON.stringify(data)

  // Regenerating the same path shouldn't spam the list — refresh it instead.
  const dupe = db
    .prepare('SELECT id FROM pathways WHERE user_id = ? AND kind = ? AND title = ?')
    .get(req.user.id, kind, title)
  if (dupe) {
    db.prepare(
      "UPDATE pathways SET data = ?, created_at = datetime('now') WHERE id = ?",
    ).run(json, dupe.id)
    return res.json({ id: dupe.id, updated: true })
  }

  const info = db
    .prepare('INSERT INTO pathways (user_id, kind, title, data) VALUES (?, ?, ?, ?)')
    .run(req.user.id, kind, title, json)
  recordEvent(req.user.id, kind === 'curriculum' ? 'curriculum_generated' : 'path_generated', {
    title,
  })
  res.json({ id: info.lastInsertRowid })
})

accountRouter.delete('/pathways/:id', (req, res) => {
  db.prepare('DELETE FROM pathways WHERE id = ? AND user_id = ?').run(
    Number(req.params.id),
    req.user.id,
  )
  res.json({ ok: true })
})

/* ---------------------------------------------------------- Quiz scores */

accountRouter.get('/quizzes', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, title, score, total, created_at AS createdAt
       FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
    )
    .all(req.user.id)
  res.json({ quizzes: rows })
})

accountRouter.post('/quizzes', (req, res) => {
  const title = (req.body?.title || 'Quiz').toString().trim().slice(0, 120)
  const score = Number(req.body?.score)
  const total = Number(req.body?.total)
  if (!Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total)
    return res.status(400).json({ error: 'Invalid score.' })

  db.prepare('INSERT INTO quiz_results (user_id, title, score, total) VALUES (?, ?, ?, ?)').run(
    req.user.id,
    title,
    score,
    total,
  )
  recordEvent(req.user.id, 'quiz_completed', { title, score, total })
  res.json({ ok: true })
})
