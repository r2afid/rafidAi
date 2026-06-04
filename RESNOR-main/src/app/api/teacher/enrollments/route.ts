import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { topics: true } } },
    })
    if (!course || course.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const totalTopics = course._count.topics || 1

    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enr) => {
        const completedCount = await db.topicProgress.count({
          where: { studentId: enr.studentId, courseId, completed: true },
        })
        return {
          ...enr,
          progress: Math.round((completedCount / totalTopics) * 100),
        }
      })
    )

    return NextResponse.json({ enrollments: enrollmentsWithProgress })
  } catch (error) {
    console.error('Enrollments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, studentEmail } = body

    if (!courseId || !studentEmail) {
      return NextResponse.json({ error: 'courseId and studentEmail are required' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const student = await db.user.findUnique({ where: { email: studentEmail } })
    if (!student) {
      return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
    }

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Student is already enrolled' }, { status: 409 })
    }

    const enrollment = await db.enrollment.create({
      data: { studentId: student.id, courseId },
      include: { student: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Enrollments POST error:', error)
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, studentId } = body

    if (!courseId || !studentId) {
      return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    await db.enrollment.delete({ where: { id: existing.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Enrollments DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove enrollment' }, { status: 500 })
  }
}
