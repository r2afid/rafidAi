'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  ChevronDown,
  Clock,
  Flame,
  Target,
  Volume2,
  VolumeX,
  CheckCircle2,
  Circle,
  Sparkles,
  Timer,
  Coffee,
  Zap,
  Trophy,
  CalendarDays,
  Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Types ---
type SessionType = 'focus' | 'shortBreak' | 'longBreak'

interface SessionRecord {
  id: string
  type: SessionType
  duration: number // minutes
  startedAt: string // ISO string
  completedAt: string // ISO string
}

interface TimerSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  autoStart: boolean
  soundEnabled: boolean
}

// --- Constants ---
const SESSION_COLORS = {
  focus: {
    primary: 'oklch(0.646 0.222 41.116)',
    gradientStart: '#10b981',
    gradientEnd: '#059669',
    ring: '#10b981',
    ringAlt: '#34d399',
    bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    glow: 'shadow-emerald-500/25',
    text: 'text-emerald-600 dark:text-emerald-400',
    bgSolid: 'bg-emerald-500',
    label: 'Focus Time',
    icon: Target,
  },
  shortBreak: {
    primary: 'oklch(0.769 0.188 70.08)',
    gradientStart: '#f59e0b',
    gradientEnd: '#d97706',
    ring: '#f59e0b',
    ringAlt: '#fbbf24',
    bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
    glow: 'shadow-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    bgSolid: 'bg-amber-500',
    label: 'Short Break',
    icon: Coffee,
  },
  longBreak: {
    primary: 'oklch(0.6 0.118 184.704)',
    gradientStart: '#14b8a6',
    gradientEnd: '#0d9488',
    ring: '#14b8a6',
    ringAlt: '#2dd4bf',
    bg: 'from-teal-500/10 via-teal-500/5 to-transparent',
    glow: 'shadow-teal-500/25',
    text: 'text-teal-600 dark:text-teal-400',
    bgSolid: 'bg-teal-500',
    label: 'Long Break',
    icon: Sparkles,
  },
} as const

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStart: false,
  soundEnabled: true,
}

const WEEKLY_CHART_CONFIG = {
  focus: { label: 'Focus', color: SESSION_COLORS.focus.primary },
  shortBreak: { label: 'Short Break', color: SESSION_COLORS.shortBreak.primary },
  longBreak: { label: 'Long Break', color: SESSION_COLORS.longBreak.primary },
} satisfies ChartConfig

// --- Helper: format time ---
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// --- Helper: get day label ---
function getDayLabel(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

// --- Mock weekly data ---
// (removed — now fetched from API)

// --- Mock session history ---
// (removed — now fetched from API)

// --- Confetti Particle ---
function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#10b981', '#f59e0b', '#14b8a6', '#f43f5e', '#8b5cf6', '#fbbf24']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.5
  const duration = 1.5 + Math.random()
  const size = 6 + Math.random() * 6

  return (
    <motion.div
      className="absolute rounded-sm pointer-events-none"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        left: `${left}%`,
        top: '40%',
        rotate: Math.random() * 360,
      }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{
        opacity: 0,
        y: [0, -80 - Math.random() * 60, 200 + Math.random() * 100],
        x: [0, (Math.random() - 0.5) * 100],
        rotate: [0, Math.random() * 720],
        scale: [1, 0.5],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
    />
  )
}

// --- Confetti Celebration ---
function ConfettiCelebration({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// --- Session Complete Overlay ---
function SessionCompleteOverlay({
  sessionType,
  onStartNext,
  onDismiss,
}: {
  sessionType: SessionType
  onStartNext: () => void
  onDismiss: () => void
}) {
  const isFocus = sessionType === 'focus'
  const colors = SESSION_COLORS[sessionType]
  const Icon = colors.icon
  const nextType: SessionType = isFocus ? 'shortBreak' : 'focus'
  const nextLabel = SESSION_COLORS[nextType].label

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex flex-col items-center gap-4 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg',
            isFocus
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-br from-teal-500 to-teal-600',
          )}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>

        <div>
          <h3 className="text-xl font-bold mb-1">
            {isFocus ? "Time's up! Great work!" : 'Break over!'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isFocus
              ? "You've earned a break. Relax and recharge."
              : `Ready to focus again? Let's start the next ${SESSION_COLORS[nextType].label.toLowerCase()}.`}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="px-6"
          >
            Dismiss
          </Button>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onStartNext}
              className={cn(
                'px-6 font-semibold shadow-lg',
                isFocus
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white',
              )}
            >
              <Zap className="w-4 h-4 mr-2" />
              Start {nextLabel}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Circular Timer Ring ---
