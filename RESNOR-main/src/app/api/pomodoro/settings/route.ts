import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    let settings = await db.pomodoroSettings.findUnique({ where: { studentId } })
    if (!settings) {
      settings = await db.pomodoroSettings.create({
        data: { studentId },
      })
    }

    return NextResponse.json({
      focusDuration: settings.focusDuration,
      shortBreakDuration: settings.shortBreakDuration,
      longBreakDuration: settings.longBreakDuration,
      autoStart: settings.autoStart,
      soundEnabled: settings.soundEnabled,
    })
  } catch (error) {
    console.error('Pomodoro settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { studentId, focusDuration, shortBreakDuration, longBreakDuration, autoStart, soundEnabled } = await request.json()
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const settings = await db.pomodoroSettings.upsert({
      where: { studentId },
      update: {
        ...(focusDuration !== undefined && { focusDuration }),
        ...(shortBreakDuration !== undefined && { shortBreakDuration }),
        ...(longBreakDuration !== undefined && { longBreakDuration }),
        ...(autoStart !== undefined && { autoStart }),
        ...(soundEnabled !== undefined && { soundEnabled }),
      },
      create: {
        studentId,
        focusDuration: focusDuration ?? 25,
        shortBreakDuration: shortBreakDuration ?? 5,
        longBreakDuration: longBreakDuration ?? 15,
        autoStart: autoStart ?? false,
        soundEnabled: soundEnabled ?? true,
      },
    })

    return NextResponse.json({
      focusDuration: settings.focusDuration,
      shortBreakDuration: settings.shortBreakDuration,
      longBreakDuration: settings.longBreakDuration,
      autoStart: settings.autoStart,
      soundEnabled: settings.soundEnabled,
    })
  } catch (error) {
    console.error('Pomodoro settings update error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
