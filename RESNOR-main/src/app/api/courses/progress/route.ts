import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const studentId = searchParams.get('student_id') || (await resolveUserId(request))

    if (!courseId || !studentId) {
      return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 })
    }

    const progress = await db.topicProgress.findMany({
      where: { courseId, studentId },
      select: { topicId: true, completed: true, completedAt: true },
    })

    const completedMap: Record<string, boolean> = {}
    for (const p of progress) {
      completedMap[p.topicId] = p.completed
    }

    return NextResponse.json({ progress: completedMap })
  } catch (error) {
    console.error('Progress GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { topicId, courseId, completed } = body
    const studentId = (await resolveUserId(request))

    if (!topicId || !courseId) {
      return NextResponse.json({ error: 'topicId and courseId are required' }, { status: 400 })
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (completed) {
      await db.topicProgress.upsert({
        where: { studentId_topicId: { studentId, topicId } },
        create: { studentId, topicId, courseId, completed: true, completedAt: new Date() },
        update: { completed: true, completedAt: new Date() },
      })
    } else {
      await db.topicProgress.upsert({
        where: { studentId_topicId: { studentId, topicId } },
        create: { studentId, topicId, courseId, completed: false, completedAt: null },
        update: { completed: false, completedAt: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Progress POST error:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
