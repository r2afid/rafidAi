import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let studentId = searchParams.get('student_id')
    if (!studentId) studentId = await resolveUserId(request)

    const courses = await db.course.findMany({
      include: {
        topics: {
          include: {
            materials: true,
            _count: { select: { materials: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrollments = studentId
      ? await db.enrollment.findMany({ where: { studentId } })
      : []

    const enrolledIds = new Set(enrollments.map(e => e.courseId))

    const enriched = await Promise.all(courses.map(async c => {
      let progress = 0
      if (enrolledIds.has(c.id) && c.topics.length > 0) {
        const completedCount = await db.topicProgress.count({
          where: { studentId: studentId!, courseId: c.id, completed: true },
        })
        progress = Math.round((completedCount / c.topics.length) * 100)
      }
      return {
        ...c,
        isEnrolled: enrolledIds.has(c.id),
        progress,
      }
    }))

    return NextResponse.json({ courses: enriched })
  } catch (error) {
    console.error('Courses error:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
