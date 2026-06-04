import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

async function generateWithAI(topic: string, difficulty: string, count: number) {
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a quiz generator. Generate exactly ${count} multiple-choice questions about: "${topic}". Difficulty: ${difficulty || 'medium'}.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}

Rules:
- Each question must have exactly 4 options
- correctIndex must be 0, 1, 2, or 3
- explanations should be concise and educational
- Vary the correct answer position across questions`,
          },
          { role: 'user', content: `Generate a ${difficulty || 'medium'} quiz about: ${topic}` },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      })

      const content = completion.choices[0]?.message?.content || ''
      let clean = content.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim()
      const outerMatch = clean.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*\]\s*\}/)
      if (outerMatch) {
        try {
          let raw = outerMatch[0]
            .replace(/[\x00-\x1F\x7F]/g, '')
            .replace(/,\s*([\]}])/g, '$1')
          const parsed = JSON.parse(raw)
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return parsed.questions
          }
        } catch { /* fall through */ }
      }
      // Try individual extraction
      const individualMatches = clean.match(/\{[^{}]*"question"\s*:\s*"[^"]*"[^{}]*\}/g)
      if (individualMatches) {
        const results: any[] = []
        for (const match of individualMatches) {
          try {
            const parsed = JSON.parse(match)
            if (parsed.question) results.push(parsed)
          } catch { /* skip */ }
        }
        if (results.length > 0) return results
      }
    } catch (aiError: any) {
      const isRateLimit = aiError?.status === 429 || (aiError?.error?.error?.code === 'rate_limit_exceeded')
      if (isRateLimit && attempt < maxRetries) {
        const waitMs = attempt * 5000
        await new Promise(r => setTimeout(r, waitMs))
        continue
      }
      console.error('Groq AI error:', aiError)
    }
  }
  return null
}

function generateTemplateQuestions(topic: string, count: number) {
  const templates = [
    { q: `What is the primary concept behind ${topic}?`, a: 'The fundamental principle that governs the subject', b: 'A random collection of ideas', c: 'An unrelated concept', d: 'None of the above', k: 'A', e: `The primary concept forms the foundation of ${topic}.` },
    { q: `Which of the following best describes ${topic}?`, a: 'A systematic approach to problem-solving', b: 'A random process', c: 'An unstructured method', d: 'A guessing game', k: 'A', e: `${topic} provides a structured way to approach problems.` },
    { q: `What is a key application of ${topic}?`, a: 'Solving real-world problems efficiently', b: 'Creating unnecessary complexity', c: 'Avoiding technical challenges', d: 'Reducing productivity', k: 'A', e: `${topic} helps solve practical problems in an efficient manner.` },
    { q: `How does ${topic} improve efficiency?`, a: 'By optimizing resource usage', b: 'By adding more steps', c: 'By making things slower', d: 'By ignoring constraints', k: 'A', e: `Optimization is a core benefit of understanding ${topic}.` },
    { q: `What prerequisite knowledge is helpful for ${topic}?`, a: 'Basic understanding of core concepts', b: 'No prior knowledge needed', c: 'Advanced expertise only', d: 'Only theoretical background', k: 'A', e: `A solid foundation in basics helps grasp ${topic} more effectively.` },
    { q: `Which approach is commonly used in ${topic}?`, a: 'Divide and conquer', b: 'Random trial and error', c: 'Brute force only', d: 'Pure intuition', k: 'A', e: `Divide and conquer is a widely adopted strategy in ${topic}.` },
  ]
  const questions: any[] = []
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length]
    questions.push({
      question: t.q,
      options: [t.a, t.b, t.c, t.d],
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(t.k),
      explanation: t.e,
    })
  }
  return questions
}

export async function POST(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    const body = await request.json()
    const { topic, difficulty, questionCount, courseId } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const count = Math.min(Math.max(questionCount || 5, 1), 15)

    let rawQuestions = await generateWithAI(topic, difficulty || 'medium', count)
    const usedFallback = !rawQuestions

    if (!rawQuestions) {
      rawQuestions = generateTemplateQuestions(topic, count)
    }

    // Resolve course
    let targetCourseId = courseId
    if (!targetCourseId) {
      const firstCourse = await db.course.findFirst()
      if (firstCourse) {
        targetCourseId = firstCourse.id
      } else {
        return NextResponse.json({ error: 'No courses available. Create a course first.' }, { status: 400 })
      }
    }

    // Resolve topic — find existing or create
    let topicRecord = await db.topic.findFirst({
      where: { name: topic, courseId: targetCourseId },
    })
    if (!topicRecord) {
      topicRecord = await db.topic.create({
        data: { name: topic, courseId: targetCourseId },
      })
    }

    // Create quiz with teacherId
    const quiz = await db.quiz.create({
      data: {
        title: `${topic} Quiz`,
        topicId: topicRecord.id,
        difficulty: difficulty || 'medium',
        timeLimit: 600,
        maxAttempts: 3,
        teacherId: teacherId || undefined,
        questions: {
          create: rawQuestions.map((q: any) => ({
            question: q.question,
            optionA: q.options[0] || '',
            optionB: q.options[1] || '',
            optionC: q.options[2] || '',
            optionD: q.options[3] || '',
            correctKey: ['A', 'B', 'C', 'D'][q.correctIndex] || 'A',
            explanation: q.explanation || '',
          })),
        },
      },
      include: {
        questions: true,
        topic: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    })

    return NextResponse.json({
      quiz,
      usedFallback,
      message: usedFallback
        ? 'AI generation unavailable. Used template questions instead.'
        : `AI-generated quiz "${quiz.title}" created with ${rawQuestions.length} questions.`,
    })
  } catch (error) {
    console.error('Teacher AI quiz generate error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
