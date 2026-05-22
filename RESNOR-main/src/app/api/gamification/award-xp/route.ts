import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function xpForLevel(level: number) {
  return 500 * level * (level - 1) / 2
}

function findLevel(totalXp: number) {
  let lv = 1
  while (totalXp >= xpForLevel(lv + 1)) lv++
  return lv
}

export async function POST(request: Request) {
  try {
    const { student_id, amount } = await request.json()
    if (!student_id || typeof amount !== 'number') {
      return NextResponse.json({ error: 'student_id and amount required' }, { status: 400 })
    }

    let progress = await db.studentProgress.findUnique({ where: { studentId: student_id } })
    if (!progress) {
      try {
        progress = await db.studentProgress.create({ data: { studentId: student_id, xp: 0, level: 1 } })
      } catch {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
    }

    const oldLevel = progress.level
    const newXp = Math.max(0, progress.xp + amount)
    const newLevel = findLevel(newXp)

    progress = await db.studentProgress.update({
      where: { studentId: student_id },
      data: { xp: newXp, level: newLevel },
    })

    const prevLevelXp = xpForLevel(newLevel)
    const nextLevelXp = xpForLevel(newLevel + 1)

    return NextResponse.json({
      xp: progress.xp,
      level: progress.level,
      prevLevelXp,
      nextLevelXp,
      levelUp: newLevel > oldLevel,
    })
  } catch (error) {
    console.error('Award XP error:', error)
    return NextResponse.json({ error: 'Failed to award XP' }, { status: 500 })
  }
}
