/* The logged-out homepage. Its job is to explain what SkillPath judges videos
   on — student comments, not view counts — and send visitors to sign up. */

const VERDICT = {
  loser: {
    rank: 2,
    move: 'down',
    views: '42.9 L',
    liked: '6.6%',
    positive: 35,
    comments: [
      { text: 'Total bakwas, sirf time waste hua.', tone: 'neg' },
      { text: 'Itna confusing kyu padha rahe ho?', tone: 'neg' },
      { text: 'Nice video sir', tone: 'pos' },
    ],
  },
  winner: {
    rank: 1,
    move: 'up',
    views: '20.5 L',
    liked: '5.1%',
    positive: 75,
    comments: [
      { text: 'Bhaiya aapki wajah se DSA samajh aaya!', tone: 'pos' },
      { text: 'Mast explanation, crystal clear concepts.', tone: 'pos' },
      { text: 'Thoda fast tha but samajh aaya.', tone: 'pos' },
    ],
  },
}

const LEXICON = [
  { word: 'samajh aaya', tone: 'pos', gloss: 'I understood it' },
  { word: 'mast', tone: 'pos', gloss: 'brilliant' },
  { word: 'crystal clear', tone: 'pos', gloss: 'clear' },
  { word: 'bakwas', tone: 'neg', gloss: 'nonsense' },
  { word: 'faltu', tone: 'neg', gloss: 'useless' },
  { word: 'time waste', tone: 'neg', gloss: 'wasted my time' },
]

const FEATURES = [
  {
    title: 'Ranked by what learners said',
    body: 'Views and likes decide 60% of the score. The other 40% comes from reading the comments under each video.',
  },
  {
    title: 'It reads Hinglish',
    body: '“Samajh aaya” counts in a video’s favour. “Bakwas” counts against it. Most sentiment tools miss both.',
  },
  {
    title: 'Teachers you already trust rank higher',
    body: 'CampusX, 100xDevs, CodeWithHarry, Apna College, Striver and others get a boost — without hiding anyone else.',
  },
  {
    title: 'Your syllabus becomes a path',
    body: 'Paste it, or upload the PDF or a photo. You get ordered modules with one strong video per topic.',
  },
  {
    title: 'A question bank before exams',
    body: 'Every module comes with questions, answers and explanations. Download the lot as a Markdown file.',
  },
  {
    title: 'Your streak stays saved',
    body: 'An account keeps every path you generate, every quiz score, and a year-long map of the days you showed up.',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Create your account',
    body: 'Email and password. Nothing else, no card.',
  },
  {
    n: 2,
    title: 'Pick a topic or upload your syllabus',
    body: 'Three questions for a topic path, or one upload for a full course path.',
  },
  {
    n: 3,
    title: 'Watch, test yourself, come back tomorrow',
    body: 'Take the quiz, keep the streak, and your paths stay in your account.',
  },
]

export default function Landing() {
  return (
    <div className="bg-mesh relative min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <TopBar />
        <Hero />
        <Verdict />
        <Lexicon />
        <Features />
        <Steps />
        <FinalCta />
        <Footer />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Top bar */

function TopBar() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
      <span className="font-display text-3xl text-cream">
        Skill<span className="italic text-saffron">Path</span>
      </span>
      <nav className="flex items-center gap-2">
        <a
          href="#/auth"
          className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-cream"
        >
          Log in
        </a>
        <a
          href="#/signup"
          className="rounded-full bg-cream px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-saffron"
        >
          Create account
        </a>
      </nav>
    </header>
  )
}

/* -------------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-saffron/80">
          <span className="inline-block h-1.5 w-1.5 animate-float rounded-full bg-saffron" />
          For students learning from YouTube
        </span>

        <h1 className="mt-6 max-w-4xl font-display text-6xl leading-[0.95] tracking-tight text-cream sm:text-7xl lg:text-8xl">
          Ten lakh views doesn’t mean it{' '}
          <span className="italic text-saffron">taught</span> anyone.
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
          SkillPath reads what students actually wrote under each tutorial —
          Hinglish included — and ranks lessons by who came away understanding,
          not by who clicked. Then it turns your college syllabus into a
          week-by-week path.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#/signup"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-cream px-8 py-3.5 font-medium text-ink transition-all duration-300 hover:gap-3"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-saffron to-amber transition-transform duration-300 group-hover:translate-x-0"
              aria-hidden
            />
            <span className="relative">Create free account</span>
            <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </a>
          <a
            href="#/auth"
            className="rounded-full border border-white/10 px-7 py-3.5 text-cream transition-colors hover:border-saffron/40 hover:text-saffron"
          >
            I already have an account
          </a>
        </div>

        <p className="mt-4 text-sm text-muted">
          Free to use · your paths, quiz scores and streak are saved to your account
        </p>
      </div>
    </section>
  )
}

/* --------------------------------------------------- Signature: the verdict */

function Verdict() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-4xl leading-tight text-cream sm:text-5xl">
          Same topic. The comments disagreed with the view count.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Two real tutorials on one subject. YouTube ranks the first one higher.
          SkillPath doesn’t — because the people who watched it said it didn’t
          land.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <VerdictCard {...VERDICT.loser} />
        <VerdictCard {...VERDICT.winner} />
      </div>
    </section>
  )
}

