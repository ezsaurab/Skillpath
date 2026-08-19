import { useEffect, useMemo, useState } from 'react'
import { useAuth, api } from './auth.jsx'

/* Local copies of the app's visual atoms so this page matches the rest. */

function Panel({ children, className = '' }) {
  return (
    <div className={`ring-hairline rounded-3xl bg-white/[0.025] p-7 backdrop-blur-xl sm:p-8 ${className}`}>
      {children}
    </div>
  )
}

function PageShell({ children }) {
  return (
    <div className="bg-mesh relative min-h-screen overflow-x-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <a href="#" className="text-sm text-muted transition-colors hover:text-cream">
          ← Back to SkillPath
        </a>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ Auth page */

export function AuthPage({ initialMode = 'login' }) {
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState(initialMode) // login | signup
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // New accounts land in the questionnaire to start a path straight away;
  // returning users land on their dashboard.
  const destination = mode === 'signup' ? '' : '#/account'

  useEffect(() => {
    if (user) window.location.hash = destination
  }, [user, destination])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') await signup(name, email, password)
      else await login(email, password)
      window.location.hash = destination
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-cream placeholder:text-muted/60 outline-none transition-colors focus:border-saffron/50'

  return (
    <PageShell>
      <div className="mx-auto mt-14 max-w-md animate-fade-up">
        <h1 className="font-display text-5xl text-cream">
          {mode === 'login' ? 'Welcome back' : 'Join SkillPath'}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {mode === 'login'
            ? 'Log in to see your pathways, streak and activity.'
            : 'An account saves every path you generate and tracks your learning streak.'}
        </p>

        <Panel className="mt-8">
          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <input
                className={field}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            <input
              className={field}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className={field}
              type="password"
              placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-full bg-cream py-3 font-medium text-ink transition-colors hover:bg-saffron disabled:bg-white/10 disabled:text-muted"
            >
              {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </Panel>

        <p className="mt-5 text-center text-sm text-muted">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
            className="text-saffron hover:underline"
          >
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </div>
    </PageShell>
  )
}

/* --------------------------------------------------------- Account page */

const EVENT_LABEL = {
  login: { icon: '🔑', label: 'Logged in' },
  path_generated: { icon: '🧭', label: 'Generated a path' },
  curriculum_generated: { icon: '📚', label: 'Built a curriculum path' },
  quiz_completed: { icon: '✅', label: 'Completed a quiz' },
}

function timeAgo(iso) {
  const then = new Date(iso.replace(' ', 'T') + 'Z')
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AccountPage() {
  const { user, loading, logout } = useAuth()
  const [activity, setActivity] = useState(null)
  const [pathways, setPathways] = useState(null)
  const [quizzes, setQuizzes] = useState(null)

  useEffect(() => {
    if (!user) return
    api('/api/me/activity').then(setActivity).catch(() => {})
    api('/api/me/pathways').then((d) => setPathways(d.pathways)).catch(() => {})
    api('/api/me/quizzes').then((d) => setQuizzes(d.quizzes)).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!loading && !user) window.location.hash = '#/auth'
  }, [loading, user])

  if (loading || !user) return <PageShell />

  const initial = user.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <PageShell>
      <header className="mt-8 flex flex-wrap items-center gap-5 animate-fade-up">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-saffron/15 font-display text-3xl text-saffron ring-1 ring-saffron/40">
          {initial}
        </span>
        <div className="flex-1">
          <h1 className="font-display text-4xl leading-tight text-cream sm:text-5xl">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <button
          onClick={() => logout().then(() => (window.location.hash = ''))}
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-muted transition-colors hover:border-red-400/40 hover:text-red-300"
        >
          Log out
        </button>
      </header>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat icon="🔥" value={activity ? activity.streak : '–'} label="Day streak" />
        <Stat icon="📆" value={activity ? activity.activeDays : '–'} label="Active days" />
        <Stat icon="🧭" value={pathways ? pathways.length : '–'} label="Saved pathways" />
        <Stat icon="✅" value={quizzes ? quizzes.length : '–'} label="Quizzes taken" />
      </div>

      {/* Heatmap */}
      <section className="mt-10">
        <SectionTitle
          title="Activity"
          sub={
            activity
              ? `${Object.values(activity.totals).reduce((a, b) => a + b, 0)} actions in the last year · longest streak ${activity.longestStreak} day${activity.longestStreak === 1 ? '' : 's'}`
              : 'Loading…'
          }
        />
        <Panel className="!p-6 overflow-x-auto">
          {activity ? <Heatmap days={activity.days} /> : <p className="text-sm text-muted">Loading…</p>}
        </Panel>
      </section>

      {/* Pathways */}
      <section className="mt-10">
        <SectionTitle
          title="Your pathways"
          sub="Every path you generate while logged in is saved here."
        />
        {!pathways || pathways.length === 0 ? (
          <Panel className="!p-6 text-sm text-muted">
            Nothing saved yet — <a href="#" className="text-saffron hover:underline">generate a path</a>{' '}
            and it will appear here automatically.
          </Panel>
        ) : (
          <div className="space-y-3">
            {pathways.map((p) => (
              <PathwayRow key={p.id} p={p} onDelete={() =>
                api(`/api/me/pathways/${p.id}`, { method: 'DELETE' }).then(() =>
                  setPathways((cur) => cur.filter((x) => x.id !== p.id)),
                )
              } />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {/* Quiz history */}
        <section>
          <SectionTitle title="Quiz scores" />
          {!quizzes || quizzes.length === 0 ? (
            <Panel className="!p-6 text-sm text-muted">No quizzes taken yet.</Panel>
          ) : (
            <Panel className="!p-4">
              <ul className="divide-y divide-white/5">
                {quizzes.slice(0, 8).map((q) => {
                  const pct = Math.round((q.score / q.total) * 100)
                  return (
                    <li key={q.id} className="flex items-center gap-3 px-2 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-cream">{q.title}</span>
                        <span className="text-[12px] text-muted">{timeAgo(q.createdAt)}</span>
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[12px] tabular-nums ${
                          pct >= 70
                            ? 'border-mint/30 bg-mint/[0.08] text-mint'
                            : pct >= 40
                              ? 'border-saffron/30 bg-saffron/[0.08] text-saffron'
                              : 'border-red-400/30 bg-red-400/[0.08] text-red-300'
                        }`}
                      >
                        {q.score}/{q.total}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <SectionTitle title="Recent activity" />
          <Panel className="!p-4">
            {!activity || activity.recent.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {activity.recent.slice(0, 8).map((e, i) => {
                  const info = EVENT_LABEL[e.type] || { icon: '•', label: e.type }
                  return (
                    <li key={i} className="flex items-center gap-3 px-2 py-3">
                      <span className="text-lg">{info.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-cream">
                          {info.label}
                          {e.meta?.title ? (
                            <span className="text-muted"> — {e.meta.title}</span>
                          ) : null}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] text-muted">{timeAgo(e.at)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </section>
      </div>
    </PageShell>
  )
}

function Stat({ icon, value, label }) {
  return (
    <Panel className="!p-5 text-center animate-fade-up">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 font-display text-4xl text-cream tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] uppercase tracking-wider text-muted">{label}</p>
    </Panel>
  )
}

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-3xl text-cream">{title}</h3>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
    </div>
  )
}

/* --------------------------------------------------------------- Heatmap */

function heatColor(n) {
  if (!n) return 'rgba(255,255,255,0.05)'
  if (n <= 1) return 'rgba(245,176,90,0.28)'
  if (n <= 3) return 'rgba(245,176,90,0.5)'
  if (n <= 6) return 'rgba(245,176,90,0.75)'
  return 'rgba(245,176,90,1)'
}

function Heatmap({ days }) {
  const { weeks, monthLabels } = useMemo(() => {
    const byDay = new Map(days.map((d) => [d.day, d.count]))
    const today = new Date()
    // Grid ends on today's week; starts 52 weeks earlier on a Sunday.
    const start = new Date(today)
    start.setDate(start.getDate() - start.getDay() - 51 * 7)

    const weeks = []
    const monthLabels = []
    let lastMonth = -1
    const cur = new Date(start)
    for (let w = 0; w < 52; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
        col.push(cur > today ? null : { iso, count: byDay.get(iso) || 0 })
        cur.setDate(cur.getDate() + 1)
      }
      const firstOfWeek = new Date(cur)
      firstOfWeek.setDate(firstOfWeek.getDate() - 7)
      if (firstOfWeek.getMonth() !== lastMonth) {
        lastMonth = firstOfWeek.getMonth()
        monthLabels.push({ w, label: firstOfWeek.toLocaleDateString('en', { month: 'short' }) })
      }
      weeks.push(col)
    }
    return { weeks, monthLabels }
  }, [days])

  return (
    <div className="min-w-[680px]">
      <div className="relative mb-1.5 h-4 text-[10px] text-muted">
        {monthLabels.map(({ w, label }, i) =>
          i === 0 ? null : (
            <span key={w} className="absolute" style={{ left: `${w * 13}px` }}>
              {label}
            </span>
          ),
        )}
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((col, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {col.map((cell, d) => (
              <span
                key={d}
                title={cell ? `${cell.iso} — ${cell.count} action${cell.count === 1 ? '' : 's'}` : ''}
                className="h-[10px] w-[10px] rounded-[2px]"
                style={{ background: cell ? heatColor(cell.count) : 'transparent' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-muted">
        Less
        {[0, 1, 2, 4, 7].map((n) => (
          <span key={n} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: heatColor(n) }} />
        ))}
        More
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- Pathway row */

const STATE_KEY = 'skillpath:state:v1'
const PATH_KEY = 'skillpath:path:v1'

function openPathway(p) {
  try {
    if (p.kind === 'curriculum') {
      localStorage.setItem(PATH_KEY, JSON.stringify(p.data))
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ step: 0, interests: [], level: 'Beginner', goals: [] }),
      )
    } else {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          step: 3,
          interests: p.data.interests || [],
          level: p.data.level || 'Beginner',
          goals: p.data.goals || [],
        }),
      )
    }
  } catch {
    // storage unavailable — still navigate
  }
  window.location.hash = ''
  window.location.reload()
}

function PathwayRow({ p, onDelete }) {
  return (
    <Panel className="!p-5 flex flex-wrap items-center gap-4 animate-fade-up">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-saffron/10 text-xl ring-1 ring-saffron/20">
        {p.kind === 'curriculum' ? '📚' : '🧭'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-cream">{p.title}</p>
        <p className="text-[12px] text-muted">
          {p.kind === 'curriculum'
            ? `Curriculum path · ${p.data.modules?.length || 0} modules`
            : `Interest path · ${p.data.level || ''}`}{' '}
          · {timeAgo(p.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => openPathway(p)}
          className="rounded-full border border-saffron/30 bg-saffron/[0.08] px-4 py-2 text-[13px] text-saffron transition-colors hover:border-saffron/60"
        >
          Open →
        </button>
        <button
          onClick={onDelete}
          className="rounded-full border border-white/10 px-3.5 py-2 text-[13px] text-muted transition-colors hover:border-red-400/40 hover:text-red-300"
          aria-label="Delete pathway"
        >
          ✕
        </button>
      </div>
    </Panel>
  )
}
