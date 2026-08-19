import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Session cookie is httpOnly; the client only ever sees the public profile.
const AuthContext = createContext({ user: null, loading: true })

export async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password } })
    setUser(d.user)
    return d.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const d = await api('/api/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    })
    setUser(d.user)
    return d.user
  }, [])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

/* Best-effort account sync — every call is a no-op when logged out, so the
   whole app keeps working without an account. */

export function savePathway(user, kind, title, data) {
  if (!user) return Promise.resolve(null)
  return api('/api/me/pathways', { method: 'POST', body: { kind, title, data } }).catch(
    () => null,
  )
}

export function saveQuizResult(user, title, score, total) {
  if (!user) return Promise.resolve(null)
  return api('/api/me/quizzes', { method: 'POST', body: { title, score, total } }).catch(
    () => null,
  )
}