function TimerRing({
  progress,
  sessionType,
  isRunning,
  children,
}: {
  progress: number
  sessionType: SessionType
  isRunning: boolean
  children: React.ReactNode
}) {
  const colors = SESSION_COLORS[sessionType]
  const size = 280
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow effect when running */}
      <motion.div
        className={cn(
          'absolute rounded-full blur-xl transition-colors duration-700',
          isRunning ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          width: size + 20,
          height: size + 20,
          background: `radial-gradient(circle, ${colors.ring}33 0%, transparent 70%)`,
        }}
        animate={
          isRunning
            ? {
                scale: [1, 1.08, 1],
                opacity: [0.6, 1, 0.6],
              }
            : { opacity: 0 }
        }
        transition={
          isRunning
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : { duration: 0.3 }
        }
      />

      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`timer-gradient-${sessionType}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.gradientStart} />
            <stop offset="100%" stopColor={colors.gradientEnd} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />

        {/* Progress arc with gradient */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#timer-gradient-${sessionType})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// --- Session Dots ---
function SessionDots({
  currentSession,
  totalSessions,
  sessionType,
}: {
  currentSession: number
  totalSessions: number
  sessionType: SessionType
}) {
  const colors = SESSION_COLORS[sessionType]
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSessions }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={{
            scale: i < currentSession ? 1 : 0.7,
            backgroundColor: i < currentSession ? colors.ring : undefined,
          }}
          style={{
            width: 10,
            height: 10,
            backgroundColor: i < currentSession ? colors.ring : undefined,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
      ))}
      <span className="text-xs text-muted-foreground font-medium ml-1.5">
        Session {currentSession} of {totalSessions}
      </span>
    </div>
  )
}

// --- Main Pomodoro Timer Component ---
export default function PomodoroTimer() {
  const authUser = useAuthStore((s) => s.user)

  // Timer state
  const [sessionType, setSessionType] = useState<SessionType>('focus')
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_SETTINGS.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSession, setCurrentSession] = useState(1)
  const [sessionsBeforeLongBreak] = useState(4)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([])

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevSessionTypeRef = useRef<SessionType>('focus')

  // Computed values
  const totalDuration = useMemo(() => {
    switch (sessionType) {
      case 'focus': return settings.focusDuration * 60
      case 'shortBreak': return settings.shortBreakDuration * 60
      case 'longBreak': return settings.longBreakDuration * 60
    }
  }, [sessionType, settings])

  const progress = useMemo(() => {
    return (totalDuration - timeRemaining) / totalDuration
  }, [timeRemaining, totalDuration])

  const colors = SESSION_COLORS[sessionType]

  // Fetch settings on mount
  useEffect(() => {
    if (!authUser?.id) return
    fetch(`/api/pomodoro/settings?student_id=${authUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          focusDuration: data.focusDuration ?? DEFAULT_SETTINGS.focusDuration,
          shortBreakDuration: data.shortBreakDuration ?? DEFAULT_SETTINGS.shortBreakDuration,
          longBreakDuration: data.longBreakDuration ?? DEFAULT_SETTINGS.longBreakDuration,
          autoStart: data.autoStart ?? DEFAULT_SETTINGS.autoStart,
          soundEnabled: data.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
        })
        setSettingsLoaded(true)
      })
      .catch(() => setSettingsLoaded(true))
  }, [authUser?.id])

  // Fetch today's sessions and stats
  useEffect(() => {
    if (!authUser?.id) return
    fetch(`/api/pomodoro/sessions?student_id=${authUser.id}&days=7`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) {
          const mapped: SessionRecord[] = data.sessions.map((s: any) => ({
            id: s.id,
            type: s.type as SessionType,
            duration: s.duration,
            startedAt: s.startedAt,
            completedAt: s.completedAt,
          }))
          setSessionHistory(mapped)
        }
      })
      .catch(() => {})
    fetch(`/api/pomodoro/stats?student_id=${authUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.sessionsDone === 'number') setCompletedSessions(data.sessionsDone)
        if (typeof data.focusMinutes === 'number') setTotalFocusMinutes(data.focusMinutes)
        if (typeof data.streak === 'number') setCurrentStreak(data.streak)
      })
      .catch(() => {})
  }, [authUser?.id])

  // Sync timer to loaded settings on first load
  useEffect(() => {
    if (settingsLoaded) {
      switch (sessionType) {
        case 'focus': setTimeRemaining(settings.focusDuration * 60); break
        case 'shortBreak': setTimeRemaining(settings.shortBreakDuration * 60); break
        case 'longBreak': setTimeRemaining(settings.longBreakDuration * 60); break
      }
    }
    // Only run when settings first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded])

  // Session complete handler
  const handleSessionComplete = useCallback(() => {
    const now = new Date()
    const startedAt = new Date(now.getTime() - totalDuration * 1000)
    const completedRecord: SessionRecord = {
      id: `s${Date.now()}`,
      type: sessionType,
      duration: totalDuration / 60,
      startedAt: startedAt.toISOString(),
      completedAt: now.toISOString(),
    }

    setSessionHistory((prev) => [completedRecord, ...prev])

    if (sessionType === 'focus') {
      setCompletedSessions((prev) => prev + 1)
      setTotalFocusMinutes((prev) => prev + totalDuration / 60)
      setCurrentStreak((prev) => prev + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
    }

    // Save to backend
    if (authUser?.id) {
      fetch('/api/pomodoro/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: authUser.id,
          type: sessionType,
          duration: totalDuration / 60,
          startedAt: startedAt.toISOString(),
          completedAt: now.toISOString(),
        }),
      }).catch(() => {})
    }

    setShowCompleteOverlay(true)
  }, [sessionType, totalDuration, authUser?.id])

  // Use refs for latest values so interval callback can access them
  const handleSessionCompleteRef = useRef(handleSessionComplete)
  useEffect(() => {
    handleSessionCompleteRef.current = handleSessionComplete
  }, [handleSessionComplete])

  // Timer tick — handles completion inline to avoid setState in effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer reached 0 — schedule cleanup outside the setState callback
            setTimeout(() => {
              setIsRunning(false)
              handleSessionCompleteRef.current()
            }, 0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // Auto-start long break when triggered by study break reminder
  const breakReminder = useAppStore((s) => s.breakReminder)
  const dismissBreakReminder = useAppStore((s) => s.dismissBreakReminder)
  useEffect(() => {
    if (breakReminder.autoStartLongBreak) {
      dismissBreakReminder()
      setSessionType('longBreak')
      setTimeRemaining(settings.longBreakDuration * 60)
      setCurrentSession(4) // simulate reaching long break threshold
      setIsRunning(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getNextSessionType = useCallback((): SessionType => {
    if (sessionType === 'focus') {
      if (currentSession >= sessionsBeforeLongBreak) {
        return 'longBreak'
      }
      return 'shortBreak'
    }
    return 'focus'
  }, [sessionType, currentSession, sessionsBeforeLongBreak])

  const switchToSession = useCallback(
    (type: SessionType) => {
      prevSessionTypeRef.current = sessionType
      setSessionType(type)

      switch (type) {
        case 'focus':
          setTimeRemaining(settings.focusDuration * 60)
          if (sessionType === 'longBreak' || sessionType === 'shortBreak') {
            // Came from break, increment session
            setCurrentSession((prev) => {
              const next = prev >= sessionsBeforeLongBreak ? 1 : prev + 1
              return next
            })
          }
          break
        case 'shortBreak':
          setTimeRemaining(settings.shortBreakDuration * 60)
          break
        case 'longBreak':
          setTimeRemaining(settings.longBreakDuration * 60)
          break
      }
    },
    [sessionType, settings, sessionsBeforeLongBreak],
  )

  const handleStartNext = useCallback(() => {
    setShowCompleteOverlay(false)
    const nextType = getNextSessionType()
    switchToSession(nextType)
    if (settings.autoStart) {
      // Small delay before auto-starting
      setTimeout(() => setIsRunning(true), 300)
    }
  }, [getNextSessionType, switchToSession, settings.autoStart])

  const handleDismiss = useCallback(() => {
    setShowCompleteOverlay(false)
  }, [])

  const handlePlayPause = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    switch (sessionType) {
      case 'focus':
        setTimeRemaining(settings.focusDuration * 60)
        break
      case 'shortBreak':
        setTimeRemaining(settings.shortBreakDuration * 60)
        break
      case 'longBreak':
        setTimeRemaining(settings.longBreakDuration * 60)
        break
    }
  }, [sessionType, settings])

  const handleSkip = useCallback(() => {
    setIsRunning(false)
    const nextType = getNextSessionType()
    switchToSession(nextType)
  }, [getNextSessionType, switchToSession])

  // Update time remaining when settings change (only when timer is not running and hasn't been started)
  const handleSettingChange = useCallback(
    (key: keyof TimerSettings, value: number | boolean) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        // If timer is not running and at full time, update the time remaining
        if (!isRunning) {
          if (
            (key === 'focusDuration' && sessionType === 'focus' && timeRemaining === prev.focusDuration * 60) ||
            (key === 'shortBreakDuration' && sessionType === 'shortBreak' && timeRemaining === prev.shortBreakDuration * 60) ||
            (key === 'longBreakDuration' && sessionType === 'longBreak' && timeRemaining === prev.longBreakDuration * 60)
          ) {
            setTimeRemaining((typeof value === 'number' ? value : 0) * 60)
          }
        }
        // Persist to backend
        if (authUser?.id) {
          fetch('/api/pomodoro/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: authUser.id, ...next }),
          }).catch(() => {})
        }
        return next
      })
    },
    [isRunning, sessionType, timeRemaining, authUser?.id],
  )

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessionHistory((prev) => prev.filter((s) => s.id !== sessionId))
    fetch(`/api/pomodoro/sessions?id=${sessionId}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  const handleDeleteAll = useCallback(() => {
    if (!authUser?.id) return
    setSessionHistory([])
    setCompletedSessions(0)
    setTotalFocusMinutes(0)
    setCurrentStreak(0)
    fetch(`/api/pomodoro/sessions?student_id=${authUser.id}&all=true`, { method: 'DELETE' }).catch(() => {})
  }, [authUser?.id])

  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      return date
    })
    return days.map((day, i) => {
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)
      const daySessions = sessionHistory.filter((s) => {
        const completed = new Date(s.completedAt)
        return completed >= day && completed <= dayEnd
      })
      const focus = daySessions.filter((s) => s.type === 'focus').reduce((sum, s) => sum + s.duration, 0)
      const shortBreak = daySessions.filter((s) => s.type === 'shortBreak').reduce((sum, s) => sum + s.duration, 0)
      const longBreak = daySessions.filter((s) => s.type === 'longBreak').reduce((sum, s) => sum + s.duration, 0)
      const label = i === 6 ? 'Today' : i === 5 ? 'Yesterday' : day.toLocaleDateString('en-US', { weekday: 'short' })
      return { day: label, focus, shortBreak, longBreak }
    })
  }, [sessionHistory])

  const SessionIcon = colors.icon

  return (
    <div className="space-y-6">
      {/* Main Timer Card */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br opacity-60 transition-colors duration-700"
          style={{
            backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
          }}
          animate={{
            background: sessionType === 'focus'
              ? ['linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))', 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))']
              : sessionType === 'shortBreak'
                ? ['linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))', 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))']
                : ['linear-gradient(135deg, rgba(20,184,166,0.08), rgba(20,184,166,0.02))', 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(20,184,166,0.04))', 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(20,184,166,0.02))'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Confetti */}
        <ConfettiCelebration show={showConfetti} />

        {/* Session complete overlay */}
        <AnimatePresence>
          {showCompleteOverlay && (
            <SessionCompleteOverlay
              sessionType={sessionType}
              onStartNext={handleStartNext}
              onDismiss={handleDismiss}
            />
          )}
        </AnimatePresence>

        <CardContent className="relative z-10 py-10">
          <div className="flex flex-col items-center gap-6">
            {/* Session type tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60">
              {(['focus', 'shortBreak', 'longBreak'] as SessionType[]).map((type) => {
                const c = SESSION_COLORS[type]
                const Icon = c.icon
                const isActive = sessionType === type

                return (
                  <motion.button
                    key={type}
                    onClick={() => {
                      if (!isRunning) {
                        prevSessionTypeRef.current = sessionType
                        setSessionType(type)
                        switch (type) {
                          case 'focus':
                            setTimeRemaining(settings.focusDuration * 60)
                            break
                          case 'shortBreak':
                            setTimeRemaining(settings.shortBreakDuration * 60)
                            break
                          case 'longBreak':
                            setTimeRemaining(settings.longBreakDuration * 60)
                            break
                        }
                      }
                    }}
                    className={cn(
                      'relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                      isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground',
                    )}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="session-tab-bg"
                        className="absolute inset-0 rounded-lg"
                        style={{ backgroundColor: c.ring }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {c.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Timer Ring */}
            <TimerRing
              progress={progress}
              sessionType={sessionType}
              isRunning={isRunning}
            >
              {/* Time display */}
              <motion.span
                key={timeRemaining}
                className="text-5xl font-bold tabular-nums tracking-tight"
                style={{ color: colors.ring }}
                initial={false}
              >
                {formatTime(timeRemaining)}
              </motion.span>

              {/* Session label */}
              <motion.div
                className="flex items-center gap-1.5 mt-1"
                key={`label-${sessionType}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SessionIcon className={cn('w-4 h-4', colors.text)} />
                <span className={cn('text-sm font-medium', colors.text)}>
                  {colors.label}
                </span>
              </motion.div>

              {/* Session dots */}
              <div className="mt-3">
                <SessionDots
                  currentSession={currentSession}
                  totalSessions={sessionsBeforeLongBreak}
                  sessionType={sessionType}
                />
              </div>
            </TimerRing>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Reset */}
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Play/Pause */}
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={handlePlayPause}
                  className={cn(
                    'h-16 w-16 rounded-full text-white shadow-xl transition-all duration-300',
                    isRunning
                      ? `bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/25`
                      : `bg-gradient-to-br ${sessionType === 'focus' ? 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25' : sessionType === 'shortBreak' ? 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25' : 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/25'}`,
                  )}
                >
                  {isRunning ? (
                    <Pause className="w-7 h-7" />
                  ) : (
                    <Play className="w-7 h-7 ml-0.5" />
                  )}
                </Button>
              </motion.div>

              {/* Skip */}
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleSkip}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Stats + History + Settings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statistics Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Today&apos;s Stats
            </CardTitle>
            <CardDescription>Your pomodoro progress today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stat items */}
              <div className="grid grid-cols-2 gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-500/10 cursor-help">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {completedSessions}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Sessions Done
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-48 text-center">
                    <p className="text-xs">Total completed sessions (focus + breaks) today</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-500/10 cursor-help">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {totalFocusMinutes}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Focus Minutes
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-48 text-center">
                    <p className="text-xs">Total minutes spent in focus sessions today</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-rose-500/10 col-span-2 cursor-help">
                      <Flame className="w-5 h-5 text-rose-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {currentStreak}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Consecutive Pomodoros Streak
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-56 text-center">
                    <p className="text-xs">Number of focus sessions completed in a row today — resets if you skip or miss one</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator />

              {/* Weekly bar chart */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  This Week
                </p>
                <ChartContainer config={WEEKLY_CHART_CONFIG} className="h-[140px] w-full">
                  <BarChart data={weeklyData} margin={{ left: -15, right: 5, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      domain={[0, 'auto']}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="focus" stackId="a" fill={SESSION_COLORS.focus.primary} radius={[0, 0, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="shortBreak" stackId="a" fill={SESSION_COLORS.shortBreak.primary} radius={[0, 0, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="longBreak" stackId="a" fill={SESSION_COLORS.longBreak.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="w-4 h-4 text-teal-500" />
                Session History
              </CardTitle>
              {sessionHistory.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDeleteAll}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete all sessions"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
            <CardDescription>Today&apos;s completed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-3">
              <div className="space-y-3">
                {sessionHistory.filter((s) => {
                  const d = new Date(s.completedAt)
                  const today = new Date()
                  return d.toDateString() === today.toDateString()
                }).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No sessions yet today</p>
                    <p className="text-xs">Start your first pomodoro!</p>
                  </div>
                ) : (
                  sessionHistory.filter((s) => {
                    const d = new Date(s.completedAt)
                    const today = new Date()
                    return d.toDateString() === today.toDateString()
                  }).map((session) => {
                    const sessionColors = SESSION_COLORS[session.type]
                    const SessionTypeIcon = sessionColors.icon
                    const startTime = new Date(session.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${sessionColors.ring}15` }}
                        >
                          <SessionTypeIcon
                            className="w-4 h-4"
                            style={{ color: sessionColors.ring }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{sessionColors.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {startTime} &middot; {session.duration} min
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <CheckCircle2
                            className="w-4 h-4 shrink-0"
                            style={{ color: sessionColors.ring }}
                          />
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id) }}
                            className="p-1 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete this session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        <Card className="lg:col-span-1">
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setSettingsOpen(!settingsOpen)}>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                Timer Settings
              </CardTitle>
              <CardDescription>Customize your pomodoro timer</CardDescription>
              <motion.div
                animate={{ rotate: settingsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-6 top-6"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Focus Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <label className="text-sm font-medium">Focus Duration</label>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {settings.focusDuration} min
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.focusDuration]}
                    onValueChange={([v]) => handleSettingChange('focusDuration', v)}
                    min={15}
                    max={60}
                    step={5}
                    disabled={isRunning}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>15 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                {/* Short Break Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-500" />
                      <label className="text-sm font-medium">Short Break</label>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {settings.shortBreakDuration} min
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.shortBreakDuration]}
                    onValueChange={([v]) => handleSettingChange('shortBreakDuration', v)}
                    min={3}
                    max={10}
                    step={1}
                    disabled={isRunning}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>3 min</span>
                    <span>10 min</span>
                  </div>
                </div>

                {/* Long Break Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-500" />
                      <label className="text-sm font-medium">Long Break</label>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {settings.longBreakDuration} min
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.longBreakDuration]}
                    onValueChange={([v]) => handleSettingChange('longBreakDuration', v)}
                    min={10}
                    max={30}
                    step={5}
                    disabled={isRunning}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>10 min</span>
                    <span>30 min</span>
                  </div>
                </div>

                <Separator />

                {/* Auto-start toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <div>
                      <label className="text-sm font-medium">Auto-start Next</label>
                      <p className="text-[10px] text-muted-foreground">
                        Automatically start the next session
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoStart}
                    onCheckedChange={(v) => handleSettingChange('autoStart', v)}
                  />
                </div>

                {/* Sound notification toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-amber-500" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <label className="text-sm font-medium">Sound Notifications</label>
                      <p className="text-[10px] text-muted-foreground">
                        Play sound when session ends
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(v) => handleSettingChange('soundEnabled', v)}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  )
}
