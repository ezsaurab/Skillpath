// Cache layer for API responses: Redis when reachable, bounded in-memory
// Map otherwise. Redis keeps the cache warm across server restarts and out
// of the Node heap; the fallback means the app runs fine without it.
import { createClient } from 'redis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const PREFIX = 'skillpath:'
const MAX_MEMORY_ENTRIES = 300

let redis = null

// In-memory fallback: key -> { expiresAt, data }
const mem = new Map()

export async function initCache() {
  try {
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 1500,
        // Retry a few times (e.g. Redis restarting), then stop; reads and
        // writes fall back to memory whenever the client isn't ready.
        reconnectStrategy: (retries) =>
          retries > 5 ? false : Math.min(retries * 200, 2000),
      },
    })
    client.on('error', () => {}) // fallback handles outages; don't crash
    await client.connect()
    redis = client
  } catch {
    redis = null
  }
  return cacheBackend()
}

export function cacheBackend() {
  return redis?.isReady ? 'redis' : 'memory'
}

function memGet(key) {
  const hit = mem.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    mem.delete(key)
    return null
  }
  return hit.data
}

function memSet(key, data, ttlSeconds) {
  mem.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, data })
  if (mem.size > MAX_MEMORY_ENTRIES) mem.delete(mem.keys().next().value)
}

export async function cacheGet(key) {
  if (redis?.isReady) {
    try {
      const raw = await redis.get(PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      // fall through to memory
    }
  }
  return memGet(key)
}

export async function cacheSet(key, value, ttlSeconds) {
  if (redis?.isReady) {
    try {
      await redis.set(PREFIX + key, JSON.stringify(value), { EX: ttlSeconds })
      return
    } catch {
      // fall through to memory
    }
  }
  memSet(key, value, ttlSeconds)
}

export async function closeCache() {
  if (redis?.isReady) await redis.quit().catch(() => {})
}
