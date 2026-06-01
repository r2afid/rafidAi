'use client'

import { useAppStore, type PageKey } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import {
  BarChart3, Bot, Brain, Flame, Bell, GraduationCap,
  LineChart, Search, Shield, Sun, Moon, Menu, AlertTriangle,
  Activity, Trophy, Sparkles,
  BookOpen, Target, Zap, LayoutDashboard,
  CheckCheck, CheckCircle2, MessageSquare, Award, Star,
  Timer, Users, StickyNote, Clock,
  Library, CalendarDays, UserCircle, Settings,
  FolderOpen, LogOut, ChevronDown,
} from 'lucide-react'
import { useState, useSyncExternalStore, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchCommand from '@/components/SearchCommand'
import OnboardingTour from '@/components/OnboardingTour'
import AuthPage from '@/components/auth/AuthPage'
import { useTelemetry } from '@/hooks/useTelemetry'

// Feature imports
import GrowthDashboard from '@/components/dashboard/GrowthDashboard'
import AITutor from '@/components/tutor/AITutor'
import QuizGenerator from '@/components/quiz/QuizGenerator'
import DigitalTwin from '@/components/digital-twin/DigitalTwin'
import ExplainMistake from '@/components/explain-mistake/ExplainMistake'
import EngagementTracker from '@/components/engagement/EngagementTracker'
import Gamification from '@/components/gamification/Gamification'
import Notifications from '@/components/notifications/Notifications'
import TeacherNotifications from '@/components/notifications/TeacherNotifications'
import TeacherDashboard from '@/components/teacher/TeacherDashboard'
import Wellbeing from '@/components/wellbeing/Wellbeing'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer'
import ExamRoutine from '@/components/tools/ExamRoutine'
import PeerLeaderboard from '@/components/leaderboard/PeerLeaderboard'
import StudyNotes from '@/components/notes/StudyNotes'
import CourseCatalog from '@/components/courses/CourseCatalog'
import StudyPlanner from '@/components/planner/StudyPlanner'
import ProfileSettings from '@/components/profile/ProfileSettings'
import TeacherProfileSettings from '@/components/profile/TeacherProfileSettings'
import DiscussionForum from '@/components/forum/DiscussionForum'
import ResourceLibrary from '@/components/resources/ResourceLibrary'
import GradeTracker from '@/components/grades/GradeTracker'
import PeerComparison from '@/components/peer-comparison/PeerComparison'

// --- AI Tools Groups ---
const aiToolGroups = ['AI Tools', 'Wellbeing', 'Analytics']

const navItems: { key: PageKey; label: string; icon: React.ElementType; group: string }[] = [
  { key: 'dashboard', label: 'Growth Dashboard', icon: BarChart3, group: 'Analytics' },
  { key: 'tutor', label: 'AI Tutor', icon: Bot, group: 'AI Tools' },
  { key: 'quiz', label: 'Quiz Generator', icon: Brain, group: 'AI Tools' },
  { key: 'digital-twin', label: 'Digital Twin', icon: Sparkles, group: 'Simulation' },
  { key: 'explain-mistake', label: 'Explain My Mistake', icon: Search, group: 'AI Tools' },
  { key: 'engagement', label: 'Engagement Tracker', icon: Activity, group: 'Analytics' },
  { key: 'peer-comparison', label: 'CGPA Predictor', icon: Users, group: 'Analytics' },
  { key: 'gamification', label: 'Gamification', icon: Trophy, group: 'Progress' },
  { key: 'notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { key: 'teacher', label: 'Teacher Dashboard', icon: GraduationCap, group: 'Admin' },
  { key: 'wellbeing', label: 'Wellbeing Support', icon: Shield, group: 'Wellbeing' },
  { key: 'pomodoro', label: 'Pomodoro Timer', icon: Timer, group: 'Tools' },
  { key: 'exam-routine', label: 'Exam Routine', icon: CalendarDays, group: 'Tools' },
  { key: 'leaderboard', label: 'Leaderboard', icon: Users, group: 'Progress' },
  { key: 'notes', label: 'Study Notes', icon: StickyNote, group: 'Tools' },
  { key: 'courses', label: 'Course Catalog', icon: Library, group: 'Learning' },
  { key: 'planner', label: 'Study Planner', icon: CalendarDays, group: 'Tools' },
  { key: 'profile', label: 'Profile & Settings', icon: UserCircle, group: 'Account' },
  { key: 'forum', label: 'Discussion Forum', icon: MessageSquare, group: 'Community' },
  { key: 'resources', label: 'Resource Library', icon: FolderOpen, group: 'Learning' },
  { key: 'grades', label: 'Grade Tracker', icon: GraduationCap, group: 'Analytics' },
]

const pageLabels = (isTeacher: boolean): Record<PageKey, string> => ({
  'dashboard': 'Student Growth Dashboard',
  'tutor': 'AI Tutor',
  'quiz': 'AI Quiz Generator',
  'digital-twin': 'Digital Twin Simulation',
  'explain-mistake': 'Explain My Mistake',
  'peer-comparison': 'CGPA Predictor',
  'engagement': 'Passive Learning Detection',
  'gamification': 'Gamified Progress',
  'notifications': isTeacher ? 'Teacher Notifications' : 'Smart Notifications',
  'teacher': 'Teacher Dashboard',
  'wellbeing': 'AI Wellbeing Support',
  'pomodoro': 'Pomodoro Timer',
  'exam-routine': 'Exam Routine',
  'leaderboard': 'Peer Leaderboard',
  'notes': 'Study Notes',
  'courses': 'Course Catalog',
  'planner': 'Study Planner',
  'profile': isTeacher ? 'Teacher Profile' : 'Profile & Settings',
  'forum': 'Discussion Forum',
  'resources': 'Resource Library',
  'grades': 'Grade Tracker',
})

// --- Notification mock data ---
const mockStudentNotifications = [
  {
    id: 'n1',
    icon: MessageSquare,
    iconColor: 'text-emerald-500',
    title: 'New AI study plan ready',
    timeAgo: '2 min ago',
    read: false,
  },
  {
    id: 'n2',
    icon: Award,
    iconColor: 'text-amber-500',
    title: 'You earned a new badge!',
    timeAgo: '1 hour ago',
    read: false,
  },
  {
    id: 'n3',
    icon: CheckCheck,
    iconColor: 'text-teal-500',
    title: 'Quiz results: Data Structures',
    timeAgo: '3 hours ago',
    read: false,
  },
]

const mockTeacherNotifications = [
  {
    id: 'tn1',
    icon: CheckCircle2,
    iconColor: 'text-teal-500',
    title: 'Fatima Rahman submitted Database Design Project',
    timeAgo: '15 min ago',
    read: false,
  },
  {
    id: 'tn2',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    title: '3 students scored below 40% in CSE-423',
    timeAgo: '1 hour ago',
    read: false,
  },
  {
    id: 'tn3',
    icon: MessageSquare,
    iconColor: 'text-emerald-500',
    title: 'Tasnim Ahmed replied to your forum post',
    timeAgo: '3 hours ago',
    read: false,
  },
]

// --- Quick Stats Section ---
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
          const quizAvg = quizData.attempts?.length
            ? Math.round(quizData.attempts.reduce((sum: number, a: any) => sum + a.score, 0) / quizData.attempts.length)
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
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5">
          <div className="flex flex-col items-center gap-0.5 py-1">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400">--</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Students</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-1">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">--</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Courses</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-1">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">--</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Rating</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pb-2">
      <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/40 p-2.5">
        <div className="flex flex-col items-center gap-0.5 py-1">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.streak}</span>
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">Day Streak</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.quizAvg}%</span>
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">Quiz Avg</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{stats.done}</span>
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">Done</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{stats.screenTime || '--'}</span>
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">Today</span>
        </div>
      </div>
    </div>
  )
}

