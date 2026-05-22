import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function computeStreak(studentId: string, telemetryMap: Map<string, { studentId: string; dateKey: string; totalSeconds: number }[]>, dbStreak: number) {
  const records = telemetryMap.get(studentId) || []
  const dayMap = new Map<string, number>()
  for (const r of records) {
    dayMap.set(r.dateKey, (dayMap.get(r.dateKey) || 0) + r.totalSeconds)
  }

  const now = new Date()
  const streakStart = new Date()
  streakStart.setFullYear(streakStart.getFullYear() - 1)
  streakStart.setHours(0, 0, 0, 0)

  const allDates: string[] = []
  const d = new Date(streakStart)
  while (d <= now) {
    allDates.push(toLocalDateStr(d))
    d.setDate(d.getDate() + 1)
  }

  const studied = allDates.map((dateStr) => (dayMap.get(dateStr) || 0) >= 300)

  let currentStreak = 0
  for (let i = studied.length - 1; i >= 0; i--) {
    if (studied[i]) currentStreak++
    else break
  }

  return currentStreak || dbStreak
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get('current_user_id') || ''
    const period = searchParams.get('period') || 'alltime'

    const students = await db.user.findMany({
      where: { role: 'student' },
      include: {
        progress: true,
        streak: true,
        earnedBadges: { include: { badge: true } },
      },
    })

    // Fetch telemetry for live streak calculation
    const streakStart = new Date()
    streakStart.setFullYear(streakStart.getFullYear() - 1)
    streakStart.setHours(0, 0, 0, 0)

    const telemetryRecords = await db.telemetryRecord.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        tabFocused: true,
        pageId: { in: STUDY_PAGE_IDS },
        createdAt: { gte: streakStart },
      },
      select: { studentId: true, activeSeconds: true, createdAt: true },
    })

    // Group telemetry by student
    const telemetryMap = new Map<string, { studentId: string; dateKey: string; totalSeconds: number }[]>()
    for (const r of telemetryRecords) {
      const dateKey = toLocalDateStr(r.createdAt)
      if (!telemetryMap.has(r.studentId)) telemetryMap.set(r.studentId, [])
      telemetryMap.get(r.studentId)!.push({ studentId: r.studentId, dateKey, totalSeconds: r.activeSeconds })
    }

    const now = new Date()
    const dayMs = 86400000

    const mapped = students
      .filter(s => s.progress)
      .map(s => {
        const totalXp = s.progress!.xp
        const streak = computeStreak(s.id, telemetryMap, s.streak?.currentStreak || 0)
        const lastActive = s.streak?.lastActiveDate || new Date(0)
        const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / dayMs)
        const activeRecency = Math.max(0, 1 - daysSinceActive / 60)

        let periodXp: number

        if (period === 'alltime') {
          periodXp = totalXp
        } else if (period === 'monthly') {
          const recencyFactor = 0.3 + activeRecency * 0.5
          const streakFactor = Math.min(streak / 21, 1) * 0.2
          periodXp = Math.round(totalXp * (recencyFactor + streakFactor))
        } else {
          const recencyFactor = 0.05 + activeRecency * 0.25
          const streakFactor = Math.min(streak / 14, 1) * 0.15
          periodXp = Math.round(totalXp * (recencyFactor + streakFactor))
        }

        return {
          id: s.id,
          name: s.name || 'Unknown',
          initials: (s.name || 'U')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          periodXp: Math.max(100, periodXp),
          totalXp,
          badges: s.earnedBadges.length,
          streak,
          previousRank: s.progress!.previousRank,
          isCurrentUser: s.id === currentUserId,
        }
      })

    const sortKey = (s: typeof mapped[0]) => s.periodXp

    const weekly = [...mapped].sort((a, b) => b.periodXp - a.periodXp).map((s, i) => ({ ...s, rank: i + 1 }))
    const monthly = [...mapped].sort((a, b) => b.periodXp - a.periodXp).map((s, i) => ({ ...s, rank: i + 1 }))
    const alltime = [...mapped].sort((a, b) => b.totalXp - a.totalXp).map((s, i) => ({ ...s, rank: i + 1 }))

    const merged = alltime.map(s => {
      const w = weekly.find(x => x.id === s.id)!
      const m = monthly.find(x => x.id === s.id)!
      const a = alltime.find(x => x.id === s.id)!

      const rankNow = period === 'weekly' ? w.rank : period === 'monthly' ? m.rank : a.rank

      const previousRank = s.previousRank
      const change = previousRank != null ? previousRank - rankNow : 0

      const periodXpMap: Record<string, number> = {
        weekly: w.periodXp,
        monthly: m.periodXp,
        alltime: s.totalXp,
      }

      return {
        id: s.id,
        name: s.name,
        initials: s.initials,
        xp: periodXpMap[period] || s.totalXp,
        totalXp: s.totalXp,
        badges: s.badges,
        streak: s.streak,
        rank: rankNow,
        change,
        isCurrentUser: s.isCurrentUser,
      }
    }).sort((a, b) => a.rank - b.rank)

    return NextResponse.json({ students: merged })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
