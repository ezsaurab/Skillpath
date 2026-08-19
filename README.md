# 🚀 SkillPath — YouTube learning recommender for Indian students

Answer three quick questions about your interests → get **live, ranked YouTube
videos** and a **practice quiz** for the skills you want to learn. Or upload
your **college syllabus** and get an AI-generated learning path with topic-wise
videos and a downloadable question bank.

## How recommendations are ranked

For each topic the backend queries the **YouTube Data API** (regionCode = India)
and scores every result by:

| Signal | Weight | Source |
| --- | --- | --- |
| Views (log-scaled) | 40% | `videos.statistics.viewCount` |
| Like ratio | 20% | `likeCount / viewCount` |
| Positive comment sentiment | 40% | top ~20 comments, Hinglish-aware lexicon |

The sentiment signal is the differentiator: what students *say after watching*
("samajh aaya!", "best teacher" vs. "too fast", "bakwas") is scored with a
custom Hinglish-aware lexicon and folded straight into the ranking — so a
smaller video that learners loved outranks a bigger one that confused them.

Then **trusted Indian-student channels are boosted** (bounded multiplier on the
final score) so they rise to the top — without excluding anyone else:

> CampusX · 100xDevs/Harkirat · CodeWithHarry · Apna College · take U forward
> (Striver) · Telusko · Krish Naik · codebasics · Love Babbar · Kunal Kushwaha

Edit the list in [`server/channels.js`](server/channels.js).

## Curriculum mode

Paste or upload your syllabus (text / PDF / photo) and GPT-4o-mini maps it into
ordered modules — each with learning outcomes, a distinct best-match video per
topic, and an auto-generated question bank you can download as Markdown.

## Accounts & learning tracker

Visitors land on a marketing page explaining how the ranking works; the
questionnaire and curriculum tools open once you sign in. New accounts go
straight to the questionnaire, returning users to their dashboard.

Sign up with an email and password to unlock a personal dashboard at `#/account`:

- **Activity heatmap** — a GitHub-style contribution grid of the last 52 weeks,
  built from every login, generated path and completed quiz.
- **Streaks** — current and longest run of consecutive active days, plus total
  active days.
- **Saved pathways** — every interest path and curriculum path you generate is
  stored automatically and can be reopened or deleted later.
- **Quiz history** — past scores with colour-coded pass bands.
- **Recent activity** — a timestamped feed of your last actions.

Passwords are hashed with bcrypt and sessions use a signed, `httpOnly` JWT
cookie. Accounts live in a local SQLite file (`server/data/skillpath.db`,
gitignored) — nothing to provision.

## Setup

```bash
npm install
cp .env.example .env        # then paste your keys into .env
npm run dev:all             # web on :5173, api on :8787
```

`.env` keys:

| Variable | Required | Purpose |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | yes | video search, stats, comments |
| `OPENAI_API_KEY` | for curriculum mode | syllabus → learning path + questions |
| `REDIS_URL` | optional | shared cache; falls back to in-memory automatically |
| `JWT_SECRET` | optional | session signing key; auto-generated and persisted if unset |
| `ALLOWED_ORIGINS` | optional | comma-separated CORS allowlist (defaults to the dev ports) |

### Getting a free YouTube Data API key (~3 min)

1. Go to <https://console.cloud.google.com/> and create a project.
2. **APIs & Services → Library →** enable **"YouTube Data API v3"**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Paste it into `.env` as `YOUTUBE_API_KEY=...` and restart `npm run dev:all`.

Free quota is 10,000 units/day. A fresh topic search costs ~110 units and
ranked results are cached (Redis, 6 h TTL), so repeats are free.

> Without a key the app still works — it falls back to a hand-curated video list
> and the quiz.

## Project layout

```
server/
  index.js       Express API (recommend / coverage / curriculum / health)
  youtube.js     Search → stats → comments → composite ranking
  sentiment.js   Hinglish-aware positive/negative comment scoring
  channels.js    Boosted Indian-student channels
  curriculum.js  GPT-4o-mini syllabus parsing + question-bank generation
  cache.js       Redis-first cache with bounded in-memory fallback
  db.js          SQLite schema (users, events, pathways, quiz results)
  auth.js        Signup / login / logout / session + activity logging
  account.js     Activity heatmap, streaks, saved pathways, quiz history
src/
  App.jsx        Routing + questionnaire → results → quiz → curriculum UI
  Landing.jsx    Logged-out homepage: how the ranking works, signup CTAs
  auth.jsx       Auth context + account-sync helpers
  Account.jsx    Login / signup screen and the account dashboard
  data/tracks.js Topics, search queries, fallback videos, quiz questions
```

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/auth/signup` · `login` · `logout`, `GET /api/auth/me` | accounts & session |
| `GET /api/me/activity` | heatmap days, streaks, totals, recent events |
| `GET` · `POST` · `DELETE /api/me/pathways` | saved learning paths |
| `GET` · `POST /api/me/quizzes` | quiz score history |
| `GET /api/recommend`, `POST /api/coverage` | ranked videos |
| `POST /api/curriculum` | syllabus → learning path |
