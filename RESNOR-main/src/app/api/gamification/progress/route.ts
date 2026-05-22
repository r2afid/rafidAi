import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const LEVEL_NAMES = ['', 'Beginner', 'Learner', 'Scholar', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic', 'Transcendent']

function xpForLevel(level: number) {
  return 500 * level * (level - 1) / 2
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    let progress = await db.studentProgress.findUnique({ where: { studentId } })
    if (!progress) {
      try {
        progress = await db.studentProgress.create({ data: { studentId, xp: 0, level: 1 } })
      } catch {
        // Student might not exist in User table — return default
        const defaultLevel = 1
        const prevLevelXp = xpForLevel(defaultLevel)
        const nextLevelXp = xpForLevel(defaultLevel + 1)
        return NextResponse.json({
          xp: 0, level: defaultLevel, levelName: LEVEL_NAMES[defaultLevel] || `Level ${defaultLevel}`,
          prevLevelXp, nextLevelXp, xpInLevel: 0, xpNeeded: nextLevelXp - prevLevelXp, percentage: 0,
        })
      }
    }

    const prevLevelXp = xpForLevel(progress.level)
    const nextLevelXp = xpForLevel(progress.level + 1)
    const xpInLevel = progress.xp - prevLevelXp
    const xpNeeded = nextLevelXp - prevLevelXp

    return NextResponse.json({
      xp: progress.xp,
      level: progress.level,
      levelName: LEVEL_NAMES[progress.level] || `Level ${progress.level}`,
      prevLevelXp,
      nextLevelXp,
      xpInLevel,
      xpNeeded,
      percentage: Math.round((xpInLevel / xpNeeded) * 100),
    })
  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
