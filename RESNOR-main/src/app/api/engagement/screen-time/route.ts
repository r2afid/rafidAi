import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const STUDY_PAGES = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']

const FEATURE_LABELS: Record<string, string> = {
  quiz: 'Quiz Generator',
  tutor: 'AI Tutor',
  wellbeing: 'Wellbeing Support',
  notes: 'Study Notes',
  gamification: 'Gamification',
  planner: 'Study Planner',
  forum: 'Discussion Forum',
  'explain-mistake': 'Explain My Mistake',
  resources: 'Resource Library',
  leaderboard: 'Leaderboard',
}

function classifyRecord(interactionCount: number, tabFocused: boolean): 'active' | 'passive' {
  return interactionCount >= 3 && tabFocused ? 'active' : 'passive'
}

function secondsToDisplay(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 })

    const now = new Date()
    const tzOffset = parseInt(searchParams.get('tz') || '0')
    const localNow = new Date(now.getTime() + tzOffset * 60000)
    const todayStart = new Date(new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()).getTime() - tzOffset * 60000)
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000)

    const records = await db.telemetryRecord.findMany({
      where: {
        studentId,
        pageId: { in: STUDY_PAGES },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    })

    // ── Per-feature breakdown (today) ──
    const todayRecords = records.filter((r) => r.createdAt >= todayStart)
    const featureMap: Record<string, { active: number; passive: number }> = {}

    for (const r of todayRecords) {
      const pageId = r.pageId || 'unknown'
      if (!featureMap[pageId]) featureMap[pageId] = { active: 0, passive: 0 }
      const type = classifyRecord(r.interactionCount, r.tabFocused)
      featureMap[pageId][type] += r.activeSeconds
    }

    const features = Object.entries(featureMap)
      .map(([pageId, time]) => ({
        pageId,
        label: FEATURE_LABELS[pageId] || pageId,
        activeSeconds: time.active,
        passiveSeconds: time.passive,
        totalSeconds: time.active + time.passive,
        activePercent: time.active + time.passive > 0
          ? Math.round((time.active / (time.active + time.passive)) * 100)
          : 0,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const todayTotalActive = features.reduce((s, f) => s + f.activeSeconds, 0)
    const todayTotalPassive = features.reduce((s, f) => s + f.passiveSeconds, 0)
    const todayTotal = todayTotalActive + todayTotalPassive
    const todayActivePercent = todayTotal > 0 ? Math.round((todayTotalActive / todayTotal) * 100) : 0

    // ── 7-day daily totals ──
    const dailyTotals: { date: string; label: string; total: number; active: number; passive: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayEnd = new Date(day.getTime() + 86400000)
      const dayRecords = records.filter((r) => r.createdAt >= day && r.createdAt < dayEnd)
      const dayActive = dayRecords.filter((r) => classifyRecord(r.interactionCount, r.tabFocused) === 'active')
        .reduce((s, r) => s + r.activeSeconds, 0)
      const dayPassive = dayRecords.filter((r) => classifyRecord(r.interactionCount, r.tabFocused) === 'passive')
        .reduce((s, r) => s + r.activeSeconds, 0)
      dailyTotals.push({
        date: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        total: dayActive + dayPassive,
        active: dayActive,
        passive: dayPassive,
      })
    }

    // ── Worst feature (passive sink) ──
    const worstFeature = features
      .filter((f) => f.totalSeconds >= 60)
      .sort((a, b) => a.activePercent - b.activePercent)[0]

    const insight = worstFeature && worstFeature.activePercent < 30
      ? {
          type: 'warning' as const,
          message: `${worstFeature.label}: ${secondsToDisplay(worstFeature.totalSeconds)} spent, mostly passive (${worstFeature.activePercent}% active). Try interacting more — answer questions, write notes, or take a quiz.`,
          feature: worstFeature.pageId,
        }
      : {
          type: 'tip' as const,
          message: todayTotal > 0
            ? `Good mix today! ${todayActivePercent}% of your ${secondsToDisplay(todayTotal)} was active learning.`
            : 'No activity recorded today. Start studying to see your screen time.',
          feature: '',
        }

    return NextResponse.json({
      today: {
        totalSeconds: todayTotal,
        activeSeconds: todayTotalActive,
        passiveSeconds: todayTotalPassive,
        activePercent: todayActivePercent,
        display: secondsToDisplay(todayTotal),
      },
      features,
      dailyTotals,
      insight,
    })
  } catch (error) {
    console.error('Screen time error:', error)
    return NextResponse.json({ error: 'Failed to fetch screen time' }, { status: 500 })
  }
}
