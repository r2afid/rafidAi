import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    const courses = await db.course.findMany({
      where: teacherId ? { teacherId } : {},
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
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Teacher courses error:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    const body = await request.json()
    const { name, code, description, enrollmentKey, instructor, category, difficulty, thumbnail, prerequisites, topics } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    const course = await db.course.create({
      data: {
        name,
        code,
        description: description || '',
        enrollmentKey: enrollmentKey || null,
        instructor: instructor || ((await db.user.findUnique({ where: { id: teacherId }, select: { name: true } }))?.name) || null,
        category: category || 'General',
        difficulty: difficulty || 'Beginner',
        thumbnail: thumbnail || null,
        prerequisites: prerequisites || null,
        teacherId: teacherId || 'teacher_001',
        topics: topics?.length ? {
          create: topics.map((t: any) => ({
            name: t.name,
            materials: t.materials?.length ? {
              create: t.materials.map((m: any) => ({
                title: m.title,
                contentType: m.contentType || 'document',
                contentUrl: m.contentUrl || '',
                estimatedTime: m.estimatedTime || 30,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        topics: { include: { materials: true, _count: { select: { materials: true } } } },
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.course.delete({ where: { id: courseId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const teacherId = await resolveUserId(request)
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (course.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, enrollmentKey, instructor, category, difficulty, thumbnail, prerequisites, topics } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (description !== undefined) updateData.description = description
    if (enrollmentKey !== undefined) updateData.enrollmentKey = enrollmentKey || null
    if (instructor !== undefined) updateData.instructor = instructor
    if (category !== undefined) updateData.category = category
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites || null

    if (topics !== undefined) {
      await db.topic.deleteMany({ where: { courseId } })
      updateData.topics = topics.length ? {
        create: topics.map((t: any) => ({
          name: t.name,
          materials: t.materials?.length ? {
            create: t.materials.map((m: any) => ({
              title: m.title,
              contentType: m.contentType || 'document',
              contentUrl: m.contentUrl || '',
              estimatedTime: m.estimatedTime || 30,
            })),
          } : undefined,
        })),
      } : undefined
    }

    const updated = await db.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        topics: { include: { materials: true, _count: { select: { materials: true } } } },
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json({ course: updated })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}
