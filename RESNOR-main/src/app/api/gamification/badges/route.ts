import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const BADGE_DEFS = [
  {
    name: "First Quiz", description: "Complete your very first quiz", icon: "🎯", category: "quiz",
    check: async (sid: string) => {
      const first = await db.quizAttempt.findFirst({ where: { studentId: sid }, orderBy: { createdAt: 'asc' } })
      const count = await db.quizAttempt.count({ where: { studentId: sid } })
      return { earned: count >= 1, detail: first ? `Score: ${first.score}%` : 'Not attempted yet' }
    }
  },
  {
    name: "Perfect Score", description: "Score 100% on any quiz", icon: "🌟", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAttempt.count({ where: { studentId: sid, score: 100 } })
      return { earned: count >= 1, detail: `Perfect scores: ${count}` }
    }
  },
  {
    name: "Quiz Master", description: "Score 100% on 5 quizzes", icon: "🏆", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAttempt.count({ where: { studentId: sid, score: 100 } })
      return { earned: count >= 5, detail: `Perfect scores: ${count}/5` }
    }
  },
  {
    name: "Quiz Collector", description: "Complete 10 quizzes", icon: "💎", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAttempt.count({ where: { studentId: sid } })
      return { earned: count >= 10, detail: `Quizzes taken: ${count}/10` }
    }
  },
  {
    name: "Week Warrior", description: "Study every day for a full week", icon: "🔥", category: "streak",
    check: async (sid: string) => {
      const s = await db.streak.findUnique({ where: { studentId: sid } })
      const cur = s?.currentStreak ?? 0
      return { earned: cur >= 7, detail: `Current streak: ${cur}/7 days` }
    }
  },
  {
    name: "Consistency King", description: "Maintain a 14-day study streak", icon: "👑", category: "streak",
    check: async (sid: string) => {
      const s = await db.streak.findUnique({ where: { studentId: sid } })
      const longest = s?.longestStreak ?? 0
      return { earned: longest >= 14, detail: `Longest streak: ${longest}/14 days` }
    }
  },
  {
    name: "Bookworm", description: "Complete 10 study materials", icon: "📚", category: "study",
    check: async (sid: string) => {
      const count = await db.materialProgress.count({ where: { studentId: sid, completionStatus: 'done' } })
      return { earned: count >= 10, detail: `Materials completed: ${count}/10` }
    }
  },
  {
    name: "Century", description: "Answer 100 questions across all quizzes", icon: "💯", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAnswer.count({ where: { attempt: { studentId: sid } } })
      return { earned: count >= 100, detail: `Questions answered: ${count}/100` }
    }
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    for (const def of BADGE_DEFS) {
      await db.badge.upsert({
        where: { name: def.name },
        update: { description: def.description, icon: def.icon, category: def.category },
        create: { name: def.name, description: def.description, icon: def.icon, category: def.category, thresholdType: 'custom', thresholdValue: 0 },
      })
    }

    const badges = await db.badge.findMany()
    const earnedBadges = await db.earnedBadge.findMany({
      where: { studentId },
      include: { badge: true },
    })
    const earnedMap = new Map(earnedBadges.map((e) => [e.badge.name, e]))

    const results = []

    for (const def of BADGE_DEFS) {
      const existing = earnedMap.get(def.name)
      const alreadyEarned = !!existing

      const result = await def.check(studentId)
      const earned = alreadyEarned || result.earned
      const detail = result.detail

      const shouldAward = earned && !alreadyEarned

      if (shouldAward) {
        const badge = badges.find((b) => b.name === def.name)
        if (badge) {
          await db.earnedBadge.create({
            data: { studentId, badgeId: badge.id },
          })
        }
      }

      const finalEarned = earned
        ? await db.earnedBadge.findUnique({
            where: { studentId_badgeId: { studentId, badgeId: badges.find((b) => b.name === def.name)!.id } },
          })
        : null

      results.push({
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        earned,
        earnedAt: finalEarned?.earnedAt?.toISOString() || null,
        progressDetail: detail,
      })
    }

    return NextResponse.json({ badges: results })
  } catch (error) {
    console.error('Badges error:', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}
