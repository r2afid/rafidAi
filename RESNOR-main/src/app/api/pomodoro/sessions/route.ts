import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { studentId, type, duration, actualSeconds, startedAt, completedAt } = await request.json()
    if (!studentId || !type || !duration || !startedAt || !completedAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const session = await db.pomodoroSession.create({
      data: { studentId, type, duration, actualSeconds: actualSeconds ?? duration * 60, startedAt: new Date(startedAt), completedAt: new Date(completedAt) },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Pomodoro create error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : 1
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    const sessions = await db.pomodoroSession.findMany({
      where: { studentId, completedAt: { gte: startDate } },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Pomodoro sessions error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studentId = searchParams.get('student_id')
    const all = searchParams.get('all')

    if (all === 'true' && studentId) {
      await db.pomodoroSession.deleteMany({ where: { studentId } })
      return NextResponse.json({ deleted: true })
    }

    if (id) {
      await db.pomodoroSession.delete({ where: { id } })
      return NextResponse.json({ deleted: true })
    }

    return NextResponse.json({ error: 'Provide id or student_id+all' }, { status: 400 })
  } catch (error) {
    console.error('Pomodoro delete error:', error)
    return NextResponse.json({ error: 'Failed to delete session(s)' }, { status: 500 })
  }
}
