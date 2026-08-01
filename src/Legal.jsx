// Privacy Policy & Terms of Service pages (hash-routed: #/privacy, #/terms).
// Content covers the disclosures required by the YouTube API Services
// Developer Policies (III.A): API usage notice, Google Privacy Policy link,
// data collection/storage/deletion, and YouTube ToS agreement.
import React from 'react'

const EFFECTIVE_DATE = 'July 2, 2026'
const CONTACT_EMAIL = 'itanishqmodi@gmail.com'

function LegalLayout({ title, children }) {
  return (
    <div className="bg-mesh relative min-h-screen overflow-x-hidden">
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <header>
          <a href="#/" className="font-display text-3xl tracking-tight text-cream">
            Skill<span className="italic text-saffron">Path</span>
          </a>
          <h1 className="mt-6 font-display text-4xl tracking-tight text-cream">
            {title}
          </h1>
          <p className="mt-2 text-xs text-muted">Effective date: {EFFECTIVE_DATE}</p>
        </header>

        <main className="ring-hairline mt-8 space-y-6 rounded-3xl bg-white/[0.025] p-7 text-[15px] leading-relaxed text-muted backdrop-blur-xl sm:p-8">
          {children}
        </main>

        <footer className="mt-10 flex items-center justify-between border-t border-white/5 pt-6 text-xs text-muted">
          <a href="#/" className="hover:text-cream">← Back to SkillPath</a>
          <span className="flex gap-4">
            <a href="#/privacy" className="hover:text-cream">Privacy Policy</a>
            <a href="#/terms" className="hover:text-cream">Terms of Service</a>
          </span>
        </footer>
      </div>
    </div>
  )
}

const H = ({ children }) => (
  <h2 className="pt-2 font-display text-xl text-cream">{children}</h2>
)

const A = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="text-saffron underline decoration-saffron/40 underline-offset-2 hover:decoration-saffron"
  >
    {children}
  </a>
)

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        SkillPath (&ldquo;we&rdquo;, &ldquo;our&rdquo;) helps students find the best
        YouTube tutorials for the skills they want to learn. This policy explains
        what data SkillPath handles and how.
      </p>

      <H>Use of YouTube API Services</H>
      <p>
        SkillPath uses <strong className="text-cream">YouTube API Services</strong> to
        search for publicly available videos and to read their public statistics
        (view counts, like counts) and public comments, which we use to rank
        recommendations. By using SkillPath you also agree to be bound by the{' '}
        <A href="https://www.youtube.com/t/terms">YouTube Terms of Service</A>.
        Google&rsquo;s handling of your data is described in the{' '}
        <A href="https://policies.google.com/privacy">Google Privacy Policy</A>.
      </p>

      <H>What data we collect</H>
      <p>
        SkillPath does <strong className="text-cream">not</strong> require an account
        and does <strong className="text-cream">not</strong> access, collect, or store
        any personal information from you or from your YouTube / Google account. We
        never see your YouTube identity, and no data about you is sent to YouTube:
        API requests are made from our server using our own API key and contain only
        the learning topic being searched.
      </p>
      <p>
        Your questionnaire answers (interests, level, goals) are stored only in your
        own browser&rsquo;s local storage so you can resume where you left off. They
        never leave your device except as anonymous topic searches. If you upload a
        syllabus, its text is processed to build your learning path and is not linked
        to any identity.
      </p>

      <H>Stored API data &amp; retention</H>
      <p>
        To reduce repeated API calls, SkillPath temporarily caches YouTube API
        responses (video titles, channel names, thumbnails, public statistics, and
        aggregated comment sentiment) on our server for{' '}
        <strong className="text-cream">a maximum of 6 hours</strong>, after which the
        cache entries expire and are deleted automatically. We do not build profiles,
        we do not store comment text beyond the sentiment computation, and we do not
        share any data with third parties.
      </p>

      <H>Cookies</H>
      <p>
        SkillPath itself does not set tracking cookies and serves no advertising.
        Watching a recommended video happens on YouTube itself, under YouTube&rsquo;s
        own policies.
      </p>

      <H>Data deletion &amp; contact</H>
      <p>
        You can clear the questionnaire data at any time by clearing your browser
        storage for this site (it is the only place your answers exist). Server-side
        cached API data expires automatically within 6 hours. For any privacy
        question or deletion request, contact us at{' '}
        <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A> and we will respond
        promptly. You can also manage the data Google holds about you via the{' '}
        <A href="https://myaccount.google.com/permissions">
          Google security settings page
        </A>
        .
      </p>

      <H>Changes</H>
      <p>
        If this policy changes materially we will update this page and its effective
        date.
      </p>
    </LegalLayout>
  )
}

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        By using SkillPath you agree to these terms. SkillPath is a free,
        educational tool that recommends publicly available YouTube tutorials for
        Indian students.
      </p>

      <H>YouTube API Services</H>
      <p>
        SkillPath is an API client of YouTube API Services. By using SkillPath, you
        agree to be bound by the{' '}
        <A href="https://www.youtube.com/t/terms">YouTube Terms of Service</A> and
        acknowledge the{' '}
        <A href="https://policies.google.com/privacy">Google Privacy Policy</A>. All
        video content, thumbnails, statistics, and channel information shown in
        SkillPath belong to their respective owners and are provided by YouTube;
        videos play on YouTube via direct links.
      </p>

      <H>Acceptable use</H>
      <p>
        You may use SkillPath only for personal, non-commercial learning. You may
        not scrape, redistribute, or resell data shown by SkillPath, attempt to
        overload the service, or use it to violate YouTube&rsquo;s policies.
      </p>

      <H>No warranty</H>
      <p>
        SkillPath is provided &ldquo;as is&rdquo;, without warranty of any kind.
        Rankings are automated estimates based on public signals (views, likes,
        comment sentiment) and may not suit every learner. We are not affiliated
        with YouTube or Google, and we are not responsible for the content of
        recommended videos.
      </p>

      <H>Termination &amp; changes</H>
      <p>
        We may modify or discontinue the service, or update these terms, at any
        time; continued use after an update constitutes acceptance. Material changes
        will be reflected in the effective date above.
      </p>

      <H>Contact</H>
      <p>
        Questions about these terms:{' '}
        <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.
      </p>
    </LegalLayout>
  )
}
