import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db.js'

// Sessions must survive server restarts, so the signing secret is persisted
// (gitignored) when not supplied via env.
const SECRET_PATH = join(dirname(fileURLToPath(import.meta.url)), 'data', 'jwt-secret')
function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (existsSync(SECRET_PATH)) return readFileSync(SECRET_PATH, 'utf8')
  const secret = randomBytes(32).toString('hex')
  writeFileSync(SECRET_PATH, secret, { mode: 0o600 })
  return secret
}
const JWT_SECRET = loadSecret()

const COOKIE = 'sp_token'
const THIRTY_DAYS = 30 * 24 * 60 * 60

function setSession(res, user) {
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: THIRTY_DAYS })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS * 1000,
  })
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.created_at }
}

export function userFromRequest(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return null
  try {
    const { uid } = jwt.verify(token, JWT_SECRET)
    return db.prepare('SELECT * FROM users WHERE id = ?').get(uid) || null
  } catch {
    return null
  }
}

export function authRequired(req, res, next) {
  const user = userFromRequest(req)
  if (!user) return res.status(401).json({ error: 'NOT_LOGGED_IN' })
  req.user = user
  next()
}

export function recordEvent(userId, type, meta) {
  db.prepare('INSERT INTO events (user_id, type, meta) VALUES (?, ?, ?)').run(
    userId,
    type,
    meta ? JSON.stringify(meta) : null,
  )
}

export const authRouter = Router()

authRouter.post('/signup', (req, res) => {
  const name = (req.body?.name || '').toString().trim()
  const email = (req.body?.email || '').toString().trim().toLowerCase()
  const password = (req.body?.password || '').toString()

  if (!name || name.length > 60) return res.status(400).json({ error: 'Enter your name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })

  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email))
    return res.status(409).json({ error: 'An account with this email already exists.' })

  const info = db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run(email, name, bcrypt.hashSync(password, 10))
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)

  recordEvent(user.id, 'login', { first: true })
  setSession(res, user)
  res.json({ user: publicUser(user) })
})

authRouter.post('/login', (req, res) => {
  const email = (req.body?.email || '').toString().trim().toLowerCase()
  const password = (req.body?.password || '').toString()

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Wrong email or password.' })

  recordEvent(user.id, 'login')
  setSession(res, user)
  res.json({ user: publicUser(user) })
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE)
  res.json({ ok: true })
})

authRouter.get('/me', (req, res) => {
  const user = userFromRequest(req)
  res.json({ user: user ? publicUser(user) : null })
})
