import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const session = await db.authSession.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const studentId = user.studentId || user.id

    const notifications = await db.notification.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    const typeDistribution: Record<string, number> = {}
    for (const n of notifications) {
      if (!n.isRead) {
        typeDistribution[n.type] = (typeDistribution[n.type] || 0) + 1
      }
    }

    return NextResponse.json({ notifications, unreadCount, typeDistribution })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { notification_ids, mark_all } = await request.json()
    const studentId = user.studentId || user.id

    if (mark_all) {
      await db.notification.updateMany({
        where: { studentId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (notification_ids?.length) {
      await db.notification.updateMany({
        where: { id: { in: notification_ids } },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { notification_id } = await request.json()
    if (!notification_id) return NextResponse.json({ error: 'notification_id is required' }, { status: 400 })

    await db.notification.delete({ where: { id: notification_id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification delete error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
