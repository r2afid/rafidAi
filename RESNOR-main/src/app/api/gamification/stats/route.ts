import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const [quizCount, questionsCount, materialsCount, activeDays] = await Promise.all([
      // Total quizzes taken
      db.quizAttempt.count({ where: { studentId } }),

      // Total questions answered across all attempts
      db.quizAnswer.count({
        where: { attempt: { studentId } },
      }),

      // Materials completed
      db.materialProgress.count({
        where: { studentId, completionStatus: 'done' },
      }),

      // Total unique active days from telemetry
      db.telemetryRecord.findMany({
        where: {
          studentId,
          tabFocused: true,
          pageId: { in: ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard'] },
        },
        select: { createdAt: true },
      }).then((records) => {
        const days = new Set<string>()
        for (const r of records) {
          days.add(`${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}-${String(r.createdAt.getDate()).padStart(2, '0')}`)
        }
        return days.size
      }),
    ])

    return NextResponse.json({
      quizzesTaken: quizCount,
      materialsDone: materialsCount,
      activeDays,
      questionsAnswered: questionsCount,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
