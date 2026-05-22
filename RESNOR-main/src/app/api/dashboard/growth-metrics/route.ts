import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    // 1. User info
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, studentId: true, institution: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 2. Student progress (XP / level)
    const progress = await db.studentProgress.findUnique({ where: { studentId } })

    // 3. Material progress
    const allProgress = await db.materialProgress.findMany({
      where: { studentId },
      include: { material: { include: { topic: true } } },
    })
    const total = allProgress.length
    const done = allProgress.filter(p => p.completionStatus === 'done').length
    const inProgress = allProgress.filter(p => p.completionStatus === 'in_progress').length
    const pending = total - done - inProgress

    // 4. Quiz attempts
    const attempts = await db.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { include: { topic: true } } },
      orderBy: { completedAt: 'desc' },
    })
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.correctCount / a.totalQuestions) * 100, 0) / attempts.length * 10) / 10
      : 0
    const highScoreQuizCount = attempts.filter(a => a.totalQuestions > 0 && (a.correctCount / a.totalQuestions) >= 0.8).length

    // 5. Streak
    const streak = await db.streak.findUnique({ where: { studentId } })

    // 6. Engagement
    const engagement = await db.engagementScore.findUnique({ where: { studentId } })

    // 7. Total study time (seconds -> minutes)
    const totalTimeMinutes = Math.floor(allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)

    // 8. Topic performance over time (weekly bins)
    const topicScoresRaw: Record<string, { score: number; date: string; correctCount: number; totalQuestions: number; quizTitle: string }[]> = {}
    for (const a of attempts) {
      const topicName = a.quiz?.topic?.name || 'Unknown'
      if (!topicScoresRaw[topicName]) topicScoresRaw[topicName] = []
      topicScoresRaw[topicName].push({
        score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
        date: a.completedAt.toISOString().split('T')[0],
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
        quizTitle: a.quiz?.title || 'Unknown Quiz',
      })
    }

    // 9. Weekly activity (last 7 days)
    const now = new Date()
    const weeklyActivity: { day: string; hours: number }[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)
      const dayMs = allProgress
        .filter(p => {
          const la = new Date(p.lastAccessedAt)
          return la >= dayStart && la <= dayEnd
        })
        .reduce((sum, p) => sum + p.timeSpent, 0)
      weeklyActivity.push({ day: dayNames[d.getDay()], hours: Math.round(dayMs / 3600 * 10) / 10 })
    }

    // 10. Materials completed today (for welcome banner)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const materialsToday = allProgress.filter(p => {
      const la = new Date(p.lastAccessedAt)
      return la >= todayStart && la <= todayEnd && p.completionStatus === 'done'
    }).length

    return NextResponse.json({
      user: { name: user.name, email: user.email, studentId: user.studentId, institution: user.institution },
      progress: progress ? { xp: progress.xp, level: progress.level } : null,
      materialProgress: { total, done, inProgress, pending },
      quizAttempts: attempts.slice(0, 5).map(a => ({
        id: a.id,
        title: a.quiz?.title || 'Unknown Quiz',
        score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
        date: a.completedAt.toISOString().split('T')[0],
      })),
      averageQuizScore: avgScore,
      totalQuizAttempts: attempts.length,
      highScoreQuizCount,
      streak: streak
        ? { current: streak.currentStreak, longest: streak.longestStreak, totalDays: streak.totalActiveDays }
        : null,
      totalTimeMinutes,
      materialsToday,
      weeklyActivity,
      topicScores: topicScoresRaw,
      engagement: engagement
        ? {
            overallScore: engagement.overallScore,
            consistency: engagement.studyConsistencyRate,
            avgSession: engagement.avgSessionDuration,
            weeklyHours: engagement.weeklyActiveHours,
            interactionDensity: engagement.interactionDensity,
          }
        : null,
    })
  } catch (error) {
    console.error('Growth metrics error:', error)
    return NextResponse.json({ error: 'Failed to fetch growth metrics' }, { status: 500 })
  }
}
