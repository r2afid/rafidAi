import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 })

    const attempts = await db.quizAttempt.findMany({
      where: { studentId },
      orderBy: { completedAt: 'desc' },
      include: {
        quiz: { select: { id: true, title: true, difficulty: true, timeLimit: true } },
        answers: {
          include: {
            question: {
              select: { id: true, question: true, optionA: true, optionB: true, optionC: true, optionD: true, correctKey: true, explanation: true },
            },
          },
        },
      },
    })

    const mapped = attempts.map(a => ({
      ...a,
      score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
    }))
    return NextResponse.json({ attempts: mapped })
  } catch (error) {
    console.error('Quiz history error:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz history' }, { status: 500 })
  }
}