function VerdictCard({ rank, move, views, liked, positive, comments }) {
  const up = move === 'up'
  return (
    <article
      className={`ring-hairline relative overflow-hidden rounded-3xl p-7 backdrop-blur-xl transition-colors sm:p-8 ${
        up ? 'bg-mint/[0.045]' : 'bg-white/[0.02]'
      }`}
    >
      {up && (
        <div className="absolute -right-16 -top-16 h-48 w-48 animate-drift rounded-full bg-mint/15 blur-3xl" />
      )}

      <div className="relative flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${
            up
              ? 'border-mint/30 bg-mint/[0.08] text-mint'
              : 'border-white/10 bg-white/[0.03] text-muted'
          }`}
        >
          <span aria-hidden>{up ? '▲' : '▼'}</span>
          {up ? 'Ranked #1 by SkillPath' : 'Pushed to #2'}
        </span>
        <span className="font-display text-5xl text-white/12">{rank}</span>
      </div>

      <dl className="relative mt-6 flex gap-8">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Views</dt>
          <dd className="font-display text-3xl text-cream">{views}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Liked</dt>
          <dd className="font-display text-3xl text-cream">{liked}</dd>
        </div>
        <div className="flex-1">
          <dt className="text-[11px] uppercase tracking-wider text-muted">
            Positive comments
          </dt>
          <dd
            className={`font-display text-3xl ${up ? 'text-mint' : 'text-amber'}`}
          >
            {positive}%
          </dd>
        </div>
      </dl>

      {/* Sentiment meter — the number that reorders the two cards. */}
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <span
          className={`block h-full origin-left animate-meter-fill rounded-full ${
            up ? 'bg-mint' : 'bg-amber'
          }`}
          style={{ width: `${positive}%` }}
        />
      </div>

      <ul className="relative mt-6 space-y-2.5 border-t border-white/5 pt-5">
        {comments.map((c) => (
          <li key={c.text} className="flex items-start gap-3">
            <span
              className={`mt-0.5 shrink-0 font-mono text-xs ${
                c.tone === 'pos' ? 'text-mint' : 'text-amber'
              }`}
              aria-label={c.tone === 'pos' ? 'positive' : 'negative'}
            >
              {c.tone === 'pos' ? '+1' : '−1'}
            </span>
            <span className="text-[14px] leading-snug text-cream/85">
              “{c.text}”
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

/* ------------------------------------------------------- Hinglish lexicon */

function Lexicon() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="ring-hairline rounded-3xl bg-white/[0.02] p-7 backdrop-blur-xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-4xl leading-tight text-cream sm:text-5xl">
              Indian students don’t review in English.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              They review in both at once. Standard sentiment tools read
              “bakwas” as neutral and miss the verdict entirely. SkillPath ships
              a Hinglish vocabulary built for classroom comments, so the praise
              and the complaints both count.
            </p>
          </div>

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {LEXICON.map((l) => (
              <li
                key={l.word}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
              >
                <span
                  className={`font-mono text-xs ${
                    l.tone === 'pos' ? 'text-mint' : 'text-amber'
                  }`}
                >
                  {l.tone === 'pos' ? '+1' : '−1'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-cream">
                    {l.word}
                  </span>
                  <span className="block text-[12px] text-muted">{l.gloss}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Features */

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="max-w-2xl font-display text-4xl leading-tight text-cream sm:text-5xl">
        What you get after signing up
      </h2>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="ring-hairline rounded-2xl bg-white/[0.02] p-6 transition-colors duration-300 hover:bg-white/[0.045]"
          >
            <h3 className="font-display text-2xl leading-tight text-cream">
              {f.title}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
              {f.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- Steps */

function Steps() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-16">
        <h2 className="font-display text-4xl leading-tight text-cream sm:text-5xl lg:max-w-xs">
          Three steps to your first path
        </h2>

        <ol className="space-y-5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5 border-t border-white/5 pt-5">
              <span className="font-mono text-sm text-saffron">0{s.n}</span>
              <div>
                <h3 className="font-display text-2xl leading-tight text-cream">
                  {s.title}
                </h3>
                <p className="mt-1 text-[14px] text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="ring-hairline relative overflow-hidden rounded-3xl bg-white/[0.025] p-10 text-center backdrop-blur-xl sm:p-14">
        <div className="absolute -right-10 -top-10 h-48 w-48 animate-drift rounded-full bg-saffron/15 blur-3xl" />
        <h2 className="relative mx-auto max-w-2xl font-display text-4xl leading-tight text-cream sm:text-6xl">
          Start with one topic tonight.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Pick something you’ve been putting off. You’ll have a ranked set of
          lessons and a quiz in under a minute.
        </p>
        <a
          href="#/signup"
          className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-full bg-cream px-8 py-3.5 font-medium text-ink transition-all duration-300 hover:gap-3"
        >
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-saffron to-amber transition-transform duration-300 group-hover:translate-x-0"
            aria-hidden
          />
          <span className="relative">Create free account</span>
          <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </a>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Footer */

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl space-y-3 border-t border-white/5 px-5 py-8 text-xs text-muted">
      <div className="flex items-center justify-between">
        <span>SkillPath</span>
        <span>Curated for Indian learners · 🇮🇳</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
  )
}
