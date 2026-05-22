import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

const TOPIC_MAP: Record<string, string> = {
  arrays: 'Arrays & Linked Lists',
  trees: 'Trees & BST',
  sorting: 'Sorting Algorithms',
  graph: 'Graphs & Traversal',
  dp: 'Dynamic Programming',
  hashing: 'Hash Tables',
  recursion: 'Recursion',
  complexity: 'Big-O Complexity',
}

function generateTemplateQuestions(topics: string[], difficulty: string, count: number) {
  const questions = []
  const templates = [
    { q: 'What is the time complexity of accessing an element by index?', a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Access by index is O(1) due to contiguous memory.' },
    { q: 'Which data structure uses LIFO principle?', a: 'Stack', b: 'Queue', c: 'Deque', d: 'Heap', k: 'A', e: 'Stack follows Last-In-First-Out principle.' },
    { q: 'What is the worst-case time complexity of binary search?', a: 'O(log n)', b: 'O(n)', c: 'O(n log n)', d: 'O(n²)', k: 'A', e: 'Binary search halves the search space each step.' },
    { q: 'Which sorting algorithm is NOT comparison-based?', a: 'Counting Sort', b: 'Quick Sort', c: 'Merge Sort', d: 'Heap Sort', k: 'A', e: 'Counting Sort uses value ranges instead of comparisons.' },
    { q: 'What property must a BST satisfy?', a: 'Left < Parent < Right', b: 'All nodes equal', c: 'No ordering', d: 'Random order', k: 'A', e: 'BST requires left < parent < right for all nodes.' },
    { q: 'What is the space complexity of Merge Sort?', a: 'O(n)', b: 'O(1)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Merge Sort needs O(n) auxiliary space for merging.' },
    { q: 'Which data structure is used for BFS?', a: 'Queue', b: 'Stack', c: 'Heap', d: 'Tree', k: 'A', e: 'BFS uses a queue to track nodes at the current level.' },
    { q: 'What does DFS stand for?', a: 'Depth-First Search', b: 'Data-First Search', c: 'Dynamic-First Search', d: 'Deep-First Search', k: 'A', e: 'DFS explores depth before breadth.' },
  ]
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length]
    questions.push({
      id: `gen-${i}`,
      topic: topics[i % topics.length] || topics[0],
      difficulty,
      question: t.q,
      options: [t.a, t.b, t.c, t.d],
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(t.k),
      explanation: t.e,
    })
  }
  return questions
}

function toDbFormat(questions: any[]) {
  return questions.map((q: any) => ({
    question: q.question,
    optionA: q.options[0] || '',
    optionB: q.options[1] || '',
    optionC: q.options[2] || '',
    optionD: q.options[3] || '',
    correctKey: ['A', 'B', 'C', 'D'][q.correctIndex] || 'A',
    explanation: q.explanation || '',
  }))
}

function toFrontendFormat(dbQuestions: any[], topicName: string, difficulty: string) {
  return dbQuestions.map((q: any, i: number) => ({
    id: q.id,
    topic: topicName,
    difficulty,
    question: q.question,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctKey),
    explanation: q.explanation || '',
  }))
}

export async function POST(request: Request) {
  try {
    const { topics, difficulty, num_questions } = await request.json()
    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 })
    }

    const topicNames = topics.map((t: string) => TOPIC_MAP[t] || t)
    const count = Math.min(num_questions || 5, 10)
    const title = `${topicNames.join(', ')} Quiz`
    let rawQuestions: any[] = []
    let usedFallback = false

    if (groq.apiKey) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a quiz generator. Generate exactly ${count} multiple-choice questions covering these topics: ${topicNames.join(', ')}. Difficulty: ${difficulty || 'medium'}.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}

Rules:
- Each question must have exactly 4 options
- correctIndex must be 0, 1, 2, or 3
- explanations should be concise and educational
- Mix questions across all provided topics
- Make sure questions are appropriate for ${difficulty || 'medium'} difficulty level`,
            },
            { role: 'user', content: `Generate a ${difficulty || 'medium'} quiz covering: ${topicNames.join(', ')}` },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        })

        const content = completion.choices[0]?.message?.content || ''
        const jsonMatches = content.match(/\{[\s\S]*?\}/g)
        if (jsonMatches) {
          const allQuestions: any[] = []
          for (const match of jsonMatches) {
            try {
              const parsed = JSON.parse(match)
              if (parsed.questions && Array.isArray(parsed.questions)) {
                allQuestions.push(...parsed.questions)
              } else if (parsed.question) {
                allQuestions.push(parsed)
              }
            } catch { /* skip invalid fragments */ }
          }
          if (allQuestions.length > 0) rawQuestions = allQuestions
        }
      } catch (aiError) {
        console.error('Groq AI error:', aiError)
      }
    }

    if (rawQuestions.length === 0) {
      usedFallback = true
      rawQuestions = generateTemplateQuestions(topicNames, difficulty || 'medium', count).map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }))
    }

    // Find or create the topic by name with a valid course
    const topicName = topicNames[0]
    let topic = await db.topic.findFirst({ where: { name: topicName } })
    if (!topic) {
      let course = await db.course.findFirst()
      if (!course) {
        course = await db.course.create({ data: { name: 'General', code: 'GEN', teacherId: 'default' } })
      }
      topic = await db.topic.create({ data: { name: topicName, courseId: course.id } })
    }

    const dbQuestions = toDbFormat(rawQuestions)
    const quiz = await db.quiz.create({
      data: { topicId: topic.id, title, difficulty: difficulty || 'medium', timeLimit: 600 },
    })
    const created: any[] = []
    for (const q of dbQuestions) {
      const saved = await db.quizQuestion.create({ data: { quizId: quiz.id, ...q } })
      created.push(saved)
    }

    const questions = toFrontendFormat(created, topicNames[0], difficulty || 'medium')
    return NextResponse.json({ quiz_id: quiz.id, questions, title, usedFallback })
  } catch (error) {
    console.error('Quiz generate error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { quiz_id, answers, student_id, time_spent } = await request.json()
    const sid = student_id || 'stu_001'
    const questions = await db.quizQuestion.findMany({ where: { quizId: quiz_id } })
    let correctCount = 0

    const attempt = await db.quizAttempt.create({
      data: { studentId: sid, quizId: quiz_id, totalQuestions: questions.length, correctCount: 0, score: 0, timeSpent: time_spent || 0 },
    })

    for (const q of questions) {
      const selectedKey = answers[q.id]
      const isCorrect = selectedKey === q.correctKey
      if (isCorrect) correctCount++
      await db.quizAnswer.create({
        data: { attemptId: attempt.id, questionId: q.id, selectedKey: selectedKey || '', isCorrect },
      })
    }

    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0
    await db.quizAttempt.update({ where: { id: attempt.id }, data: { score, correctCount } })

    return NextResponse.json({
      attempt_id: attempt.id, score: Math.round(score * 10) / 10,
      correct: correctCount, total: questions.length,
    })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
  }
}
