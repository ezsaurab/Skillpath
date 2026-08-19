import { useEffect, useMemo, useState } from 'react'
import { tracks, LEVELS, trackById, trackQuery } from './data/tracks.js'
import { PrivacyPolicy, TermsOfService } from './Legal.jsx'
import { useAuth, savePathway, saveQuizResult } from './auth.jsx'
import { AuthPage, AccountPage } from './Account.jsx'
import Landing from './Landing.jsx'

const GOALS = [
  { id: 'job', label: 'Land a job / internship', emoji: '💼' },
  { id: 'project', label: 'Build my own project', emoji: '🛠️' },
  { id: 'curious', label: 'Explore out of curiosity', emoji: '🧭' },
  { id: 'exam', label: 'Prepare for exams', emoji: '📚' },
]

// Tailored action plan shown in results for each selected goal.
const GOAL_GUIDANCE = {
  job: {
    emoji: '💼',
    title: 'Get hired',
    tagline: 'Turn skills into offers',
    steps: [
      'Build 2–3 portfolio projects and put them on GitHub.',
      'Grind DSA daily — aim for 150+ problems before interviews.',
      'Polish your resume + LinkedIn; quantify every project.',
      'Do mock interviews and revise core CS fundamentals.',
    ],
    links: [
      { label: 'Striver A2Z DSA Sheet', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/' },
      { label: 'LeetCode practice', url: 'https://leetcode.com/problemset/' },
      { label: 'Resume guide (freeCodeCamp)', url: 'https://www.freecodecamp.org/news/how-to-write-a-resume/' },
    ],
  },
  project: {
    emoji: '🛠️',
    title: 'Ship a project',
    tagline: 'Learn by building',
    steps: [
      'Pick one small, finishable idea — scope it to a weekend.',
      'Learn just enough to build the next feature (avoid tutorial hell).',
      'Use Git from day one; commit small and often.',
      'Deploy it live and share it for feedback.',
    ],
    links: [
      { label: 'Free deploy: Vercel', url: 'https://vercel.com/' },
      { label: 'GitHub: Hello World', url: 'https://docs.github.com/en/get-started/start-your-journey/hello-world' },
      { label: 'App ideas list', url: 'https://github.com/florinpop17/app-ideas' },
    ],
  },
  curious: {
    emoji: '🧭',
    title: 'Explore freely',
    tagline: 'Follow your curiosity',
    steps: [
      'Watch one overview video before going deep — get the map first.',
      'Keep a notes doc of “things I want to understand”.',
      'Join a community to stay motivated and ask questions.',
      'Follow the threads that excite you; depth comes naturally.',
    ],
    links: [
      { label: 'r/learnprogramming', url: 'https://www.reddit.com/r/learnprogramming/' },
      { label: 'roadmap.sh', url: 'https://roadmap.sh/' },
    ],
  },
  exam: {
    emoji: '📚',
    title: 'Ace the exam',
    tagline: 'Score with a plan',
    steps: [
      'Get the syllabus + past papers and map high-weightage topics.',
      'Use the Curriculum mode below to turn your syllabus into a path.',
      'Make short revision notes and active-recall flashcards.',
      'Solve previous-year papers under timed conditions.',
    ],
    links: [
      { label: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/' },
      { label: 'Anki (flashcards)', url: 'https://apps.ankiweb.net/' },
    ],
  },
}

const STEP_LABELS = ['Interests', 'Level', 'Goal']

/* ------------------------------------------------- Local persistence */
// Progress and generated paths survive a refresh — losing an OpenAI-generated
// curriculum path to an accidental reload is the worst UX in the app.

const STATE_KEY = 'skillpath:state:v1'
const PATH_KEY = 'skillpath:path:v1'

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full / disabled — persistence is best-effort
  }
}

