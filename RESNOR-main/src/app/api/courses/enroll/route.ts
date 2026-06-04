import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { courseId, studentId, enrollmentKey } = body

    if (!studentId) {
      studentId = await resolveUserId(request)
    }

    if (!courseId || !studentId) {
      return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.enrollmentKey && course.enrollmentKey !== enrollmentKey) {
      return NextResponse.json({ error: 'Invalid enrollment key' }, { status: 403 })
    }

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })
    }

    const enrollment = await db.enrollment.create({
      data: { studentId, courseId },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
