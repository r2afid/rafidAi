import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    const quizzes = await db.quiz.findMany({
      where: { teacherId: { not: null } },
      include: {
        questions: true,
        topic: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const attempts = studentId
      ? await db.quizAttempt.findMany({
          where: { studentId },
          select: { quizId: true, score: true, completedAt: true },
        })
      : []

    const attemptCountMap = studentId
      ? await db.quizAttempt.groupBy({
          by: ['quizId'],
          where: { studentId },
          _count: { quizId: true },
        })
      : []

    const countMap = new Map(attemptCountMap.map(a => [a.quizId, a._count.quizId]))
    const attemptMap = new Map(attempts.map(a => [a.quizId, a]))
    const enriched = quizzes.map(q => ({
      ...q,
      myAttempt: attemptMap.get(q.id) || null,
      _count: { attempts: countMap.get(q.id) || 0 },
    }))

    return NextResponse.json({ quizzes: enriched })
  } catch (error) {
    console.error('Teacher quizzes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}
