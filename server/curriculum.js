// Curriculum -> structured learning path, powered by OpenAI.
import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const MAX_CHARS = 14000

class CurriculumError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

// Extract plain text from an uploaded PDF buffer.
export async function pdfToText(buffer) {
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return (result.text || '').trim()
  } finally {
    await parser.destroy().catch(() => {})
  }
}

const SYSTEM_PROMPT = `You are an expert curriculum designer and CS/engineering educator who builds learning paths for Indian college students. Given a raw course syllabus / curriculum, you produce a clear, ordered learning path that takes a student from absolute basics to advanced mastery, covering EVERY topic mentioned in the curriculum (do not skip any). Group related topics into logical modules ordered by increasing difficulty.

Return ONLY valid JSON (no markdown) matching exactly this shape:
{
  "course": "short course name inferred from the curriculum",
  "summary": "2-3 sentence overview of what the student will learn and the journey",
  "modules": [
    {
      "title": "module name",
      "level": "Basic" | "Intermediate" | "Advanced",
      "goal": "one sentence on what the student can do after this module",
      "topics": ["specific topic 1", "specific topic 2", "..."],
      "videoQuery": "a concise YouTube search query (in English) that finds the best tutorial for this module for Indian students",
      "questions": [
        {
          "q": "question text",
          "type": "mcq" | "short",
          "options": ["A", "B", "C", "D"],   // EXACTLY 4 options when type is mcq; omit/empty for short
          "answer": "the exact correct option text (mcq) or a concise model answer (short)",
          "explain": "one-line explanation of the answer"
        }
      ]
    }
  ]
}

Rules:
- 4 to 8 modules, ordered Basic -> Intermediate -> Advanced.
- Cover ALL topics from the curriculum across the modules.
- 4 to 6 questions per module, mixing "mcq" and "short", progressing in difficulty.
- For mcq, "answer" MUST be identical to one of the "options" strings.
- Keep everything practical and exam/interview relevant.`

export async function analyzeCurriculum({ text, imageDataUrl, key }) {
  if (!key) throw new CurriculumError('NO_OPENAI_KEY', 503)
  if (!text && !imageDataUrl)
    throw new CurriculumError('No curriculum provided', 400)

  const client = new OpenAI({ apiKey: key })

  const userContent = []
  if (text) {
    userContent.push({
      type: 'text',
      text: `Here is the course curriculum:\n\n"""\n${text.slice(0, MAX_CHARS)}\n"""`,
    })
  }
  if (imageDataUrl) {
    userContent.push({
      type: 'text',
      text: 'The curriculum is in the attached image. Read all text from it.',
    })
    userContent.push({ type: 'image_url', image_url: { url: imageDataUrl } })
  }

  let resp
  try {
    resp = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })
  } catch (err) {
    const status = err?.status || 500
    const msg =
      status === 401
        ? 'Invalid OpenAI API key'
        : status === 429
          ? 'OpenAI rate limit / quota exceeded'
          : err?.message || 'OpenAI request failed'
    throw new CurriculumError(msg, status)
  }

  const raw = resp.choices?.[0]?.message?.content || '{}'
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    throw new CurriculumError('Model returned invalid JSON', 502)
  }

  // Light normalization / guard rails.
  if (!Array.isArray(data.modules)) data.modules = []
  data.modules = data.modules.map((m, i) => ({
    title: m.title || `Module ${i + 1}`,
    level: ['Basic', 'Intermediate', 'Advanced'].includes(m.level)
      ? m.level
      : 'Basic',
    goal: m.goal || '',
    topics: Array.isArray(m.topics) ? m.topics : [],
    videoQuery: m.videoQuery || m.title || data.course || '',
    questions: Array.isArray(m.questions)
      ? m.questions
          .map((q) => {
            const options = Array.isArray(q.options)
              ? q.options.slice(0, 4).map((o) => String(o))
              : []
            let type = q.type === 'short' ? 'short' : 'mcq'
            let answer = String(q.answer ?? '')
            if (type === 'mcq') {
              // The model sometimes returns an answer that doesn't exactly
              // match an option; snap it to the matching option, or fall back
              // to short-answer so the UI never marks every choice wrong.
              const match = options.find(
                (o) => o.trim().toLowerCase() === answer.trim().toLowerCase(),
              )
              if (match) answer = match
              else type = 'short'
            }
            return {
              q: q.q || '',
              type,
              options: type === 'mcq' ? options : [],
              answer,
              explain: q.explain || '',
            }
          })
          .filter((q) => q.q)
      : [],
  }))

  return {
    course: data.course || 'Your Course',
    summary: data.summary || '',
    modules: data.modules,
    model: MODEL,
  }
}

export { CurriculumError }
