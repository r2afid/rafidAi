import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const LEVEL_TITLES = ['', 'Beginner', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend']

function findLevel(xp: number): number {
  let lv = 1
  while (xp >= 500 * lv * (lv - 1) / 2) lv++
  return lv
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    // 1. User info
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, studentId: true, institution: true, phone: true, semester: true, avatar: true, bio: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Progress
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    })

    const xp = progress?.xp || 0
    const level = progress?.level || findLevel(xp)
    const currentLevelXP = xp - (500 * level * (level - 1) / 2)
    const nextLevelXP = 500 * level
    const prevLevelXP = 500 * (level - 1) * (level - 2) / 2
    const xpProgress = nextLevelXP > 0 ? Math.round((currentLevelXP / nextLevelXP) * 100) : 0

    // 3. Streak
    const streak = await db.streak.findUnique({ where: { studentId } })

    // 4. Badges
    const badges = await db.badge.findMany()
    const earnedBadges = await db.earnedBadge.findMany({
      where: { studentId },
      include: { badge: true },
    })
    const earnedBadgeIds = new Set(earnedBadges.map(e => e.badgeId))
    const earnedBadgeMap = new Map(earnedBadges.map(e => [e.badgeId, e.earnedAt]))

    const allBadges = badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      earned: earnedBadgeIds.has(b.id),
      earnedAt: earnedBadgeMap.get(b.id) || null,
    }))

    // 5. Quiz stats (academic overview)
    const quizAttempts = await db.quizAttempt.findMany({
      where: { studentId },
      select: { score: true, totalQuestions: true, correctCount: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
    })

    const totalQuizzes = quizAttempts.length
    const avgScore = totalQuizzes > 0
      ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.totalQuestions > 0 ? (q.correctCount / q.totalQuestions) * 100 : 0), 0) / totalQuizzes)
      : 0
    const totalCorrect = quizAttempts.reduce((sum, q) => sum + q.correctCount, 0)
    const totalQuestions = quizAttempts.reduce((sum, q) => sum + q.totalQuestions, 0)

    // 6. Material progress (courses)
    const materialProgress = await db.materialProgress.findMany({
      where: { studentId },
      include: {
        material: {
          select: { id: true, title: true, topic: { select: { id: true, name: true, course: { select: { id: true, name: true, code: true } } } } },
        },
      },
    })

    // Group by course
    const courseMap = new Map<string, { code: string; name: string; total: number; completed: number }>()
    for (const mp of materialProgress) {
      const course = mp.material.topic.course
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, { code: course.code, name: course.name, total: 0, completed: 0 })
      }
      const entry = courseMap.get(course.id)!
      entry.total++
      if (mp.completionStatus === 'done') entry.completed++
    }

    const courses = Array.from(courseMap.values())

    // 6b. Enrollments (institution courses with attendance)
    const enrollments = await db.enrollment.findMany({
      where: { studentId },
      include: { course: { select: { id: true, code: true, name: true } } },
      orderBy: { course: { code: 'asc' } },
    })

    const totalAttendance = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.attendance, 0) / enrollments.length)
      : 0

    // 7. Study activity (last 12 weeks = 84 days)
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 83)
    startDate.setHours(0, 0, 0, 0)

    const telemetry = await db.telemetryRecord.findMany({
      where: {
        studentId,
        tabFocused: true,
        createdAt: { gte: startDate },
      },
      select: { activeSeconds: true, createdAt: true },
    })

    const dayMap = new Map<string, number>()
    for (const t of telemetry) {
      const key = toLocalDateStr(t.createdAt)
      dayMap.set(key, (dayMap.get(key) || 0) + Math.round(t.activeSeconds / 60))
    }

    const activity: number[] = []
    for (let i = 0; i < 84; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = toLocalDateStr(d)
      const mins = dayMap.get(key) || 0
      if (mins === 0) activity.push(0)
      else if (mins <= 30) activity.push(1)
      else if (mins <= 60) activity.push(2)
      else if (mins <= 120) activity.push(3)
      else activity.push(4)
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institution: user.institution,
        phone: user.phone,
        semester: user.semester,
        avatar: user.avatar,
      },
      progress: {
        xp,
        level,
        levelTitle: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Scholar',
        currentLevelXP,
        nextLevelXP,
        prevLevelXP,
        xpProgress,
      },
      streak: streak ? {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        totalDays: streak.totalActiveDays,
        lastActive: streak.lastActiveDate,
      } : { current: 0, longest: 0, totalDays: 0 },
      badges: allBadges,
      academic: {
        totalQuizzes,
        avgScore,
        totalCorrect,
        totalQuestions,
        courses,
        creditsCompleted: totalQuizzes * 3,
        creditsTotal: courses.length * 12 + totalQuizzes * 3,
        enrollments: enrollments.map(e => ({
          code: e.course.code,
          name: e.course.name,
          attendance: e.attendance,
          marks: {
            assignment: e.assignmentMark,
            presentation: e.presentationMark,
            mid: e.midMark,
            final: e.finalMark,
          },
        })),
        totalAttendance,
      },
      activity,
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 })
  }
}