function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const saved = useMemo(() => {
    const s = loadJSON(STATE_KEY)
    // Never restore into a later step without the interests that step needs.
    if (!s || ((s.step ?? 0) > 0 && !s.interests?.length)) return null
    return s
  }, [])
  const [step, setStep] = useState(saved?.step ?? 0)
  const [interests, setInterests] = useState(saved?.interests ?? [])
  const [level, setLevel] = useState(saved?.level ?? 'Beginner')
  const [goals, setGoals] = useState(saved?.goals ?? [])
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    saveJSON(STATE_KEY, { step, interests, level, goals })
  }, [step, interests, level, goals])

  // Each step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const reset = () => {
    setStep(0)
    setInterests([])
    setLevel('Beginner')
    setGoals([])
    removeKey(STATE_KEY)
    window.scrollTo({ top: 0 })
  }

  const toggleInterest = (id) =>
    setInterests((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )

  const toggleGoal = (id) =>
    setGoals((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )

  if (route === '#/privacy') return <PrivacyPolicy />
  if (route === '#/terms') return <TermsOfService />
  if (route === '#/auth') return <AuthPage />
  if (route === '#/signup') return <AuthPage initialMode="signup" />
  if (route === '#/account') return <AccountPage />

  // The questionnaire is the signed-in app; visitors get the pitch instead.
  // Render nothing until the session check settles, so the landing page
  // doesn't flash for someone who is already logged in.
  if (authLoading) return <div className="bg-mesh min-h-screen" />
  if (!user) return <Landing />

  return (
    <div className="bg-mesh relative min-h-screen overflow-x-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <Header step={step} />

        <main className="mt-10">
          {step === 0 && (
            <>
              <InterestStep
                interests={interests}
                toggle={toggleInterest}
                onNext={() => setStep(1)}
              />
              <SectionDivider label="Or, already have a syllabus?" />
              <CurriculumSection />
            </>
          )}
          {step === 1 && (
            <LevelStep
              level={level}
              setLevel={setLevel}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <GoalStep
              goals={goals}
              toggle={toggleGoal}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Results
              interests={interests}
              level={level}
              goals={goals}
              onRestart={reset}
            />
          )}
        </main>

        <footer className="mt-20 space-y-3 border-t border-white/5 pt-6 text-xs text-muted">
          <div className="flex items-center justify-between">
            <span>SkillPath</span>
            <span>Curated for Indian learners · 🇮🇳</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex gap-4">
              <a href="#/privacy" className="hover:text-cream">
                Privacy Policy
              </a>
              <a href="#/terms" className="hover:text-cream">
                Terms of Service
              </a>
            </span>
            <span>
              Video recommendations powered by{' '}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cream hover:text-saffron"
              >
                ▶ YouTube
              </a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- Header */

function Header({ step }) {
  const { user } = useAuth()
  return (
    <header className="animate-fade-up">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-saffron/80">
        <span className="inline-block h-1.5 w-1.5 animate-float rounded-full bg-saffron" />
        Learn what you love
        {user && (
          <a
            href="#/account"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-4 normal-case tracking-normal text-cream transition-colors hover:border-saffron/40"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-saffron/20 font-display text-sm text-saffron">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-[13px]">{user.name.split(' ')[0]}</span>
          </a>
        )}
      </div>
      <h1 className="mt-4 font-display text-6xl leading-[0.9] tracking-tight text-cream sm:text-7xl">
        Skill<span className="italic text-saffron">Path</span>
      </h1>
      <p className="mt-4 max-w-xl text-balance text-[15px] leading-relaxed text-muted">
        Answer three quick questions. Get the{' '}
        <span className="text-cream">best YouTube lessons</span> — ranked by views,
        likes &amp; real student reactions — plus a quiz to test yourself.
      </p>

      {step < 3 && (
        <nav className="mt-8 flex items-center gap-3">
          {STEP_LABELS.map((label, i) => {
            const active = i === step
            const done = i < step
            return (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    active
                      ? 'text-cream'
                      : done
                        ? 'text-mint'
                        : 'text-muted/50'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
                      active
                        ? 'border-saffron bg-saffron text-ink'
                        : done
                          ? 'border-mint/40 text-mint'
                          : 'border-white/10'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <span className="h-px w-6 bg-white/10 sm:w-10" />
                )}
              </div>
            )
          })}
        </nav>
      )}
    </header>
  )
}

/* --------------------------------------------------------- Shared atoms */

function Panel({ children, className = '', style }) {
  return (
    <div
      style={style}
      className={`ring-hairline rounded-3xl bg-white/[0.025] p-7 backdrop-blur-xl sm:p-8 ${className}`}
    >
      {children}
    </div>
  )
}

function ArrowBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-cream px-7 py-3 font-medium text-ink transition-all duration-300 hover:gap-3 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
    >
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-saffron to-amber transition-transform duration-300 group-hover:translate-x-0 group-disabled:hidden"
        aria-hidden
      />
      <span className="relative">{children}</span>
      <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
        →
      </span>
    </button>
  )
}

function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm text-muted transition-colors hover:text-cream"
    >
      <span className="transition-transform group-hover:-translate-x-0.5">←</span>
      Back
    </button>
  )
}

