'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useTheme } from '@/components/theme-provider'
import { navItems, aiToolGroups } from './nav-config'
import {
  Flame, Target, BookOpen, Clock,
  Users, Star, Sun, Moon, LogOut, Settings, ChevronRight,
} from 'lucide-react'

function QuickStats() {
  const { currentUser } = useAppStore()
  const authUser = useAuthStore((s) => s.user)
  const isTeacher = currentUser?.role === 'teacher'
  const [stats, setStats] = useState({ streak: 0, quizAvg: 0, done: 0, screenTime: '' })

  useEffect(() => {
    if (!authUser?.id || isTeacher) return
    const fetchStats = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const tz = -new Date().getTimezoneOffset()

      Promise.all([
        fetch(`/api/gamification/streak-calendar?student_id=${authUser.id}&year=${year}&month=${month}`).then(r => r.json()),
        fetch(`/api/quiz/history?student_id=${authUser.id}`).then(r => r.json()),
        fetch(`/api/gamification/stats?student_id=${authUser.id}`).then(r => r.json()),
        fetch(`/api/engagement/screen-time?student_id=${authUser.id}&tz=${tz}`).then(r => r.json().catch(() => ({}))),
      ])
        .then(([streakData, quizData, statsData, screenData]) => {
          const recent = quizData.attempts?.slice(0, 10)
          const quizAvg = recent?.length
            ? Math.round(recent.reduce((sum: number, a: any) => sum + a.score, 0) / recent.length)
            : 0
          setStats((prev) => ({
            streak: streakData.currentStreak ?? 0,
            quizAvg,
            done: statsData.materialsDone ?? 0,
            screenTime: screenData?.today?.display || prev.screenTime,
          }))
        })
        .catch(() => {})
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    const onXpUpdate = () => fetchStats()
    window.addEventListener('xp-updated', onXpUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('xp-updated', onXpUpdate)
    }
  }, [authUser?.id, isTeacher])

  if (isTeacher) {
    return (
    <div className="px-3 pb-2">
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 p-2 shadow-[inset_0_1px_2px_-0.5px_rgb(0_0_0_/0.1),inset_-0.75px_0_1.5px_-0.5px_rgb(0_0_0_/0.08),inset_0_-0.5px_0.5px_0_rgb(0_0_0_/0.04),inset_0.75px_0_1.5px_-0.5px_rgb(0_0_0_/0.08)] dark:shadow-[inset_0_1px_2px_-0.5px_rgb(255_255_255_/0.05),inset_-0.75px_0_1.5px_-0.5px_rgb(255_255_255_/0.04),inset_0_-0.5px_0.5px_0_rgb(255_255_255_/0.02),inset_0.75px_0_1.5px_-0.5px_rgb(255_255_255_/0.04)]">
        {[
          { icon: Users, color: 'text-teal-500', label: 'Students', value: '--' },
          { icon: BookOpen, color: 'text-emerald-500', label: 'Courses', value: '--' },
          { icon: Star, color: 'text-amber-500', label: 'Rating', value: '--' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-0.5 py-1 rounded-md hover:bg-sidebar-accent/30 hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)] transition-all duration-200 cursor-default"
            >
              <Icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-xs font-bold text-foreground">{s.value}</span>
              <span className="text-[8px] text-muted-foreground/60 font-medium uppercase tracking-wider">{s.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
    )
  }

  const statItems = [
    { icon: Flame, color: 'text-amber-500', label: 'Streak', value: stats.streak },
    { icon: Target, color: 'text-emerald-500', label: 'Avg', value: `${stats.quizAvg}%` },
    { icon: BookOpen, color: 'text-teal-500', label: 'Done', value: stats.done },
    { icon: Clock, color: 'text-violet-500', label: 'Today', value: stats.screenTime || '--' },
  ]

  return (
    <div className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-sidebar-border/40 bg-sidebar-accent/10 p-1.5 shadow-[inset_0_1px_2px_-0.5px_rgb(0_0_0_/0.1),inset_-0.75px_0_1.5px_-0.5px_rgb(0_0_0_/0.08),inset_0_-0.5px_0.5px_0_rgb(0_0_0_/0.04),inset_0.75px_0_1.5px_-0.5px_rgb(0_0_0_/0.08)] dark:shadow-[inset_0_1px_2px_-0.5px_rgb(255_255_255_/0.05),inset_-0.75px_0_1.5px_-0.5px_rgb(255_255_255_/0.04),inset_0_-0.5px_0.5px_0_rgb(255_255_255_/0.02),inset_0.75px_0_1.5px_-0.5px_rgb(255_255_255_/0.04)]">
        {statItems.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
              whileHover={{ scale: 1.05, y: -1 }}
              className="flex flex-col items-center gap-0.5 py-1 rounded-md hover:bg-sidebar-accent/30 hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)] transition-all duration-200 cursor-default"
            >
              <div className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${s.color}`} />
                <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
              </div>
              <span className="text-[7px] text-muted-foreground/50 font-semibold uppercase tracking-widest">{s.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()
  const { activePage, setActivePage, currentUser, setCurrentUser } = useAppStore()
  const { logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { unreadCounts } = useNotificationStore()
  const [hoveredLogo, setHoveredLogo] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const [sliderStyle, setSliderStyle] = useState({ left: 0, top: 0, width: 0, height: 36, opacity: 0 })

  useEffect(() => {
    const navEl = navRef.current
    if (!navEl) return
    const activeEl = navEl.querySelector(`[data-nav-key="${CSS.escape(activePage)}"]`) as HTMLElement | null
    if (!activeEl) {
      setSliderStyle(prev => ({ ...prev, opacity: 0 }))
      return
    }
    const navRect = navEl.getBoundingClientRect()
    const elRect = activeEl.getBoundingClientRect()
    setSliderStyle({
      left: elRect.left - navRect.left,
      top: elRect.top - navRect.top,
      width: elRect.width,
      height: elRect.height,
      opacity: 1,
    })
  }, [activePage])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('resnor_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch { /* ignore */ }
    logout()
    setCurrentUser(null)
  }

  const isTeacher = currentUser?.role === 'teacher'
  const filteredNavItems = isTeacher
    ? navItems.filter(n => n.key === 'teacher' || n.key === 'profile' || n.key === 'notifications')
    : navItems.filter(n => n.key !== 'teacher')
  const groups = [...new Set(filteredNavItems.map(n => n.group))]

  return (
    <>
      <SidebarHeader className="p-0">
        <motion.button
          onClick={toggleSidebar}
          onMouseEnter={() => setHoveredLogo(true)}
          onMouseLeave={() => setHoveredLogo(false)}
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-sidebar-accent/30 hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)] transition-all duration-200 rounded-none group/logo"
          title="Toggle sidebar"
        >
          <div className="group-data-[collapsible=icon]:hidden text-left flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <h1 className="text-[15px] font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  RESNOR
                </h1>
                <motion.div className="absolute -inset-x-2 -inset-y-0.5 rounded-md bg-emerald-500/5 -z-10" initial={false} animate={{ opacity: hoveredLogo ? 1 : 0 }} transition={{ duration: 0.2 }} />
              </div>
              <motion.div
                animate={{ scale: hoveredLogo ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Badge
                  variant="outline"
                  className="text-[7px] px-1 py-0 h-3.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 leading-none"
                >
                  BETA
                </Badge>
              </motion.div>
            </div>
            <p className="text-[8px] text-muted-foreground/50 leading-none font-medium truncate tracking-wide mt-0.5">AI-Powered Learning Platform</p>
          </div>
          <motion.div
            animate={{ rotate: hoveredLogo ? 180 : 0, x: hoveredLogo ? 2 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <ChevronRight className="group-data-[collapsible=icon]:hidden w-3 h-3 text-muted-foreground/30 group-hover/logo:text-muted-foreground/60 transition-colors shrink-0" />
          </motion.div>
        </motion.button>
      </SidebarHeader>

      <SidebarContent className="py-1 scrollbar-none shadow-[inset_0_0.5px_0px_0_rgb(0_0_0_/0.08),inset_-0.25px_0_0px_0_rgb(0_0_0_/0.05),inset_0_-0.25px_0px_0_rgb(0_0_0_/0.03),inset_0.25px_0_0px_0_rgb(0_0_0_/0.05)] dark:shadow-[inset_0_0.5px_0px_0_rgb(255_255_255_/0.03),inset_-0.25px_0_0px_0_rgb(255_255_255_/0.02),inset_0_-0.25px_0px_0_rgb(255_255_255_/0.02),inset_0.25px_0_0px_0_rgb(255_255_255_/0.02)]">
        <QuickStats />

        <nav ref={navRef} className="space-y-0.5 px-2 relative" role="navigation">
          <motion.div
            className="absolute bg-sidebar-accent/60 rounded-xl pointer-events-none z-0"
            animate={{
              left: sliderStyle.left,
              top: sliderStyle.top,
              width: sliderStyle.width,
              height: sliderStyle.height,
              opacity: sliderStyle.opacity,
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
              mass: 0.5,
            }}
          />
          {groups.map((group) => {
            const groupItems = filteredNavItems.filter(n => n.group === group)
            const hasAi = aiToolGroups.includes(group)

            return (
              <SidebarGroup key={group} className="p-0">
                <div className="flex items-center gap-2 px-2.5 py-1.5 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-gradient-to-b from-emerald-400/30 to-teal-400/30" />
                  <span className="group-data-[collapsible=icon]:hidden text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em] flex-1">
                    {group}
                  </span>
                  {hasAi && (
                    <Badge
                      variant="outline"
                      className="group-data-[collapsible=icon]:hidden text-[7px] px-1.5 py-0 h-3.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 leading-none"
                    >
                      AI
                    </Badge>
                  )}
                </div>
                <SidebarMenu className="gap-0.5 pl-1">
                  {groupItems.map((item, itemIdx) => {
                    const Icon = item.icon
                    const isActive = activePage === item.key
                    const badgeCount = unreadCounts[item.key]

                    return (
                      <motion.div
                        key={item.key}
                        data-nav-key={item.key}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIdx * 0.03, duration: 0.2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              isActive={isActive}
                              tooltip={item.label}
                              onClick={() => setActivePage(item.key)}
                               className={cn(
                                'relative h-9 rounded-xl transition-all duration-200',
                                isActive
                                  ? 'text-sidebar-accent-foreground font-semibold shadow-[inset_0_1.5px_3px_-0.5px_rgb(0_0_0_/0.25),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.17),inset_0_-0.75px_1.5px_0_rgb(0_0_0_/0.08),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.17)] dark:shadow-[inset_0_1.5px_3px_-0.5px_rgb(255_255_255_/0.1),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.06),inset_0_-0.75px_1.5px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.06)]'
                                  : 'bg-transparent hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)]'
                               )}
                            >
                              <div className="flex items-center gap-3 relative z-10 w-full px-0.5">
                                <motion.div
                                  layout
                                  className={cn(
                                    'w-[3px] rounded-full shrink-0',
                                    isActive
                                      ? 'h-5 bg-gradient-to-b from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/40'
                                      : 'h-0 bg-transparent group-hover/menu-item:h-3 group-hover/menu-item:bg-emerald-400/30'
                                  )}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                />
                                <motion.div
                                  animate={isActive ? { scale: [1, 1.15, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.35, ease: 'easeOut' }}
                                >
                                  <Icon className={cn(
                                    'w-[18px] h-[18px] shrink-0 transition-colors duration-300',
                                    isActive
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-muted-foreground/60 group-hover/menu-item:text-foreground/80'
                                  )} />
                                </motion.div>
                                <motion.span
                                  layout
                                  className={cn(
                                    'transition-colors duration-300',
                                    isActive ? 'text-[13px] font-semibold' : 'text-[12.5px]'
                                  )}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >{item.label}</motion.span>
                                {badgeCount > 0 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                    className="ml-auto relative"
                                  >
                                    <SidebarMenuBadge className="relative static inline-flex bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0 h-4 min-w-4 font-bold rounded-md shadow-sm shadow-rose-500/10">
                                      {badgeCount > 9 ? '9+' : badgeCount}
                                    </SidebarMenuBadge>
                                    <motion.div className="absolute -inset-1 rounded-full bg-rose-500/10 -z-10" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                                  </motion.div>
                                )}
                              </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    )
                    })}
                  </SidebarMenu>
                </SidebarGroup>
            )
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <div className="group-data-[collapsible=icon]:hidden mx-2.5 mb-2.5 p-2.5 rounded-xl border border-sidebar-border/20 bg-sidebar-accent/5 shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.12),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.08),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.04),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.08)] dark:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.05),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.03),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.015),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.03)]">
          <div className="space-y-2">
            <motion.button
            onClick={() => setActivePage('profile')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-sidebar-accent/50 hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)] transition-all duration-200 text-left group/user"
          >
            <Avatar className="w-8 h-8 shrink-0 ring-2 ring-emerald-500/20 group-hover/user:ring-emerald-500/40 group-hover/user:ring-offset-2 transition-all duration-200">
              <AvatarFallback className="text-[11px] font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                {currentUser ? currentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate leading-tight group-hover/user:text-emerald-600 dark:group-hover/user:text-emerald-400 transition-colors">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground/60 truncate leading-tight mt-0.5">
                {currentUser?.role === 'teacher' ? 'Teacher' : currentUser?.studentId || 'Student'}
              </p>
            </div>
            <motion.div
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            >
              <Settings className="group-data-[collapsible=icon]:hidden w-3.5 h-3.5 text-muted-foreground/40 group-hover/user:text-muted-foreground/70 transition-colors shrink-0" />
            </motion.div>
          </motion.button>

          <div className="group-data-[collapsible=icon]:hidden h-px bg-gradient-to-r from-transparent via-sidebar-border/30 to-transparent" />

          <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between px-0.5">
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-7 w-7 rounded-lg hover:bg-sidebar-accent/60 hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)] transition-all duration-200"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                </motion.div>
              </Button>
              <div className="w-px h-3.5 bg-sidebar-border/20 mx-0.5" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(0_0_0_/0.17),inset_-1px_0_2px_-0.5px_rgb(0_0_0_/0.12),inset_0_-0.75px_1px_0_rgb(0_0_0_/0.06),inset_1px_0_2px_-0.5px_rgb(0_0_0_/0.12)] dark:hover:shadow-[inset_0_1.5px_2.5px_-0.5px_rgb(255_255_255_/0.08),inset_-1px_0_2px_-0.5px_rgb(255_255_255_/0.05),inset_0_-0.75px_1px_0_rgb(255_255_255_/0.03),inset_1px_0_2px_-0.5px_rgb(255_255_255_/0.05)] text-muted-foreground/60 hover:text-rose-500 transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
            <span className="text-[9px] text-muted-foreground/20 font-mono font-medium px-1.5 py-0.5 rounded-md border border-border/15 bg-sidebar-accent/5">v2.0 BETA</span>
          </div>
          </div>
        </div>
      </SidebarFooter>
    </>
  )
}
