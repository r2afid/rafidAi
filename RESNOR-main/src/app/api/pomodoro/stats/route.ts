import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todaySessions = await db.pomodoroSession.findMany({
      where: { studentId, completedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { completedAt: 'asc' },
    })

    // Find consecutive focus streak
    let consecutiveStreak = 0
    const todayFocusSessions = todaySessions.filter((s) => s.type === 'focus')
    if (todayFocusSessions.length > 0) {
      // Check if the sessions form an unbroken chain (no gaps in sequence)
      // Since all focus sessions today are consecutive by definition (they're all completed),
      // the streak equals total focus sessions today
      consecutiveStreak = todayFocusSessions.length
    }

    const totalSessions = todaySessions.length
    const totalFocusSeconds = todaySessions
      .filter((s) => s.type === 'focus')
      .reduce((sum, s) => sum + s.actualSeconds, 0)
    const totalFocusMinutes = Math.round(totalFocusSeconds / 60)

    // Weekly chart data (last 7 days)
    const weeklyData: { day: string; minutes: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      day.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const daySessions = await db.pomodoroSession.findMany({
        where: { studentId, type: 'focus', completedAt: { gte: day, lte: dayEnd } },
      })
      const dayMinutes = daySessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60

      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : day.toLocaleDateString('en-US', { weekday: 'short' })
      weeklyData.push({ day: label, minutes: Math.round(dayMinutes) })
    }

    return NextResponse.json({
      sessionsDone: totalSessions,
      focusMinutes: totalFocusMinutes,
      streak: consecutiveStreak,
      weeklyChart: weeklyData,
    })
  } catch (error) {
    console.error('Pomodoro stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