function StepHeading({ kicker, title, sub }) {
  return (
    <div className="mb-7">
      <span className="text-xs uppercase tracking-[0.3em] text-saffron/70">
        {kicker}
      </span>
      <h2 className="mt-2 font-display text-4xl leading-tight text-cream sm:text-5xl">
        {title}
      </h2>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------- Step: 1 */

function InterestStep({ interests, toggle, onNext }) {
  return (
    <div className="animate-fade-up">
      <StepHeading
        kicker="Step 01"
        title="What pulls you in?"
        sub="Pick everything that sparks your curiosity."
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {tracks.map((t, i) => {
          const active = interests.includes(t.id)
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`group ring-hairline animate-fade-up relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 ${
                active
                  ? 'bg-saffron/[0.07] shadow-[0_0_0_1px_rgba(245,176,90,0.5),0_20px_50px_-20px_rgba(245,176,90,0.4)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.045]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  {t.emoji}
                </span>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border text-xs transition-all ${
                    active
                      ? 'border-saffron bg-saffron text-ink'
                      : 'border-white/15 text-transparent'
                  }`}
                >
                  ✓
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl text-cream">{t.name}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {t.blurb}
              </p>
            </button>
          )
        })}
      </div>
      <div className="mt-9 flex items-center justify-between">
        <span className="text-sm text-muted">
          {interests.length
            ? `${interests.length} selected`
            : 'Choose at least one'}
        </span>
        <ArrowBtn disabled={interests.length === 0} onClick={onNext}>
          Continue
        </ArrowBtn>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Step: 2 */

function LevelStep({ level, setLevel, onBack, onNext }) {
  const meta = {
    Beginner: { n: '01', d: 'Brand new — start from the very basics.' },
    Intermediate: { n: '02', d: 'You know the fundamentals; go deeper.' },
    Advanced: { n: '03', d: 'Comfortable — bring on the hard stuff.' },
  }
  return (
    <div className="animate-fade-up">
      <StepHeading
        kicker="Step 02"
        title="Where are you now?"
        sub="We'll tune the difficulty of your videos to match."
      />
      <div className="space-y-3.5">
        {LEVELS.map((l, i) => {
          const active = level === l
          return (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`group ring-hairline animate-fade-up flex w-full items-center gap-5 rounded-2xl p-5 text-left transition-all duration-300 ${
                active
                  ? 'bg-saffron/[0.07] shadow-[0_0_0_1px_rgba(245,176,90,0.5)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.045]'
              }`}
            >
              <span
                className={`font-display text-4xl tabular-nums transition-colors ${
                  active ? 'text-saffron' : 'text-white/15'
                }`}
              >
                {meta[l].n}
              </span>
              <span className="flex-1">
                <span className="block font-display text-2xl text-cream">{l}</span>
                <span className="block text-[13px] text-muted">{meta[l].d}</span>
              </span>
              <span
                className={`h-3 w-3 rounded-full border transition-all ${
                  active
                    ? 'border-saffron bg-saffron shadow-[0_0_12px_2px_rgba(245,176,90,0.6)]'
                    : 'border-white/20'
                }`}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-9 flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <ArrowBtn onClick={onNext}>Continue</ArrowBtn>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Step: 3 */

function GoalStep({ goals, toggle, onBack, onNext }) {
  return (
    <div className="animate-fade-up">
      <StepHeading
        kicker="Step 03"
        title="What's the dream?"
        sub="Pick one or more — each goal adds a tailored action plan to your results."
      />
      <div className="grid grid-cols-2 gap-3.5">
        {GOALS.map((g, i) => {
          const active = goals.includes(g.id)
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`group ring-hairline animate-fade-up relative flex flex-col items-start gap-3 rounded-2xl p-6 text-left transition-all duration-300 ${
                active
                  ? 'bg-saffron/[0.07] shadow-[0_0_0_1px_rgba(245,176,90,0.5)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.045]'
              }`}
            >
              <span
                className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border text-xs transition-all ${
                  active
                    ? 'border-saffron bg-saffron text-ink'
                    : 'border-white/15 text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="text-3xl transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
                {g.emoji}
              </span>
              <span className="font-display text-xl leading-tight text-cream">
                {g.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-9 flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            {goals.length ? `${goals.length} selected` : 'Pick at least one'}
          </span>
          <ArrowBtn disabled={goals.length === 0} onClick={onNext}>
            Reveal my path
          </ArrowBtn>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Results */

function Results({ interests, level, goals, onRestart }) {
  const { user } = useAuth()
  const selected = interests.map(trackById).filter(Boolean)
  const chosenGoals = (goals || []).filter((g) => GOAL_GUIDANCE[g])

  // Logged-in users get every generated path saved to their account; the
  // server dedupes by title so revisiting results doesn't spam the list.
  useEffect(() => {
    if (!user || !selected.length) return
    const title = `${selected.map((t) => t.name).join(' · ')} — ${level}`
    savePathway(user, 'wizard', title, { interests, level, goals })
  }, [user, interests.join(','), level, goals.join(',')])

  return (
    <div className="space-y-14">
      <Panel className="animate-scale-in relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 animate-drift rounded-full bg-saffron/20 blur-3xl" />
        <span className="text-xs uppercase tracking-[0.3em] text-mint/80">
          Your path is ready
        </span>
        <h2 className="mt-3 font-display text-4xl leading-tight text-cream sm:text-5xl">
          {selected.map((t) => t.name).join(' · ')}
        </h2>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Pill>📈 {level}</Pill>
          {chosenGoals.map((g) => (
            <Pill key={g}>
              {GOALS.find((x) => x.id === g)?.emoji}{' '}
              {GOALS.find((x) => x.id === g)?.label}
            </Pill>
          ))}
          <Pill tone="mint">🇮🇳 India-ranked</Pill>
        </div>
        <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-muted">
          Videos are ranked by <span className="text-cream">views</span>,{' '}
          <span className="text-cream">like ratio</span> and{' '}
          <span className="text-cream">positive comment sentiment</span> — with
          trusted educators like CampusX, 100xDevs, CodeWithHarry &amp; Apna College
          boosted to the top.
        </p>
      </Panel>

      {chosenGoals.length > 0 && (
        <section>
          <SectionTitle
            index="◎"
            title="Your goal game-plan"
            sub={`Tailored to ${chosenGoals.length} goal${chosenGoals.length > 1 ? 's' : ''} you picked`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {chosenGoals.map((g, i) => (
              <GoalPlan key={g} goalId={g} index={i} />
            ))}
          </div>
        </section>
      )}

      {selected.map((t, i) => (
        <VideoSection key={t.id} track={t} level={level} index={i} />
      ))}

      <section>
        <SectionTitle index="✺" title="Test yourself" />
        <Quiz tracks={selected} />
      </section>

      <div className="flex justify-center pt-2">
        <button
          onClick={onRestart}
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-muted transition-colors hover:border-saffron/40 hover:text-cream"
        >
          ↺ Start a new path
        </button>
      </div>
    </div>
  )
}

function Pill({ children, tone }) {
  const tones = {
    mint: 'border-mint/25 bg-mint/[0.07] text-mint',
    default: 'border-white/10 bg-white/[0.03] text-cream',
  }
  return (
    <span
      className={`rounded-full border px-3.5 py-1.5 text-sm ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  )
}

function GoalPlan({ goalId, index }) {
  const g = GOAL_GUIDANCE[goalId]
  if (!g) return null
  return (
    <Panel
      className="animate-fade-up !p-6"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-saffron/10 text-2xl ring-1 ring-saffron/20">
          {g.emoji}
        </span>
        <div>
          <h4 className="font-display text-2xl leading-none text-cream">
            {g.title}
          </h4>
          <p className="mt-1 text-xs uppercase tracking-wider text-saffron/70">
            {g.tagline}
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {g.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-cream/90">
            <span className="font-display text-base text-saffron/70">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      {g.links?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {g.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-cream transition-colors hover:border-saffron/40 hover:text-saffron"
            >
              ↗ {l.label}
            </a>
          ))}
        </div>
      )}
    </Panel>
  )
}

function SectionTitle({ index, title, sub }) {
  return (
    <div className="mb-5 flex items-baseline gap-4">
      <span className="font-display text-3xl text-saffron">{index}</span>
      <div>
        <h3 className="font-display text-3xl text-cream">{title}</h3>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
    </div>
  )
}

/* -------------------------------------------------------- VideoSection */

function VideoSection({ track, level, index }) {
  const [state, setState] = useState({ status: 'loading', videos: [] })

  useEffect(() => {
    let alive = true
    const q = `${trackQuery[track.id] || track.name} ${level}`
    setState({ status: 'loading', videos: [] })
    fetch(`/api/recommend?q=${encodeURIComponent(q)}`)
      .then(async (r) => {
        const data = await r.json()
        if (!alive) return
        if (r.ok && data.videos?.length) {
          setState({ status: 'live', videos: data.videos })
        } else {
          setState({ status: 'fallback', videos: [], reason: data.error })
        }
      })
      .catch(() => {
        if (alive) setState({ status: 'fallback', videos: [] })
      })
    return () => {
      alive = false
    }
  }, [track.id, level])

  const fallback = useMemo(() => {
    const inLevel = track.videos.filter((v) => v.levels.includes(level))
    return inLevel.length ? inLevel : track.videos
  }, [track, level])

  const list = state.status === 'live' ? state.videos : fallback

  return (
    <section>
      <SectionTitle
        index={String(index + 1).padStart(2, '0')}
        title={`${track.emoji} ${track.name}`}
        sub="Top picks, ranked for you"
      />

      {state.status === 'fallback' && (
        <div className="mb-4 rounded-2xl border border-amber/20 bg-amber/[0.05] px-4 py-3 text-[13px] text-saffron/90">
          {state.reason === 'quotaExceeded' ? (
            <>
              Daily YouTube API quota reached — showing curated picks. Live
              rankings return when the quota resets (midnight Pacific time).
            </>
          ) : state.reason === 'NO_API_KEY' ? (
            <>
              Showing curated picks. Add a YouTube API key to{' '}
              <code className="rounded bg-black/30 px-1.5 py-0.5">.env</code> for
              live, sentiment-ranked results.
            </>
          ) : (
            <>Live results unavailable right now — showing curated picks instead.</>
          )}
        </div>
      )}

      <div className="space-y-3.5">
        {state.status === 'loading'
          ? [0, 1, 2].map((i) => <VideoSkeleton key={i} />)
          : list.map((v, i) => <VideoCard key={v.id || i} v={v} rank={i + 1} />)}
      </div>
    </section>
  )
}

function VideoSkeleton() {
  return (
    <div className="ring-hairline flex gap-4 rounded-2xl bg-white/[0.02] p-4">
      <div className="shimmer-line animate-shimmer h-20 w-32 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="shimmer-line animate-shimmer h-4 w-3/4 rounded" />
        <div className="shimmer-line animate-shimmer h-3 w-1/3 rounded" />
        <div className="shimmer-line animate-shimmer h-5 w-2/3 rounded-full" />
      </div>
    </div>
  )
}

function VideoCard({ v, rank }) {
  return (
    <a
      href={v.url}
      target="_blank"
      rel="noreferrer"
      style={{ animationDelay: `${rank * 50}ms` }}
      className="group ring-hairline animate-fade-up flex gap-4 rounded-2xl bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:shadow-[0_24px_60px_-30px_rgba(245,176,90,0.5)]"
    >
      <div className="relative shrink-0">
        {v.thumbnail ? (
          <img
            src={v.thumbnail}
            alt=""
            loading="lazy"
            className="h-20 w-32 rounded-xl object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="grid h-20 w-32 place-items-center rounded-xl bg-gradient-to-br from-saffron/30 to-amber/10 text-2xl ring-1 ring-white/10">
            ▶
          </div>
        )}
        <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink font-display text-lg text-saffron ring-1 ring-saffron/40">
          {rank}
        </span>
        <span className="absolute inset-0 grid place-items-center rounded-xl bg-ink/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron text-ink">
            ▶
          </span>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium leading-snug text-cream transition-colors group-hover:text-saffron">
          {v.title}
        </p>
        <p className="mt-1 text-[13px] text-muted">{v.channel}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          {v.viewsLabel && <Metric icon="👁">{v.viewsLabel}</Metric>}
          {v.likePct != null && <Metric icon="👍">{v.likePct}%</Metric>}
          {v.positivePct != null && (
            <Metric icon="💬" tone="good">
              {v.positivePct}% positive
            </Metric>
          )}
          {v.boostedAs && (
            <Metric icon="⭐" tone="boost">
              {v.boostedAs}
            </Metric>
          )}
        </div>
      </div>
    </a>
  )
}

function Metric({ icon, children, tone }) {
  const tones = {
    good: 'border-mint/25 bg-mint/[0.08] text-mint',
    boost: 'border-saffron/30 bg-saffron/[0.08] text-saffron',
    default: 'border-white/8 bg-white/[0.03] text-muted',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
        tones[tone] || tones.default
      }`}
    >
      <span>{icon}</span>
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- Quiz */

function Quiz({ tracks }) {
  const { user } = useAuth()
  const questions = useMemo(
    () =>
      tracks.flatMap((t) => t.questions.map((q) => ({ ...q, track: t.name }))),
    [tracks],
  )
  const [picked, setPicked] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const choose = (qi, oi) => {
    if (submitted) return
    setPicked((p) => ({ ...p, [qi]: oi }))
  }

  const score = questions.reduce(
    (acc, q, i) => acc + (picked[i] === q.answer ? 1 : 0),
    0,
  )
  const allAnswered = Object.keys(picked).length === questions.length
  const pct = Math.round((score / questions.length) * 100)

  const submitQuiz = () => {
    setSubmitted(true)
    saveQuizResult(user, tracks.map((t) => t.name).join(' · '), score, questions.length)
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <Panel key={qi} className="!p-6">
          <div className="flex items-start gap-3">
            <span className="font-display text-2xl text-saffron/60">
              {String(qi + 1).padStart(2, '0')}
            </span>
            <div className="flex-1">
              <p className="font-medium leading-snug text-cream">{q.q}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted/60">
                {q.track}
              </p>
              <div className="mt-4 grid gap-2">
                {q.options.map((opt, oi) => {
                  const isPicked = picked[qi] === oi
                  const isCorrect = q.answer === oi
                  let cls =
                    'border-white/8 bg-white/[0.02] text-cream hover:border-white/20'
                  if (submitted) {
                    if (isCorrect)
                      cls = 'border-mint/50 bg-mint/[0.1] text-mint'
                    else if (isPicked)
                      cls = 'border-red-500/50 bg-red-500/[0.1] text-red-300'
                    else cls = 'border-white/5 bg-white/[0.01] text-muted'
                  } else if (isPicked) {
                    cls = 'border-saffron/60 bg-saffron/[0.1] text-cream'
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => choose(qi, oi)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-200 ${cls}`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && <span>✓</span>}
                      {submitted && isPicked && !isCorrect && <span>✕</span>}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <p className="mt-3 rounded-xl bg-white/[0.02] px-3 py-2 text-[13px] text-muted">
                  <span className="text-saffron">Why:</span> {q.explain}
                </p>
              )}
            </div>
          </div>
        </Panel>
      ))}

      {!submitted ? (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted">
            {Object.keys(picked).length} / {questions.length} answered
          </span>
          <ArrowBtn disabled={!allAnswered} onClick={submitQuiz}>
            Submit answers
          </ArrowBtn>
        </div>
      ) : (
        <Panel className="animate-scale-in relative overflow-hidden text-center">
          <div className="absolute inset-x-0 -top-10 mx-auto h-32 w-32 animate-float rounded-full bg-mint/20 blur-3xl" />
          <p className="relative text-xs uppercase tracking-[0.3em] text-muted">
            Your score
          </p>
          <p className="relative mt-2 font-display text-7xl text-cream">
            {score}
            <span className="text-3xl text-muted">/{questions.length}</span>
          </p>
          <p className="relative mt-2 text-lg text-saffron">
            {pct === 100
              ? '🏆 Flawless — you’re ready.'
              : pct >= 50
                ? '👏 Solid foundation, keep going.'
                : '📚 Great start — rewatch and retry.'}
          </p>
          <button
            onClick={() => {
              setPicked({})
              setSubmitted(false)
            }}
            className="relative mt-5 rounded-full border border-white/10 px-6 py-2.5 text-sm text-muted transition-colors hover:border-saffron/40 hover:text-cream"
          >
            Retake quiz
          </button>
        </Panel>
      )}
    </div>
  )
}

/* ------------------------------------------------------ Section divider */

function SectionDivider({ label }) {
  return (
    <div className="my-12 flex items-center gap-4">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
      <span className="font-display text-lg italic text-muted">{label}</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
    </div>
  )
}

/* --------------------------------------------------- Curriculum section */

const LOADING_LINES = [
  'Reading your curriculum…',
  'Mapping topics from basic to advanced…',
  'Designing your module path…',
  'Writing a question bank…',
  'Finding the best videos…',
]

function CurriculumSection() {
  const { user } = useAuth()
  const savedPath = useMemo(() => {
    const p = loadJSON(PATH_KEY)
    return p?.modules?.length ? p : null
  }, [])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(savedPath ? 'done' : 'idle') // idle | loading | done | error
  const [error, setError] = useState('')
  const [path, setPath] = useState(savedPath)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (status !== 'loading') return
    const id = setInterval(
      () => setTick((t) => (t + 1) % LOADING_LINES.length),
      2200,
    )
    return () => clearInterval(id)
  }, [status])

  const submit = async () => {
    if (!text.trim() && !file) return
    setStatus('loading')
    setError('')
    setPath(null)
    setTick(0)
    try {
      const fd = new FormData()
      if (text.trim()) fd.append('text', text.trim())
      if (file) fd.append('file', file)
      const r = await fetch('/api/curriculum', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) {
        setError(
          data.error === 'NO_OPENAI_KEY'
            ? 'OpenAI key not set. Add OPENAI_API_KEY to .env and restart the server.'
            : data.error || 'Something went wrong.',
        )
        setStatus('error')
        return
      }
      setPath(data)
      setStatus('done')
      saveJSON(PATH_KEY, data)
      savePathway(user, 'curriculum', data.course || 'My curriculum', data)
    } catch {
      setError('Could not reach the server.')
      setStatus('error')
    }
  }

  const clearPath = () => {
    setPath(null)
    setStatus('idle')
    removeKey(PATH_KEY)
  }

  return (
    <div className="animate-fade-up">
      <StepHeading
        kicker="Curriculum mode"
        title="Turn your syllabus into a path"
        sub="Upload or paste your college subject curriculum — AI maps it into a step-by-step course with videos and a question bank."
      />

      <Panel>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your subject curriculum / syllabus here — units, topics, modules…"
          rows={6}
          className="w-full resize-y rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 text-sm text-cream placeholder:text-muted/60 outline-none transition-colors focus:border-saffron/50"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-muted transition-colors hover:border-saffron/40 hover:text-cream">
            <span>📎</span>
            {file ? 'Change file' : 'Upload PDF / image / text'}
            <input
              type="file"
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          {file && (
            <span className="inline-flex items-center gap-2 text-sm text-mint">
              ✓ {file.name}
              <button
                onClick={() => setFile(null)}
                className="text-muted hover:text-cream"
                aria-label="Remove file"
              >
                ✕
              </button>
            </span>
          )}
          <div className="ml-auto">
            <ArrowBtn
              disabled={(!text.trim() && !file) || status === 'loading'}
              onClick={submit}
            >
              {status === 'loading' ? 'Analyzing…' : 'Generate path'}
            </ArrowBtn>
          </div>
        </div>

        {status === 'loading' && (
          <div className="mt-5 flex items-center gap-3 text-sm text-saffron">
            <span className="h-2 w-2 animate-ping rounded-full bg-saffron" />
            <span key={tick} className="animate-fade-in">
              {LOADING_LINES[tick]}
            </span>
          </div>
        )}
        {status === 'error' && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </Panel>

      {status === 'done' && path && <Pathway path={path} onClear={clearPath} />}
    </div>
  )
}

/* -------------------------------------------------------------- Pathway */

const LEVEL_STYLE = {
  Basic: 'border-mint/30 bg-mint/[0.08] text-mint',
  Intermediate: 'border-saffron/30 bg-saffron/[0.08] text-saffron',
  Advanced: 'border-amber/40 bg-amber/[0.1] text-amber',
}

// Export every module's questions as a Markdown file — handy for offline
// revision and printing before exams.
function downloadQuestionBank(path) {
  const lines = [`# ${path.course} — Question Bank`, '']
  path.modules.forEach((m, i) => {
    lines.push(`## Module ${i + 1}: ${m.title} (${m.level})`, '')
    ;(m.questions || []).forEach((q, qi) => {
      lines.push(`${qi + 1}. ${q.q}`)
      if (q.type === 'mcq' && q.options?.length) {
        q.options.forEach((o, oi) => lines.push(`   ${'ABCD'[oi]}. ${o}`))
      }
      lines.push(`   Answer: ${q.answer}`)
      if (q.explain) lines.push(`   Why: ${q.explain}`)
      lines.push('')
    })
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(path.course || 'course')
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()}-question-bank.md`
  a.click()
  URL.revokeObjectURL(url)
}

function Pathway({ path, onClear }) {
  return (
    <div className="mt-10 animate-scale-in">
      <Panel className="relative overflow-hidden">
        <div className="absolute -left-10 -top-10 h-40 w-40 animate-drift rounded-full bg-mint/15 blur-3xl" />
        <span className="text-xs uppercase tracking-[0.3em] text-mint/80">
          Your learning path
        </span>
        <h3 className="mt-3 font-display text-4xl leading-tight text-cream sm:text-5xl">
          {path.course}
        </h3>
        {path.summary && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
            {path.summary}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{path.modules.length} modules</Pill>
          <Pill tone="mint">Basic → Advanced</Pill>
          <Pill>💾 Saved on this device</Pill>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-white/5 pt-4">
          <button
            onClick={() => downloadQuestionBank(path)}
            className="inline-flex items-center gap-1.5 rounded-full border border-mint/25 bg-mint/[0.07] px-4 py-2 text-[13px] text-mint transition-colors hover:border-mint/50"
          >
            ⬇ Download question bank
          </button>
          {onClear && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[13px] text-muted transition-colors hover:border-red-400/40 hover:text-red-300"
            >
              ✕ Clear this path
            </button>
          )}
        </div>
      </Panel>

      <div className="relative mt-8 pl-6 sm:pl-8">
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-mint/40 via-saffron/40 to-amber/40 sm:left-[11px]" />
        <div className="space-y-6">
          {path.modules.map((m, i) => (
            <ModuleCard key={i} module={m} index={i} course={path.course} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ module, index, course }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div
      className="relative animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="absolute -left-6 top-6 grid h-4 w-4 place-items-center rounded-full bg-ink ring-2 ring-saffron/50 sm:-left-8">
        <span className="h-1.5 w-1.5 rounded-full bg-saffron" />
      </span>

      <Panel className="!p-6">
        <div className="flex items-start gap-4">
          <span className="font-display text-3xl text-white/15">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wide ${
                  LEVEL_STYLE[module.level] || LEVEL_STYLE.Basic
                }`}
              >
                {module.level}
              </span>
            </div>
            <h4 className="mt-2 font-display text-2xl leading-tight text-cream">
              {module.title}
            </h4>
            {module.goal && (
              <p className="mt-1 text-[13px] text-muted">🎯 {module.goal}</p>
            )}

            {module.topics?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {module.topics.map((t, ti) => (
                  <span
                    key={ti}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-0.5 text-[12px] text-cream/90"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-saffron/70">
            ▶ Watch — one top video per topic
          </p>
          <ModuleVideos
            course={course}
            topics={module.topics}
            fallbackQuery={module.videoQuery}
          />
        </div>

        {module.questions?.length > 0 && (
          <div className="mt-5 border-t border-white/5 pt-4">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-mint/80">
                ✎ Question bank ({module.questions.length})
              </span>
              <span className="text-muted transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
                ⌄
              </span>
            </button>
            {open && (
              <div className="mt-4 space-y-3">
                {module.questions.map((q, qi) => (
                  <CurriculumQuestion key={qi} q={q} index={qi} />
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}

function ModuleVideos({ course, topics, fallbackQuery }) {
  const [state, setState] = useState({ status: 'loading', items: [] })
  const topicList = Array.isArray(topics) ? topics.filter(Boolean) : []

  useEffect(() => {
    let alive = true
    setState({ status: 'loading', items: [] })

    // With topics -> one best video per topic (full coverage).
    if (topicList.length > 0) {
      fetch('/api/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course, topics: topicList }),
      })
        .then(async (r) => {
          const data = await r.json()
          if (!alive) return
          if (r.ok && data.items?.length) {
            setState({ status: 'done', items: data.items })
          } else {
            setState({ status: 'empty', items: [] })
          }
        })
        .catch(() => alive && setState({ status: 'empty', items: [] }))
    } else {
      // No topics -> fall back to a single ranked query.
      fetch(`/api/recommend?q=${encodeURIComponent(fallbackQuery)}&limit=3`)
        .then(async (r) => {
          const data = await r.json()
          if (!alive) return
          if (r.ok && data.videos?.length) {
            setState({
              status: 'done',
              items: data.videos.map((v) => ({ topic: null, video: v })),
            })
          } else {
            setState({ status: 'empty', items: [] })
          }
        })
        .catch(() => alive && setState({ status: 'empty', items: [] }))
    }
    return () => {
      alive = false
    }
  }, [course, fallbackQuery, topicList.join('|')])

  if (state.status === 'loading')
    return (
      <div className="space-y-4">
        {topicList.slice(0, 3).map((_, i) => (
          <VideoSkeleton key={i} />
        ))}
        {topicList.length === 0 && <VideoSkeleton />}
      </div>
    )

  if (state.status === 'empty')
    return (
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(fallbackQuery || course)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-saffron hover:underline"
      >
        🔎 Search YouTube
      </a>
    )

  return (
    <div className="space-y-4">
      {state.items.map((item, i) => (
        <div key={item.video?.id || item.topic || i}>
          {item.topic && (
            <p className="mb-1.5 text-[12px] font-medium text-mint/90">
              ▸ {item.topic}
            </p>
          )}
          {item.video ? (
            <VideoCard v={item.video} rank={i + 1} />
          ) : (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query || item.topic || '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-[13px] text-saffron transition-colors hover:border-saffron/40"
            >
              🔎 No strong match — search YouTube for “{item.topic}”
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function CurriculumQuestion({ q, index }) {
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const isMcq = q.type === 'mcq' && q.options?.length > 0

  return (
    <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/5">
      <div className="flex items-start gap-3">
        <span className="font-display text-lg text-saffron/60">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-cream">{q.q}</p>

          {isMcq ? (
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, oi) => {
                const chosen = picked === oi
                const correct = opt === q.answer
                let cls =
                  'border-white/8 bg-white/[0.02] text-cream hover:border-white/20'
                if (picked != null) {
                  if (correct) cls = 'border-mint/50 bg-mint/[0.1] text-mint'
                  else if (chosen)
                    cls = 'border-red-500/50 bg-red-500/[0.1] text-red-300'
                  else cls = 'border-white/5 text-muted'
                }
                return (
                  <button
                    key={oi}
                    disabled={picked != null}
                    onClick={() => setPicked(oi)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2 text-left text-[13px] transition-all ${cls}`}
                  >
                    <span>{opt}</span>
                    {picked != null && correct && <span>✓</span>}
                    {picked != null && chosen && !correct && <span>✕</span>}
                  </button>
                )
              })}
              {picked != null && q.explain && (
                <p className="mt-1 text-[12px] text-muted">
                  <span className="text-saffron">Why:</span> {q.explain}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <button
                onClick={() => setRevealed((r) => !r)}
                className="text-[13px] text-saffron hover:underline"
              >
                {revealed ? 'Hide answer' : 'Show answer'}
              </button>
              {revealed && (
                <div className="mt-2 rounded-xl bg-white/[0.02] px-3 py-2 text-[13px] text-cream/90">
                  {q.answer}
                  {q.explain && (
                    <p className="mt-1 text-[12px] text-muted">{q.explain}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
