import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const quizzes = await db.quiz.findMany({
      where: { teacherId: { not: null } },
      include: {
        questions: true,
        topic: { select: { name: true, courseId: true, course: { select: { name: true } } } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Teacher quizzes error:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    const body = await request.json()
    const { title, topicId, difficulty, timeLimit, questions, dueDate, courseId, maxAttempts } = body

    if (!title || !questions?.length) {
      return NextResponse.json({ error: 'Title and questions are required' }, { status: 400 })
    }

    // Resolve topic — accept either a topic ID or topic name
    let resolvedTopicId = ''
    const targetCourseId = courseId || (await db.course.findFirst())?.id || ''

    const topicByName = await db.topic.findFirst({ where: { name: topicId } })
    if (topicByName) {
      resolvedTopicId = topicByName.id
    } else {
      const topicById = await db.topic.findUnique({ where: { id: topicId } })
      if (topicById) {
        resolvedTopicId = topicById.id
      } else if (topicId && targetCourseId) {
        const newTopic = await db.topic.create({ data: { name: topicId, courseId: targetCourseId } })
        resolvedTopicId = newTopic.id
      } else {
        resolvedTopicId = (await db.topic.findFirst())?.id || ''
      }
    }

    const quiz = await db.quiz.create({
      data: {
        title,
        topicId: resolvedTopicId,
        difficulty: difficulty || 'medium',
        timeLimit: timeLimit || 600,
        maxAttempts: typeof maxAttempts === 'number' ? maxAttempts : 3,
        teacherId: teacherId || 'teacher_001',
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        questions: {
          create: questions.map((q: any) => ({
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctKey: q.correctKey,
            explanation: q.explanation || '',
          })),
        },
      },
      include: { questions: true },
    })

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const existing = await db.quiz.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Delete quiz answers first, then attempts, then questions, then quiz
    await db.quizAnswer.deleteMany({ where: { attempt: { quizId: id } } })
    await db.quizAttempt.deleteMany({ where: { quizId: id } })
    await db.quizQuestion.deleteMany({ where: { quizId: id } })
    await db.quiz.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }
}
