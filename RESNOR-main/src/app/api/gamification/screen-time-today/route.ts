import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const now = new Date()
    const tzOffset = parseInt(searchParams.get('tz') || '0')
    const localNow = new Date(now.getTime() + tzOffset * 60000)
    const todayStart = new Date(new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()).getTime() - tzOffset * 60000)

    const result = await db.telemetryRecord.aggregate({
      where: {
        studentId,
        pageId: { in: STUDY_PAGE_IDS },
        createdAt: { gte: todayStart },
      },
      _sum: { activeSeconds: true },
    })

    const totalSeconds = result._sum.activeSeconds || 0

    return NextResponse.json({ totalSeconds })
  } catch (error) {
    console.error('Screen time error:', error)
    return NextResponse.json({ error: 'Failed to fetch screen time' }, { status: 500 })
  }
}
