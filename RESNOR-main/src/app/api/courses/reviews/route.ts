import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const reviews = await db.review.findMany({
      where: { courseId },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const currentUserId = await resolveUserId(request)
    let canReview = false
    let reviewProgress = 0

    if (currentUserId) {
      const existingReview = reviews.find(r => r.student.id === currentUserId)
      if (!existingReview) {
        const course = await db.course.findUnique({
          where: { id: courseId },
          include: { _count: { select: { topics: true } } },
        })
        if (course && course._count.topics > 0) {
          const completedCount = await db.topicProgress.count({
            where: { studentId: currentUserId, courseId, completed: true },
          })
          reviewProgress = Math.round((completedCount / course._count.topics) * 100)
          canReview = reviewProgress >= 80
        }
      }
    }

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        author: r.student.name || 'Anonymous',
        studentId: r.student.id,
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt.toISOString().split('T')[0],
      })),
      canReview,
      reviewProgress,
      hasReviewed: currentUserId ? reviews.some(r => r.student.id === currentUserId) : false,
    })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const studentId = await resolveUserId(request)
    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, rating, comment } = body

    if (!courseId || !rating) {
      return NextResponse.json({ error: 'courseId and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { topics: { select: { id: true } } },
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const totalTopics = course.topics.length
    if (totalTopics === 0) {
      return NextResponse.json({ error: 'Course has no topics to progress through' }, { status: 400 })
    }

    const completedCount = await db.topicProgress.count({
      where: { studentId, courseId, completed: true },
    })

    const progressPercent = (completedCount / totalTopics) * 100
    if (progressPercent < 80) {
      return NextResponse.json(
        { error: `You need at least 80% progress to leave a review (currently ${Math.round(progressPercent)}%)` },
        { status: 403 },
      )
    }

    const existing = await db.review.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this course' }, { status: 409 })
    }

    const review = await db.review.create({
      data: { studentId, courseId, rating, comment: comment || '' },
      include: { student: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      review: {
        id: review.id,
        author: review.student.name || 'Anonymous',
        studentId: review.student.id,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString().split('T')[0],
      },
    })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
