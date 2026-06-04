'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

export function NotificationBell() {
  const { setActivePage, currentUser } = useAppStore()
  const authUser = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const { notifications, unreadCounts, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()

  const unreadCount = unreadCounts.notifications ?? notifications.filter(n => !n.read).length

  useEffect(() => {
    if (authUser?.id && token) {
      fetchNotifications(token, authUser.id)
      const interval = setInterval(() => fetchNotifications(token, authUser.id), 30000)
      return () => clearInterval(interval)
    }
  }, [authUser?.id, token, fetchNotifications])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <motion.div
            animate={unreadCount > 0 ? {
              scale: [1, 1.15, 1],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Bell className="w-4 h-4" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
              <motion.span
                className="absolute inset-0 rounded-full bg-rose-500"
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 10).map((notif, index) => {
              return (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer',
                    !notif.read && 'bg-emerald-500/5',
                    index < Math.min(notifications.length, 10) - 1 && 'border-b border-border/50',
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    markAsRead(notif.id)
                  }}
                >
                  <div className={cn(
                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5',
                    !notif.read ? 'bg-muted' : 'bg-muted/50',
                  )}>
                    <Bell className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-snug',
                      !notif.read ? 'font-medium' : 'font-normal text-muted-foreground',
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-center px-4 py-2.5 cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium text-sm"
          onClick={(e) => {
            e.preventDefault()
            setActivePage('notifications')
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
