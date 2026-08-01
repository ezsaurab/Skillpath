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
src/
  App.jsx        Questionnaire → results → quiz → curriculum UI
  data/tracks.js Topics, search queries, fallback videos, quiz questions
```