// --- Sidebar Content ---
function SidebarContent({ onNavigate, showTooltips = false }: { onNavigate?: () => void; showTooltips?: boolean }) {
  const { activePage, setActivePage, currentUser, setCurrentUser } = useAppStore()
  const { logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

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

  // Filter nav items based on user role
  const isTeacher = currentUser?.role === 'teacher'
  const roleLabels: Partial<Record<PageKey, string>> = isTeacher ? {
    'notifications': 'Teacher Notifications',
    'profile': 'Teacher Profile',
  } : {}
  const filteredNavItems = isTeacher
    ? navItems.filter(n => n.key === 'teacher' || n.key === 'profile' || n.key === 'notifications')
    : navItems.filter(n => n.key !== 'teacher')
  const groups = [...new Set(filteredNavItems.map(n => n.group))]

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const activeItem = navItems.find(n => n.key === activePage)
    return activeItem ? [activeItem.group] : []
  })

  useEffect(() => {
    const activeItem = navItems.find(n => n.key === activePage)
    if (activeItem && !expandedGroups.includes(activeItem.group)) {
      setExpandedGroups(prev => [...prev, activeItem.group])
    }
  }, [activePage])

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand Logo with Gradient */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 px-1">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              RESNOR
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none font-medium">AI-Powered Growth</p>
          </div>
        </div>
      </div>

      <Separator className="mx-3" />

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-3">
        <div className="space-y-1">
          {groups.map(group => {
            const isExpanded = expandedGroups.includes(group)
            const groupItems = filteredNavItems.filter(n => n.group === group)

            return (
              <div key={group}>
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors group/header"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">
                    {group}
                  </p>
                  {aiToolGroups.includes(group) && (
                    <Badge
                      variant="outline"
                      className="text-[8px] px-1.5 py-0 h-3.5 font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    >
                      AI-Powered
                    </Badge>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`items-${group}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pb-1 pl-1">
                        {groupItems.map(item => {
                          const Icon = item.icon
                          const isActive = activePage === item.key

                          const button = (
                            <Button
                              key={item.key}
                              variant="ghost"
                              className={cn(
                                'w-full justify-start gap-2.5 h-9 px-2.5 text-sm font-medium',
                                'relative transition-all duration-200 ease-out',
                                'hover:scale-[1.02] hover:bg-muted/80 active:scale-[0.98]',
                                isActive
                                  ? 'bg-primary/10 text-primary hover:bg-primary/15'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                              onClick={() => {
                                setActivePage(item.key)
                                onNavigate?.()
                              }}
                            >
                              <motion.div
                                className={cn(
                                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500',
                                )}
                                initial={false}
                                animate={{
                                  height: isActive ? 20 : 0,
                                  opacity: isActive ? 1 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                              <Icon className={cn(
                                'w-4 h-4 shrink-0 transition-colors duration-200',
                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                              )} />
                              <span className="truncate">{roleLabels[item.key] || item.label}</span>
                            </Button>
                          )

                          if (showTooltips) {
                            return (
                              <Tooltip key={item.key}>
                                <TooltipTrigger asChild>
                                  {button}
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8}>
                                  <p>{roleLabels[item.key] || item.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          }

                          return button
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <Separator className="mx-3" />

      {/* Quick Stats */}
      <QuickStats />

      <Separator className="mx-3" />

      {/* User Section */}
      <div className="p-3">
        <button
          onClick={() => {
            setActivePage('profile')
            onNavigate?.()
          }}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-left"
        >
          <Avatar className="w-8 h-8 ring-2 ring-emerald-500/20">
            <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              {currentUser ? currentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {currentUser?.role === 'teacher' ? 'Teacher' : currentUser?.studentId || 'Student'}
            </p>
          </div>
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="flex items-center justify-between mt-2 px-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-teal-600" />}
            </button>
            <button
              onClick={handleLogout}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">Theme</span>
        </div>
      </div>
    </div>
  )
}

// --- Quick Actions FAB ---
function QuickActionsFab() {
  const [open, setOpen] = useState(false)
  const { setActivePage } = useAppStore()

  const actions = [
    { label: 'Start Quiz', icon: Brain, color: 'text-emerald-500', page: 'quiz' as PageKey },
    { label: 'Ask AI Tutor', icon: Bot, color: 'text-teal-500', page: 'tutor' as PageKey },
    { label: 'Study Planner', icon: CalendarDays, color: 'text-amber-500', page: 'planner' as PageKey },
    { label: 'Courses', icon: Library, color: 'text-rose-500', page: 'courses' as PageKey },
    { label: 'View Progress', icon: Activity, color: 'text-teal-600', page: 'dashboard' as PageKey },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Action Buttons */}
      <AnimatePresence>
        {open && (
          <>
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
                >
                  <Button
                    onClick={() => {
                      setActivePage(action.page)
                      setOpen(false)
                    }}
                    className={cn(
                      'shadow-lg shadow-black/10 dark:shadow-black/30',
                      'bg-card border border-border/50 hover:bg-accent',
                      'gap-2.5 pl-4 pr-5 h-11 rounded-full',
                      'transition-all duration-200 hover:scale-105',
                    )}
                  >
                    <Icon className={cn('w-4 h-4', action.color)} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </motion.div>
              )
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className={cn(
            'w-14 h-14 rounded-full shadow-xl shadow-emerald-500/25',
            'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
            'text-white transition-all duration-300',
            open && 'rotate-45',
          )}
        >
          <Zap className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  )
}

// --- Mobile Bottom Tab Bar ---
function MobileTabBar() {
  const { activePage, setActivePage } = useAppStore()
  const [moreOpen, setMoreOpen] = useState(false)

  const tabs: { key: PageKey; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { key: 'tutor', label: 'AI Tutor', icon: Bot },
    { key: 'quiz', label: 'Quiz', icon: Brain },
    { key: 'planner', label: 'Planner', icon: CalendarDays },
    { key: 'courses', label: 'Courses', icon: Library },
  ]

  const moreItems: { key: PageKey; label: string; icon: React.ElementType }[] = [
    { key: 'pomodoro', label: 'Pomodoro', icon: Timer },
    { key: 'notes', label: 'Notes', icon: StickyNote },
    { key: 'leaderboard', label: 'Leaderboard', icon: Users },
    { key: 'gamification', label: 'Gamification', icon: Trophy },
    { key: 'forum', label: 'Forum', icon: MessageSquare },
    { key: 'resources', label: 'Library', icon: FolderOpen },
    { key: 'grades', label: 'Grades', icon: GraduationCap },
    { key: 'profile', label: 'Profile', icon: UserCircle },
    { key: 'notifications', label: 'Alerts', icon: Bell },
    { key: 'peer-comparison', label: 'Predictor', icon: Users },
    { key: 'digital-twin', label: 'Twin', icon: Sparkles },
    { key: 'wellbeing', label: 'Wellbeing', icon: Shield },
  ]

  const isMainTab = tabs.some(t => t.key === activePage)

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-card/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon
            const isActive = activePage === tab.key

            return (
              <button
                key={tab.key}
                onClick={() => setActivePage(tab.key)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-all duration-200',
                  'active:scale-95',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive && 'scale-110',
                  )} />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-all duration-200',
                  isActive && 'font-semibold',
                )}>
                  {tab.label}
                </span>
              </button>
            )
          })}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-all duration-200 active:scale-95',
              !isMainTab ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
            )}
          >
            <div className="relative">
              <Menu className={cn('w-5 h-5 transition-all duration-200', !isMainTab && 'scale-110')} />
              {!isMainTab && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span className={cn('text-[10px] font-medium transition-all duration-200', !isMainTab && 'font-semibold')}>
              More
            </span>
          </button>
        </div>

        {/* More menu overlay */}
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-[-1]"
                onClick={() => setMoreOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute bottom-full left-2 right-2 mb-2 bg-card border rounded-2xl shadow-xl p-2 grid grid-cols-4 gap-1 max-h-[280px] overflow-y-auto"
              >
                {moreItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activePage === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActivePage(item.key)
                        setMoreOpen(false)
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-colors active:scale-95',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                    </button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// --- Notification Bell with Dropdown ---
function NotificationBell() {
  const { setActivePage, currentUser } = useAppStore()
  const isTeacher = currentUser?.role === 'teacher'
  const defaultNotifs = isTeacher ? mockTeacherNotifications : mockStudentNotifications
  const [notifications, setNotifications] = useState(defaultNotifs)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

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
              {unreadCount}
              {/* Pulse ring animation */}
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
          {notifications.map((notif, index) => {
            const NotifIcon = notif.icon
            return (
              <DropdownMenuItem
                key={notif.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer',
                  !notif.read && 'bg-emerald-500/5',
                  index < notifications.length - 1 && 'border-b border-border/50',
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
                  <NotifIcon className={cn('w-4 h-4', notif.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm leading-snug',
                    !notif.read ? 'font-medium' : 'font-normal text-muted-foreground',
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{notif.timeAgo}</p>
                </div>
                {!notif.read && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                )}
              </DropdownMenuItem>
            )
          })}
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

// --- Page Component Map ---
const pageComponents: Record<PageKey, React.ComponentType> = {
  'dashboard': GrowthDashboard,
  'tutor': AITutor,
  'quiz': QuizGenerator,
  'digital-twin': DigitalTwin,
  'explain-mistake': ExplainMistake,
  'peer-comparison': PeerComparison,
  'engagement': EngagementTracker,
  'gamification': Gamification,
  'notifications': Notifications,
  'teacher': TeacherDashboard,
  'wellbeing': Wellbeing,
  'pomodoro': PomodoroTimer,
  'exam-routine': ExamRoutine,
  'leaderboard': PeerLeaderboard,
  'notes': StudyNotes,
  'courses': CourseCatalog,
  'planner': StudyPlanner,
  'profile': ProfileSettings,
  'forum': DiscussionForum,
  'resources': ResourceLibrary,
  'grades': GradeTracker,
}

function BreakReminderModal() {
  const { breakReminder, dismissBreakReminder, setActivePage } = useAppStore()

  if (!breakReminder.show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              <Timer className="w-7 h-7 text-amber-500" />
            </motion.div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Time for a break!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your brain has been focused for a while — it deserves a rest. Step away for <strong>15 minutes</strong> to recharge and come back sharper.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={dismissBreakReminder}>
              Dismiss
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                dismissBreakReminder()
                setActivePage('pomodoro')
              }}
            >
              Take a Break
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ScreenTimeBadge() {
  const authUser = useAuthStore((s) => s.user)
  const [seconds, setSeconds] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUser?.id) return
    const fetchTime = () => {
      const tz = -new Date().getTimezoneOffset()
      fetch(`/api/gamification/screen-time-today?student_id=${authUser.id}&tz=${tz}`)
        .then((r) => r.json())
        .then((data) => { if (typeof data.totalSeconds === 'number') setSeconds(data.totalSeconds) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    fetchTime()
    const interval = setInterval(fetchTime, 30000)
    return () => clearInterval(interval)
  }, [authUser?.id])

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const display = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  const color = seconds < 7200 ? 'text-emerald-500' : seconds < 18000 ? 'text-amber-500' : 'text-rose-500'
  const bg = seconds < 7200 ? 'bg-emerald-500/10 border-emerald-500/20' : seconds < 18000 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'

  if (loading) return <div className="h-7 w-14 sm:w-16 rounded-full bg-muted animate-pulse shrink-0" />

  return (
    <div className="relative group/screen">
      <div className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full border cursor-help ${bg} ${color} text-[10px] sm:text-[11px] font-semibold tabular-nums`}>
        <Timer className="size-2.5 sm:size-3" />
        {display}
      </div>
      <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 p-3 rounded-xl border bg-popover text-popover-foreground text-xs shadow-lg opacity-0 group-hover/screen:opacity-100 transition-opacity pointer-events-none z-50">
        <p className="font-medium mb-0.5">Total Study Time Today</p>
        <p className="text-muted-foreground leading-relaxed">
          Total time spent on study pages (quiz, tutor, notes, wellbeing, etc.) today, including both active interaction and passive browsing time.
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const { activePage, sidebarOpen, setSidebarOpen, toggleSidebar, setActivePage, currentUser } = useAppStore()
  const { isAuthenticated, isLoading, hydrate } = useAuthStore()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // Hydrate auth state on mount
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Start telemetry tracking (must be before early returns)
  useTelemetry()

  // Show loading spinner
  if (!mounted || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
            <GraduationCap className="w-7 h-7 text-white" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-medium">Loading RESNOR...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Force teachers to teacher dashboard; block students from teacher page
  const isTeacher = currentUser?.role === 'teacher'
  const resolvedPage = isTeacher
    ? (activePage !== 'teacher' && activePage !== 'profile' && activePage !== 'notifications' ? 'teacher' : activePage)
    : (activePage === 'teacher' ? 'dashboard' : activePage)
  // Use role-specific components for notifications and profile
  const ActiveComponent = isTeacher && resolvedPage === 'notifications'
    ? TeacherNotifications
    : isTeacher && resolvedPage === 'profile'
      ? TeacherProfileSettings
      : pageComponents[resolvedPage]

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 xl:w-64 border-r bg-card/80 backdrop-blur-sm flex-col shrink-0">
        <SidebarContent showTooltips />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-80 p-0 backdrop-blur-xl bg-card/95"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">RESNOR platform navigation</SheetDescription>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b bg-card/60 backdrop-blur-md flex items-center px-4 gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb className="hidden sm:flex flex-1 min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => setActivePage(isTeacher ? 'teacher' : 'dashboard')}
                >
                  {isTeacher ? <GraduationCap className="w-3.5 h-3.5 inline mr-1" /> : <LayoutDashboard className="w-3.5 h-3.5 inline mr-1" />}
                  {isTeacher ? 'Dashboard' : 'Home'}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{pageLabels(isTeacher)[resolvedPage]}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Mobile title fallback */}
          <div className="flex-1 min-w-0 sm:hidden">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="text-sm font-semibold truncate">{pageLabels(isTeacher)[resolvedPage]}</h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Search Trigger - hidden for teachers */}
            {!isTeacher && <>
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 h-9 px-3 text-muted-foreground font-normal rounded-lg border-dashed hover:border-solid hover:bg-accent"
              onClick={() => {
                // Trigger the command palette by simulating Ctrl+K
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
              }}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs">Search...</span>
              <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
              }}
            >
              <Search className="w-4 h-4" />
            </Button>
            </>}

            {/* Today's Screen Time */}
            <ScreenTimeBadge />

            {/* Notification Bell with Dropdown */}
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={resolvedPage}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={cn(
                  resolvedPage === 'tutor' ? 'h-full overflow-hidden p-0' : 'p-4 md:p-6 pb-20 md:pb-6',
                  'max-w-[1600px] mx-auto'
                )}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </main>
      </div>

      {/* Quick Actions FAB - hidden for teachers and on mobile */}
      {!isTeacher && <div className="hidden md:block">
        <QuickActionsFab />
      </div>}

      {/* Mobile Bottom Tab Bar - hidden for teachers */}
      {!isTeacher && <MobileTabBar />}

      {/* Search Command Palette - hidden for teachers */}
      {!isTeacher && <SearchCommand />}

      {/* Onboarding Tour - hidden for teachers */}
      {!isTeacher && <OnboardingTour />}

      {/* Study Break Reminder */}
      <BreakReminderModal />
    </div>
  )
}
