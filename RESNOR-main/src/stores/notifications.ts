import { create } from 'zustand'

interface ApiNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface NotificationState {
  unreadCounts: Record<string, number>
  notifications: ApiNotification[]
  isLoading: boolean
  fetchNotifications: (token: string, studentId: string) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCounts: {},
  notifications: [],
  isLoading: true,

  fetchNotifications: async (token, studentId) => {
    try {
      const res = await fetch(`/api/notifications?student_id=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const notifs: ApiNotification[] = (data.notifications || []).map((n: any) => ({
        ...n,
        read: !n.isRead,
      }))
      const apiUnread = data.unreadCount ?? notifs.filter((n) => !n.read).length

      const counts: Record<string, number> = { notifications: apiUnread }

      for (const n of notifs) {
        if (n.read) continue
        if (n.type === 'achievement') {
          counts.gamification = (counts.gamification || 0) + 1
          counts.grades = (counts.grades || 0) + 1
        } else if (n.type === 'reminder') {
          counts.quiz = (counts.quiz || 0) + 1
        } else if (n.type === 'warning') {
          // general warnings stay under notifications
        }
      }

      set({ notifications: notifs, unreadCounts: counts, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  markAsRead: (id) => {
    const { notifications } = get()
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
    const unreadCount = updated.filter((n) => !n.read).length
    set({
      notifications: updated,
      unreadCounts: { ...get().unreadCounts, notifications: unreadCount },
    })

    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_ids: [id] }),
    }).catch(() => {})
  },

  markAllAsRead: () => {
    set({
      unreadCounts: {},
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    })

    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    }).catch(() => {})
  },
}))
