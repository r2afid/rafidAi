'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  BookOpen,
  Clock,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Sparkles,
  Calendar,
  BarChart3,
  CheckCircle,
  Award,
  Timer,
  ChevronRight,
  AlertCircle,
  SearchIcon,
  BrainCircuit,
  BarChart3Icon,
  Zap,
  GraduationCap,
  Gift,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, animate } from 'framer-motion'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Count-Up Hook ──
function useCountUp(target: number, duration: number = 1200, decimals: number = 0) {
  const [displayValue, setDisplayValue] = useState(0)
  const motionVal = useMotionValue(0)
  useEffect(() => {
    const controls = animate(motionVal, target, { duration: duration / 1000, ease: 'easeOut' })
    const unsubscribe = motionVal.on('change', (v) => setDisplayValue(Number(v.toFixed(decimals))))
    return () => { controls.stop(); unsubscribe() }
  }, [motionVal, target, duration, decimals])
  return displayValue
}

// ── Helpers ──
function getScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}
function getScoreRing(score: number) {
  if (score >= 80) return 'ring-emerald-500/30'
  if (score >= 60) return 'ring-amber-500/30'
  return 'ring-red-500/30'
}

// ── Sparkline ──
function Sparkline({ data, color = 'currentColor', width = 48, height = 24 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Section Header ──
function SectionHeader({ icon: Icon, title, subtitle, accentColor = 'border-l-emerald-500', iconColor = 'text-emerald-600 dark:text-emerald-400' }: {
  icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; accentColor?: string; iconColor?: string
}) {
  return (
    <div className="flex items-stretch gap-3 py-1">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted/70', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className={cn('w-[3px] rounded-full shrink-0', accentColor)} />
      <div>
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ── Stat Card ──
function StatCard({ title, rawValue, decimals, subtitle, icon: Icon, borderColor, iconColor, hoverGlow, trend, trendValue, sparkline, sparkColor, suffix = '', onIconClick }: {
  title: string; rawValue: number; decimals: number; subtitle: string
  icon: React.ComponentType<{ className?: string }>; borderColor: string; iconColor: string; hoverGlow: string
  trend: 'up' | 'down' | 'neutral'; trendValue: string; sparkline: number[]; sparkColor: string; suffix?: string
  onIconClick?: () => void
}) {
  const animatedValue = useCountUp(rawValue, 1400, decimals)
  return (
    <motion.div whileHover={{ y: -4, scale: 1.015 }} transition={{ type: 'spring', stiffness: 350, damping: 18 }}>
      <Card
        style={{ ['--glow' as string]: hoverGlow }}
        className={cn('border-l-4 transition-all duration-300 hover:shadow-[0_0_20px_-4px_var(--glow)] hover:bg-[var(--glow)]/[0.04]', borderColor)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {onIconClick ? (
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={onIconClick}
                  animate={{ scale: [1, 1.2, 0.95, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: ['easeInOut', 'easeOut', 'easeInOut', 'easeOut'] }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 cursor-pointer transition-colors duration-200 shadow-lg shadow-amber-500/30"
                >
                  <Icon className="h-5 w-5 text-white" />
                </motion.button>
                {/* Spark particles */}
                <motion.div
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-300"
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                    x: [0, 8, 14],
                    y: [0, -8, -14],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 h-1.5 w-1.5 rounded-full bg-orange-400"
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                    x: [0, -8, -14],
                    y: [0, 8, 14],
                  }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.6 }}
                />
                <motion.div
                  className="absolute -top-1 -left-1 h-1.5 w-1.5 rounded-full bg-amber-200"
                  animate={{
                    scale: [0, 1.2, 0],
                    opacity: [0, 0.8, 0],
                    x: [0, -6, -10],
                    y: [0, -6, -10],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: 1.0 }}
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 h-1.5 w-1.5 rounded-full bg-yellow-300"
                  animate={{
                    scale: [0, 1.2, 0],
                    opacity: [0, 0.8, 0],
                    x: [0, 6, 10],
                    y: [0, 6, 10],
                  }}
                  transition={{ duration: 1.3, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            ) : (
              <div className={cn('h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center', iconColor)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold tabular-nums">{animatedValue}{suffix}</div>
            <Sparkline data={sparkline} color={sparkColor} />
          </div>
          <div className="flex items-center gap-1.5 pt-1.5">
            {trend === 'up' && <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-3 w-3" />{trendValue}</span>}
            {trend === 'down' && <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 dark:text-red-400"><TrendingDown className="h-3 w-3" />{trendValue}</span>}
            {trend === 'neutral' && <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground"><span className="h-3 w-3 flex items-center justify-center text-[10px]">—</span>{trendValue}</span>}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Donut Center ──
function DonutCenterLabel({ percentage }: { percentage: number }) {
  const animatedPct = useCountUp(percentage, 1600, 0)
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <p className="text-3xl font-bold tabular-nums">{animatedPct}%</p>
        <p className="text-[10px] text-muted-foreground font-medium">Complete</p>
      </div>
    </div>
  )
}

// ── Welcome Banner ──
function WelcomeBanner({ name, materialsToday, bestQuiz, streak, level, xp }: {
  name: string; materialsToday: number; bestQuiz: string; streak: number; level?: number; xp?: number
}) {
  const { setActivePage } = useAppStore()
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const greeting = `Good to see you, ${name}!`
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(greeting.slice(0, i + 1))
      i++
      if (i >= greeting.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, 45)
    return () => clearInterval(interval)
  }, [name])
  return (
    <motion.div className="relative overflow-hidden rounded-2xl p-6 md:p-7 text-white shadow-lg shadow-emerald-900/20"
      animate={{ backgroundPosition: ['0% 0%', '50% 50%', '100% 100%', '50% 0%', '0% 0%'] }}
      style={{
        backgroundImage: 'linear-gradient(135deg, #0f172a, #1e293b, #064e3b)',
        backgroundSize: '200% 200%',
      }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
    >
      {/* Animated background orbs */}
      <motion.div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.5, 0.9, 1.3, 1], opacity: [0.3, 0.6, 0.2, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-24 -left-12 w-64 h-64 bg-teal-400/12 rounded-full blur-3xl" animate={{ scale: [1, 1.4, 0.8, 1.2, 1], opacity: [0.2, 0.5, 0.1, 0.4, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <motion.div className="absolute top-1/2 left-1/3 w-32 h-32 bg-emerald-400/8 rounded-full blur-2xl" animate={{ scale: [1, 1.3, 0.9, 1.15, 1], opacity: [0.4, 0.7, 0.2, 0.6, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      {/* Floating geometric shapes */}
      <motion.div className="absolute top-5 right-16 w-20 h-20 bg-white/6 rounded-2xl border border-white/10" animate={{ rotate: [12, 30, 5, 20, 12], y: [0, -10, 4, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-10 right-28 w-12 h-12 bg-white/6 rounded-xl border border-white/10" animate={{ rotate: [-12, -30, -5, -20, -12], y: [0, 8, -4, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} />
      {/* Shimmer line */}
      <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
      {/* Floating particles */}
      {[...Array(14)].map((_, i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 bg-emerald-300/30 rounded-full"
          animate={{
            x: [0, (i % 2 === 0 ? 1 : -1) * (25 + (i % 5) * 15), 0],
            y: [0, -20 - (i % 4) * 10, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{ duration: 2 + (i % 4) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          style={{ top: `${5 + i * 6.5}%`, left: `${5 + (i % 7) * 13}%` }}
        />
      ))}
      {/* Subtle grid pattern overlay */}
      <motion.div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} animate={{ opacity: [0.02, 0.04, 0.02] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-white/60">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-medium tracking-wide">{dateStr}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight min-h-[2rem]">
              {displayed}
              {!done ? <span className="inline-block w-[2px] h-[1em] bg-emerald-300 ml-0.5 align-middle animate-pulse" /> : null}
            </h2>
            <p className="text-white/70 text-sm max-w-lg leading-relaxed">
              {materialsToday > 0
                ? `You've knocked out ${materialsToday} material${materialsToday > 1 ? 's' : ''} today with a top quiz score of ${bestQuiz}.`
                : `Your highest quiz score so far is ${bestQuiz}.`}
              {' '}You're on a <span className="font-semibold text-emerald-300">{streak}-day streak</span> — keep pushing!
            </p>
          </div>
          {level ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/8 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 shrink-0 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-400/20">
                <Award className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] text-white/60 font-medium leading-tight uppercase tracking-wider">Level {level}</p>
                <p className="text-sm font-bold leading-tight">{xp} <span className="text-white/50 text-[10px] font-normal">XP</span></p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setActivePage('tutor')} className="bg-emerald-400 text-slate-900 hover:bg-emerald-300 font-bold shadow-lg shadow-emerald-900/30 transition-all hover:shadow-xl hover:scale-[1.02] h-9 text-sm px-5">
            Continue Studying <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" onClick={() => setActivePage('digital-twin')} className="bg-white/8 border-white/20 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm transition-all hover:scale-[1.02] h-9 text-sm px-5">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Recommendations
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── This Week's Goals Section ──
function WeeklyGoalsSection({ goals, goalsLoading, xpReward, xpAwarded, onRegenerate }: { goals: { id: string; label: string; current: number; target: number; icon: React.ComponentType<{ className?: string }>; color: string; progressColor: string; textColor: string; description?: string; unit?: string }[]; goalsLoading?: boolean; xpReward?: number; xpAwarded?: boolean; onRegenerate?: () => void }) {
  const completed = goals.filter(g => g.current >= g.target).length
  const allDone = completed >= goals.length
  const overall = Math.round(goals.reduce((a, g) => a + Math.min(g.current / g.target, 1), 0) / goals.length * 100)
  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="pb-3">
        {goalsLoading ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60">
                <Target className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">This Week's Goals</CardTitle>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
                <CardDescription className="text-xs mt-0.5">AI is generating your personalized goals...</CardDescription>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <HoverCard openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button type="button" className="text-left">
                  <div className="flex items-center gap-2.5 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 group-hover:scale-105 transition-all duration-300">
                      <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CardTitle className="text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">This Week's Goals</CardTitle>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted border border-border/60 opacity-80 group-hover:opacity-100 transition-all duration-300">
                          <Sparkles className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">AI</span>
                        </div>
                      </div>
                      <CardDescription className="text-xs mt-0.5 group-hover:text-amber-600/60 dark:group-hover:text-amber-400/60 transition-colors duration-200">
                        {completed} of {goals.length} completed · <span className="text-amber-500 font-medium">AI-powered</span>
                      </CardDescription>
                    </div>
                  </div>
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="top" align="start" className="w-72 p-0 overflow-hidden rounded-xl border shadow-md">
              <div className="bg-card p-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <BrainCircuit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs font-semibold">Smart Goals — Powered by AI</p>
                </div>
              </div>
              <div className="p-3 space-y-2.5">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Personalized goals generated from your performance data:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: BookOpen, label: 'Materials', color: 'text-emerald-500' },
                    { icon: Target, label: 'Quiz accuracy', color: 'text-teal-500' },
                    { icon: Flame, label: 'Study streak', color: 'text-rose-500' },
                    { icon: Timer, label: 'Study time', color: 'text-amber-500' },
                    { icon: GraduationCap, label: 'Strong topics', color: 'text-sky-500' },
                    { icon: BarChart3Icon, label: 'Weak topics', color: 'text-orange-500' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 px-2 py-1">
                      <Icon className={cn("h-3 w-3", color)} />
                      <span className="text-[10px] text-muted-foreground/80">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t mt-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <p className="text-[10px] text-muted-foreground/60">Targets adapt to your performance — challenging, achievable</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <div className="flex items-center gap-2 shrink-0">
            {xpReward && !xpAwarded && !allDone && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
                <Gift className="h-3 w-3 text-amber-500" />
                <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">+{xpReward} XP</span>
              </div>
            )}
            {xpAwarded && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">+{xpReward} XP</span>
              </div>
            )}
            <Badge variant="secondary" className="text-xs font-medium bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/30">{overall}%</Badge>
            {onRegenerate && (
              <button type="button" onClick={onRegenerate} title="Regenerate goals with AI"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/60 hover:bg-muted transition-colors">
                <RotateCw className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((goal, index) => {
            const pct = Math.round((goal.current / goal.target) * 100)
            const isComplete = goal.current >= goal.target
            const GoalIcon = goal.icon
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                className={cn('flex items-start gap-3 rounded-lg p-2.5 transition-colors', isComplete ? 'bg-emerald-50/80 dark:bg-emerald-950/20' : 'bg-muted/40 hover:bg-muted/60')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isComplete ? 'bg-emerald-500 text-white' : cn('bg-muted', goal.textColor))}>
                  {isComplete ? <CheckCircle className="h-4 w-4" /> : <GoalIcon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={cn('text-xs font-medium truncate', isComplete && 'text-emerald-700 dark:text-emerald-300')}>{goal.label}</p>
                    <span className={cn('text-xs font-semibold tabular-nums shrink-0', isComplete ? 'text-emerald-600 dark:text-emerald-400' : goal.textColor)}>
                      {goal.current}/{goal.target}{goal.unit ? goal.unit : ''}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-[10px] text-muted-foreground/70 mb-1.5 leading-tight">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className={cn('h-1.5 flex-1', goal.progressColor)} />
                    <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ──
export default function GrowthDashboard() {
  const authUser = useAuthStore(s => s.user)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiGoals, setAiGoals] = useState<any[] | null>(null)
  const [goalsLoading, setGoalsLoading] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)
  const xpReward = 500
  const [weakAnalysis, setWeakAnalysis] = useState<any>(null)
  const [weakLoading, setWeakLoading] = useState(false)
  const [weakDialogOpen, setWeakDialogOpen] = useState(false)
  const [quizInsight, setQuizInsight] = useState<any>(null)
  const [quizInsightLoading, setQuizInsightLoading] = useState(false)
  const [quizInsightOpen, setQuizInsightOpen] = useState(false)
  const [materialPriority, setMaterialPriority] = useState<any>(null)
  const [materialPriorityLoading, setMaterialPriorityLoading] = useState(false)
  const [materialPriorityOpen, setMaterialPriorityOpen] = useState(false)

  useEffect(() => {
    if (!authUser?.id) return
    setLoading(true)
    fetch(`/api/dashboard/growth-metrics?student_id=${authUser.id}`)
      .then(r => r.json())
      .then(res => {
        if (res.error) { setError(res.error); return }
        setData(res)
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [authUser?.id])

  // Load cached AI goals from localStorage (don't auto-regenerate on page load)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('resnor_weekly_goals')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.goals && Array.isArray(parsed.goals)) {
          setAiGoals(parsed.goals)
        }
      }
    } catch {}
  }, [])

  // Auto-award XP when all goals completed
  useEffect(() => {
    if (!authUser?.id || xpAwarded || !aiGoals || aiGoals.length !== 4) return
    const allDone = aiGoals.every((g: any) => g.current >= g.target)
    if (!allDone) return
    setXpAwarded(true)
    fetch('/api/gamification/award-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: authUser.id, amount: xpReward }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.levelUp) {
          toast(`Level Up! You're now level ${res.level}`, {
            icon: '🎉',
            duration: 5000,
          })
        }
        toast(`+${xpReward} XP earned for completing all weekly goals!`, {
          icon: '🏆',
          duration: 4000,
        })
        window.dispatchEvent(new Event('xp-updated'))
        // Auto-regenerate goals after completion
        return fetch('/api/dashboard/ai-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: authUser.id }),
        })
      })
      .then(r => r.json())
      .then(res => {
        if (res.goals) {
          setAiGoals(res.goals)
          localStorage.setItem('resnor_weekly_goals', JSON.stringify({ goals: res.goals }))
        }
      })
      .catch(() => {})
  }, [authUser?.id, aiGoals, xpAwarded])

  const handleAnalyzeWeakTopic = useCallback(() => {
    if (!authUser?.id || !data?.topicScores) return
    setWeakDialogOpen(true)
    if (weakAnalysis) return
    setWeakLoading(true)
    fetch('/api/dashboard/ai-weak-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: authUser.id }),
    })
      .then(r => r.json())
      .then(res => setWeakAnalysis(res))
      .catch(() => setWeakAnalysis({ analysis: { rootCause: 'Failed to analyze. Try again later.', strategy: '', focusAreas: [] } }))
      .finally(() => setWeakLoading(false))
  }, [authUser?.id, data, weakAnalysis])

  const handleQuizInsight = useCallback(() => {
    if (!authUser?.id) return
    setQuizInsightOpen(true)
    if (quizInsight) return
    setQuizInsightLoading(true)
    fetch('/api/dashboard/ai-quiz-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: authUser.id }),
    })
      .then(r => r.json())
      .then(res => setQuizInsight(res))
      .catch(() => setQuizInsight({ avgScore: 0, totalQuizzes: 0, insights: [] }))
      .finally(() => setQuizInsightLoading(false))
  }, [authUser?.id, quizInsight])

  const handleMaterialPriority = useCallback(() => {
    if (!authUser?.id) return
    setMaterialPriorityOpen(true)
    if (materialPriority) return
    setMaterialPriorityLoading(true)
    fetch('/api/dashboard/ai-material-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: authUser.id }),
    })
      .then(r => r.json())
      .then(res => setMaterialPriority(res))
      .catch(() => setMaterialPriority({ suggestions: [], summary: { completed: 0, inProgress: 0, pending: 0, total: 0 } }))
      .finally(() => setMaterialPriorityLoading(false))
  }, [authUser?.id, materialPriority])

  const handleRegenerateGoals = useCallback(() => {
    if (!authUser?.id) return
    setGoalsLoading(true)
    setXpAwarded(false)
    setAiGoals(null)
    fetch('/api/dashboard/ai-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: authUser.id }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.goals) {
          setAiGoals(res.goals)
          localStorage.setItem('resnor_weekly_goals', JSON.stringify({ goals: res.goals }))
        }
      })
      .catch(() => {})
      .finally(() => setGoalsLoading(false))
  }, [authUser?.id])

  // Quiz search — flatten all attempts across all topics
  const topicEntries = Object.entries(data?.topicScores || {}) as [string, { score: number; date: string; correctCount: number; totalQuestions: number; quizTitle: string }[]][]
  const allAttempts = useMemo(() => topicEntries.flatMap(([, attempts]) => attempts), [topicEntries])
  const uniqueQuizNames = useMemo(() => [...new Set(allAttempts.map(a => a.quizTitle))].sort(), [allAttempts])
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const filteredQuizNames = useMemo(() =>
    uniqueQuizNames.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase())),
    [uniqueQuizNames, searchQuery]
  )

  // Auto-select first quiz on load
  useEffect(() => {
    if (!selectedQuiz && uniqueQuizNames.length > 0) {
      setSelectedQuiz(uniqueQuizNames[0])
    }
  }, [uniqueQuizNames, selectedQuiz])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // AI-Generated Smart Goals (must be before early returns — Rules of Hooks)
  const goalIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    target: Target, book: BookOpen, brain: Award, clock: Timer,
    flame: Flame, award: Award, star: Award, zap: Target,
  }
  const goalColorMap = [
    { color: 'bg-emerald-500', progressColor: '[&>div]:bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-l-emerald-500' },
    { color: 'bg-teal-500', progressColor: '[&>div]:bg-teal-500', textColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },
    { color: 'bg-amber-500', progressColor: '[&>div]:bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-l-amber-500' },
    { color: 'bg-rose-500', progressColor: '[&>div]:bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', borderColor: 'border-l-rose-500' },
  ]
  const goals = useMemo(() => {
    const raw = aiGoals || []
    if (raw.length === 4) {
      return raw.map((g: any, i: number) => ({
        id: g.id || `goal_${i}`,
        label: g.label,
        current: g.current,
        target: g.target,
        icon: goalIconMap[g.icon] || Target,
        description: g.description || '',
        unit: g.unit || '',
        ...goalColorMap[i % 4],
      }))
    }
    const d = data
    const mp_ = d?.materialProgress || { total: 0, done: 0, inProgress: 0, pending: 0 }
    const streak_ = d?.streak || { current: 0, longest: 0, totalDays: 0 }
    const hsqc = d?.highScoreQuizCount || 0
    const tt = d?.totalTimeMinutes || 0
    return [
      { id: 'materials', label: 'Complete materials', current: mp_.done, target: Math.max(mp_.total, 10), icon: BookOpen, description: '', unit: '', ...goalColorMap[0] },
      { id: 'quizzes', label: 'Score 80%+ on quizzes', current: hsqc, target: Math.max(d?.totalQuizAttempts || 10, 10), icon: Award, description: '', unit: '', ...goalColorMap[1] },
      { id: 'study-hours', label: `Study ${Math.max(Math.round(tt / 60 * 1.3), 10)}+ hours`, current: Math.round(tt / 60 * 10) / 10, target: Math.max(Math.round(tt / 60 * 1.3), 10), icon: Timer, description: '', unit: '', ...goalColorMap[2] },
      { id: 'streak', label: 'Maintain daily streak', current: streak_.current, target: Math.max(streak_.longest || 7, 7), icon: Flame, description: '', unit: '', ...goalColorMap[3] },
    ]
  }, [aiGoals, data])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
      </div>
    )
  }

  const mp = data.materialProgress || { total: 0, done: 0, inProgress: 0, pending: 0 }
  const completionPct = mp.total > 0 ? Math.round((mp.done / mp.total) * 100) : 0
  const streak = data.streak || { current: 0, longest: 0, totalDays: 0 }
  const avgScore = data.averageQuizScore || 0
  const highScoreQuizCount = data.highScoreQuizCount || 0
  const totalTime = data.totalTimeMinutes || 0
  const bestQuiz = data.bestQuizScore || 0

  // Weakest topic computation
  const topicAverages = Object.entries(data.topicScores || {})
    .map(([name, scores]: [string, any[]]) => ({
      name,
      avg: scores.reduce((s: number, a: any) => s + a.score, 0) / scores.length,
      scores: scores.map((a: any) => a.score),
    }))
    .sort((a, b) => a.avg - b.avg)
  const weakestTopic = topicAverages[0] || null
  const weakestTrend = weakestTopic && weakestTopic.scores.length > 1
    ? (() => {
        const mid = Math.floor(weakestTopic.scores.length / 2)
        const firstHalf = weakestTopic.scores.slice(0, mid).reduce((s: number, v: number) => s + v, 0) / mid
        const secondHalf = weakestTopic.scores.slice(mid).reduce((s: number, v: number) => s + v, 0) / (weakestTopic.scores.length - mid)
        return secondHalf > firstHalf ? ('up' as const) : secondHalf < firstHalf ? ('down' as const) : ('neutral' as const)
      })()
    : ('neutral' as const)
  const weakestTrendVal = weakestTopic && weakestTopic.scores.length > 0
    ? `${Math.round(weakestTopic.scores[weakestTopic.scores.length - 1])}%`
    : ''

  // Stat cards
  const statCards = [
    { title: 'Total Materials', rawValue: mp.total, decimals: 0, subtitle: `${mp.done} done · ${mp.pending} pending`, icon: BookOpen, borderColor: 'border-l-emerald-500', iconColor: 'text-emerald-500', hoverGlow: 'oklch(0.646 0.222 41.116)', trend: 'up' as const, trendValue: `${mp.total > 0 ? Math.round(mp.done / mp.total * 100) : 0}%`, sparkline: [mp.total - mp.pending - mp.inProgress, mp.done + mp.inProgress, mp.total], sparkColor: 'oklch(0.646 0.222 41.116)' },
    { title: 'Study Time', rawValue: totalTime, decimals: 0, subtitle: `${data.weeklyActivity?.reduce((a: number, d: any) => a + d.hours, 0).toFixed(1) || 0}h this week`, icon: Clock, borderColor: 'border-l-amber-500', iconColor: 'text-amber-500', hoverGlow: 'oklch(0.769 0.188 70.08)', trend: 'up' as const, trendValue: `${totalTime > 0 ? '+' + Math.round(totalTime / 60 * 10) / 10 + 'h' : '0h'}`, sparkline: data.weeklyActivity?.map((d: any) => d.hours) || [0], sparkColor: 'oklch(0.769 0.188 70.08)', suffix: 'm' },
    { title: 'Quiz Average', rawValue: avgScore, decimals: 1, subtitle: `Across ${data.totalQuizAttempts || 0} quizzes`, icon: Target, borderColor: 'border-l-teal-500', iconColor: 'text-teal-500', hoverGlow: 'oklch(0.6 0.118 184.704)', trend: 'up' as const, trendValue: avgScore > 0 ? `+${avgScore > 50 ? Math.round(avgScore / 5) : avgScore}%` : '0%', sparkline: data.quizAttempts?.map((a: any) => a.score).reverse() || [0], sparkColor: 'oklch(0.6 0.118 184.704)', suffix: '%', onIconClick: handleQuizInsight },
    { title: 'Weakest Topic', rawValue: weakestTopic ? Math.round(weakestTopic.avg) : 0, decimals: 0, subtitle: weakestTopic ? `${weakestTopic.name} · last: ${Math.round(weakestTopic.scores[weakestTopic.scores.length - 1])}%` : 'No data', icon: BrainCircuit, borderColor: 'border-l-orange-500', iconColor: 'text-orange-500', hoverGlow: 'oklch(0.6 0.2 65)', trend: weakestTrend, trendValue: weakestTrendVal, sparkline: weakestTopic?.scores.slice(-5) || [0], sparkColor: 'oklch(0.6 0.2 65)', suffix: '%', onIconClick: handleAnalyzeWeakTopic },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <WelcomeBanner name={authUser?.name || 'Student'} materialsToday={data.materialsToday || 0} bestQuiz={`${bestQuiz}%`} streak={streak.current} level={data.progress?.level} xp={data.progress?.xp} />
      </motion.div>

      {/* This Week's Goals */}
      <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
        <WeeklyGoalsSection goals={goals} goalsLoading={goalsLoading} xpReward={xpReward} xpAwarded={xpAwarded} onRegenerate={handleRegenerateGoals} />
      </motion.div>

      {/* Section: Performance Overview */}
      <div className="space-y-4">
        <SectionHeader icon={BarChart3} title="Performance Overview" subtitle="Your learning metrics at a glance"
accentColor="border-l-emerald-500" iconColor="text-emerald-600 dark:text-emerald-400" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => <StatCard key={card.title} {...card} />)}
        </div>
      </div>

      {/* Section: Learning Analytics */}
      <div className="space-y-4">
        <SectionHeader icon={TrendingUp} title="Learning Analytics" subtitle="Deep dive into your study patterns" accentColor="border-l-teal-500" iconColor="text-teal-600 dark:text-teal-400" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 auto-rows-fr">
        {/* Material Progress Donut */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="h-full transition-shadow duration-300 hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Material Progress</CardTitle>
                  <CardDescription>Completion breakdown across all courses</CardDescription>
                </div>
                <motion.button
                  type="button"
                  onClick={handleMaterialPriority}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
                  title="AI Priority Sorter"
                >
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </motion.button>
              </div>
            </CardHeader>
            <CardContent>
              {mp.total > 0 ? (
                <>
                  <div className="relative">
                    <ChartContainer config={{ completed: { label: 'Completed', color: 'oklch(0.646 0.222 41.116)' }, inProgress: { label: 'In Progress', color: 'oklch(0.769 0.188 70.08)' }, pending: { label: 'Pending', color: 'oklch(0.8 0.08 240)' } }} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <defs>
                          <linearGradient id="donutCompleted" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="oklch(0.646 0.222 41.116)" /><stop offset="100%" stopColor="oklch(0.6 0.12 160)" /></linearGradient>
                          <linearGradient id="donutInProgress" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="oklch(0.769 0.188 70.08)" /><stop offset="100%" stopColor="oklch(0.7 0.15 50)" /></linearGradient>
                          <linearGradient id="donutPending" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="oklch(0.8 0.08 240)" /><stop offset="100%" stopColor="oklch(0.7 0.1 260)" /></linearGradient>
                        </defs>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={[
                          { name: 'Completed', value: mp.done, fill: 'url(#donutCompleted)' },
                          { name: 'In Progress', value: mp.inProgress, fill: 'url(#donutInProgress)' },
                          { name: 'Pending', value: mp.pending, fill: 'url(#donutPending)' },
                        ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} strokeWidth={3} stroke="var(--background)" paddingAngle={3}>
                          {[0, 1, 2].map((i) => <Cell key={i} fill={['url(#donutCompleted)', 'url(#donutInProgress)', 'url(#donutPending)'][i]} />)}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                    <DonutCenterLabel percentage={completionPct} />
                  </div>
                  <div className="mt-3 flex justify-center gap-5 text-sm">
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'oklch(0.646 0.222 41.116)' }} /><span className="text-muted-foreground">{mp.done} <span className="hidden sm:inline">completed</span></span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'oklch(0.769 0.188 70.08)' }} /><span className="text-muted-foreground">{mp.inProgress} <span className="hidden sm:inline">in progress</span></span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'oklch(0.8 0.08 240)' }} /><span className="text-muted-foreground">{mp.pending} <span className="hidden sm:inline">pending</span></span></div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No material progress yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quiz Accuracy Breakdown (Grouped Bar) */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="lg:col-span-2">
          <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-rose-500/[0.03] pointer-events-none" />
            <CardHeader className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Quiz Accuracy Breakdown
                  </CardTitle>
                  <CardDescription>Correct vs Incorrect per attempt</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedQuiz && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        useAppStore.getState().setPreselectedQuizTitle(selectedQuiz)
                        useAppStore.getState().setActivePage('explain-mistake')
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-50 to-rose-100/80 dark:from-rose-950/40 dark:to-rose-900/30 border border-rose-200/50 dark:border-rose-800/30 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:from-rose-100 hover:to-rose-200/80 dark:hover:from-rose-900/50 dark:hover:to-rose-800/40 hover:shadow-sm transition-all duration-200 shrink-0"
                    >
                      <SearchIcon className="h-3.5 w-3.5" />
                      Review My Mistake
                    </motion.button>
                  )}
                  {uniqueQuizNames.length > 0 && (
                  <div ref={searchRef} className="relative w-full sm:w-[280px]">
                    <div className={cn(
                      "flex items-center gap-2 rounded-xl border-2 bg-background/80 backdrop-blur-sm px-3.5 py-2 text-sm transition-all duration-200",
                      showDropdown
                        ? "border-emerald-400/50 shadow-[0_0_0_3px_rgba(52,211,153,0.1)]"
                        : "border-border hover:border-emerald-300/50 hover:shadow-sm"
                    )}>
                      <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <input
                        className="flex h-7 w-full bg-transparent outline-none placeholder:text-muted-foreground/60 text-sm"
                        placeholder="Search quiz by name..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true) }}
                        onFocus={() => setShowDropdown(true)}
                      />
                      {selectedQuiz && !showDropdown && (
                        <button
                          className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => { setSelectedQuiz(''); setSearchQuery('') }}
                          title="Clear selection"
                        >
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      )}
                    </div>
                    {showDropdown && filteredQuizNames.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-[220px] overflow-auto rounded-xl border bg-popover/95 backdrop-blur-sm p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                        {filteredQuizNames.map(name => (
                          <button
                            key={name}
                            className={cn(
                              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                              name === selectedQuiz
                                ? "bg-emerald-100/80 dark:bg-emerald-900/30 font-medium text-emerald-700 dark:text-emerald-300"
                                : "hover:bg-accent text-foreground/80 hover:text-foreground"
                            )}
                            onClick={() => { setSelectedQuiz(name); setSearchQuery(name); setShowDropdown(false) }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                name === selectedQuiz ? "bg-emerald-500" : "bg-muted-foreground/30"
                              )} />
                              <span className="truncate">{name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && filteredQuizNames.length === 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border bg-popover/95 backdrop-blur-sm p-4 text-center text-sm text-muted-foreground shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                        <SearchIcon className="h-5 w-5 mx-auto mb-1 opacity-30" />
                        No quizzes found
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {selectedQuiz && allAttempts.filter(a => a.quizTitle === selectedQuiz).length > 0 ? (
                <>
                  {/* Summary Stats */}
                  {(() => {
                    const attempts = allAttempts.filter((a: any) => a.quizTitle === selectedQuiz)
                    const totalCorrect = attempts.reduce((s: number, a: any) => s + a.correctCount, 0)
                    const totalQuestions = attempts.reduce((s: number, a: any) => s + a.totalQuestions, 0)
                    return (
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                          { label: 'Correct', value: totalCorrect, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/30', border: 'border-emerald-200/50 dark:border-emerald-800/30', accent: 'bg-emerald-500' },
                          { label: 'Incorrect', value: totalQuestions - totalCorrect, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/40 dark:to-rose-900/30', border: 'border-rose-200/50 dark:border-rose-800/30', accent: 'bg-rose-500' },
                          { label: 'Total Questions', value: totalQuestions, color: 'text-sky-700 dark:text-sky-300', bg: 'bg-gradient-to-br from-sky-50 to-sky-100/60 dark:from-sky-950/40 dark:to-sky-900/30', border: 'border-sky-200/50 dark:border-sky-800/30', accent: 'bg-sky-500' },
                        ].map(stat => (
                          <div key={stat.label} className={cn("rounded-xl border p-3 transition-all hover:shadow-sm", stat.bg, stat.border)}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn("h-1.5 w-1.5 rounded-full ring-2 ring-offset-1", stat.accent)} />
                              <span className="text-xs text-muted-foreground">{stat.label}</span>
                            </div>
                            <p className={cn("text-2xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  <ChartContainer
                    config={{
                      correct: { label: 'Correct', color: 'oklch(0.6 0.18 145)' },
                      incorrect: { label: 'Incorrect', color: 'oklch(0.6 0.2 25)' },
                    }}
                    className="aspect-[16/9] max-h-[280px]"
                  >
                    <BarChart
                      data={allAttempts
                        .filter((a: any) => a.quizTitle === selectedQuiz)
                        .map((a: any, i: number) => ({
                          attempt: `Attempt ${i + 1}`,
                          correct: a.correctCount,
                          incorrect: a.totalQuestions - a.correctCount,
                        }))}
                      margin={{ left: -20, right: 10, top: 5 }}
                      barCategoryGap="25%"
                    >
                      <defs>
                        <linearGradient id="correctGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.6 0.18 145)" stopOpacity={0.95} /><stop offset="100%" stopColor="oklch(0.55 0.15 160)" stopOpacity={0.4} /></linearGradient>
                        <linearGradient id="incorrectGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.6 0.2 25)" stopOpacity={0.95} /><stop offset="100%" stopColor="oklch(0.55 0.18 20)" stopOpacity={0.4} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                      <XAxis
                        dataKey="attempt"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: 'oklch(0.6 0 0)' }}
                      />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: 'oklch(0.6 0 0)' }} />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          formatter={(value: number, name: string) => (
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                name === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'
                              )} />
                              <span className="font-medium capitalize">{name}: {value}</span>
                            </div>
                          )}
                        />}
                      />
                      <Bar
                        dataKey="correct"
                        fill="url(#correctGrad)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                        animationDuration={800}
                      />
                      <Bar
                        dataKey="incorrect"
                        fill="url(#incorrectGrad)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ChartContainer>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm bg-emerald-500/80" />
                      <span className="text-xs text-muted-foreground">Correct</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm bg-rose-500/80" />
                      <span className="text-xs text-muted-foreground">Incorrect</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="relative mb-4">
                    <TrendingUp className="h-10 w-10 opacity-20" />
                    <SearchIcon className="h-5 w-5 absolute -bottom-1 -right-1 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">{selectedQuiz ? 'No attempts for this quiz' : 'Search and select a quiz above'}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Choose a quiz to see your correct vs incorrect breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>

      {/* Section: Recent Activity */}
      <div className="space-y-4">
        <SectionHeader icon={Clock} title="Recent Activity" subtitle="Your weekly study and quiz activity" accentColor="border-l-rose-500" iconColor="text-rose-600 dark:text-rose-400" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 auto-rows-fr">
          {/* Weekly Activity Bar Chart */}
          <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Card className="h-full transition-shadow duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Weekly Activity</CardTitle>
                <CardDescription>Hours studied per day this week</CardDescription>
              </CardHeader>
              <CardContent>
              {data.weeklyActivity?.length ? (
                <ChartContainer config={{ hours: { label: 'Hours Studied', color: 'oklch(0.646 0.222 41.116)' } }} className="aspect-[16/9] max-h-[250px]">
                  <BarChart data={data.weeklyActivity} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.646 0.222 41.116)" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="oklch(0.646 0.222 41.116)" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'oklch(0.6 0 0)' }} />
                    <YAxis tickLine={false} axisLine={false} domain={[0, 'auto']} tick={{ fontSize: 12, fill: 'oklch(0.6 0 0)' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="hours" fill="url(#hoursGradient)" radius={[8, 8, 0, 0]} maxBarSize={44} animationDuration={800} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No activity data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Quiz Attempts */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="h-full transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Quiz Attempts</CardTitle>
              <CardDescription>Your last {data.quizAttempts?.length || 0} quiz results</CardDescription>
            </CardHeader>
            <CardContent>
                {data.quizAttempts?.length ? (
                  <div className="space-y-1">
                    {data.quizAttempts.map((quiz: any, index: number) => {
                      const scoreColor = quiz.score >= 80 ? 'emerald' : quiz.score >= 60 ? 'amber' : 'red'
                      return (
                      <motion.div key={quiz.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.05 * index }}
                        whileHover={{ x: 4, transition: { duration: 0.2 } }}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all border border-transparent',
                          scoreColor === 'emerald' ? 'hover:border-emerald-200/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/15 dark:hover:border-emerald-800/30 hover:shadow-sm' :
                          scoreColor === 'amber' ? 'hover:border-amber-200/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/15 dark:hover:border-amber-800/30 hover:shadow-sm' :
                          'hover:border-red-200/50 hover:bg-red-50/50 dark:hover:bg-red-950/15 dark:hover:border-red-800/30 hover:shadow-sm'
                        )}>
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tracking-tight',
                          scoreColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                          scoreColor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                          'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        )}>{quiz.date?.slice(5)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn('h-2 w-2 rounded-full shrink-0', scoreColor === 'emerald' ? 'bg-emerald-500' : scoreColor === 'amber' ? 'bg-amber-500' : 'bg-red-500')} />
                            <p className="truncate text-sm font-medium">{quiz.title}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-24">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${quiz.score}%` }}
                                transition={{ duration: 0.6, delay: 0.2 + index * 0.05 }}
                                className={cn('h-full rounded-full', scoreColor === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : scoreColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500')}
                              />
                            </div>
                            <span className={cn('text-xs font-bold tabular-nums', scoreColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : scoreColor === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>{quiz.score}</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">/100</span>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            'border-0 text-[10px] font-semibold px-2.5 py-0.5 shadow-sm',
                            quiz.score >= 80 ? 'bg-gradient-to-r from-emerald-100 to-emerald-200/80 text-emerald-700 dark:from-emerald-900/50 dark:to-emerald-800/40 dark:text-emerald-300' :
                            quiz.score >= 60 ? 'bg-gradient-to-r from-amber-100 to-amber-200/80 text-amber-700 dark:from-amber-900/50 dark:to-amber-800/40 dark:text-amber-300' :
                            'bg-gradient-to-r from-red-100 to-red-200/80 text-red-700 dark:from-red-900/50 dark:to-red-800/40 dark:text-red-300'
                          )}>
                          {quiz.score >= 80 ? 'Passed' : quiz.score >= 60 ? 'Average' : 'Needs Work'}
                        </Badge>
                      </motion.div>
                    )})}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No quiz attempts yet</p>
                  </div>
                )}
                <div className="mt-3 pt-2 border-t">
                  <button onClick={() => useAppStore.getState().setActivePage('quiz')} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                    View all quiz attempts <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
      </div>
      </div>
      {/* Material Priority AI Sheet */}
      <Sheet open={materialPriorityOpen} onOpenChange={setMaterialPriorityOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col overflow-hidden">
          <SheetTitle className="sr-only">AI Priority Sorter</SheetTitle>
          <SheetDescription className="sr-only">Prioritized materials for upcoming exams</SheetDescription>
          {/* Fixed header */}
          <div className="relative overflow-hidden shrink-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 px-5 pt-5 pb-6">
            <motion.div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-400/8 rounded-full blur-2xl" animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
            <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">AI Priority Sorter</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {materialPriority ? `${materialPriority.summary.pending + materialPriority.summary.inProgress} unfinished · ${materialPriority.summary.completed} done` : 'Analyzing...'}
                  </p>
                </div>
              </div>
              {materialPriority && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
                  <BookOpen className="h-3 w-3 text-amber-300" />
                  <span className="text-[11px] font-semibold text-white/80">{materialPriority.summary.pending + materialPriority.summary.inProgress} unfinished</span>
                </div>
              )}
            </div>
          </div>
          {/* Scrollable body */}
          <ScrollArea className="flex-1 p-5 h-full">
            {materialPriorityLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <motion.div className="absolute inset-0 rounded-full border-2 border-amber-500/20" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <p className="text-sm text-muted-foreground">Analyzing materials against your exam routine...</p>
              </div>
            ) : materialPriority?.suggestions?.length ? (
              <div className="space-y-2.5">
                {/* Exam countdown bar */}
                {materialPriority.routine?.length && (
                  <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                    {materialPriority.routine.map((ex: any, i: number) => (
                      <div key={i} className={cn(
                        'flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border',
                        ex.daysUntil <= 7 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30 text-rose-700 dark:text-rose-300' :
                        ex.daysUntil <= 14 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-300' :
                        'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300'
                      )}>
                        <Timer className="h-3 w-3" />
                        <span className="font-bold tabular-nums">{ex.daysUntil}d</span>
                        <span className="opacity-70">{ex.course}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                  <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Prioritized for upcoming exams</p>
                </div>
                {materialPriority.suggestions.map((s: any, i: number) => {
                  const priorityLabel = s.priority === 'high' ? 'High Priority' : s.priority === 'medium' ? 'Medium' : 'Low'
                  return (
                    <motion.div
                      key={s.topic}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                       className="group relative rounded-xl border border-border/50 bg-card p-4 space-y-2 hover:border-amber-200/50 dark:hover:border-amber-800/30 hover:shadow-sm transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={cn('h-2.5 w-2.5 rounded-full mt-1 ring-2 ring-offset-1 shrink-0', s.priority === 'high' ? 'bg-rose-500 ring-rose-200 dark:ring-rose-800' : s.priority === 'medium' ? 'bg-amber-500 ring-amber-200 dark:ring-amber-800' : 'bg-sky-500 ring-sky-200 dark:ring-sky-800')} />
                          <div>
                            <span className="font-semibold text-sm">{s.topic}</span>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-1">{s.reason}</p>
                          </div>
                        </div>
                        <span className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0', s.priority === 'high' ? 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 dark:from-rose-900/40 dark:to-rose-800/30 dark:text-rose-300' : s.priority === 'medium' ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-300' : 'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 dark:from-sky-900/40 dark:to-sky-800/30 dark:text-sky-300')}>{priorityLabel}</span>
                      </div>
                      {s.estimatedTime && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                          <Clock className="h-3 w-3" />
                          <span>{s.estimatedTime} to finish</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : materialPriority && !materialPriority.suggestions?.length ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
                {materialPriority.summary.total === 0 ? (
                  <>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 flex items-center justify-center">
                      <BookOpen className="h-7 w-7 text-amber-500" />
                    </div>
                    <p className="text-base font-semibold text-foreground">No materials yet</p>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">Start studying and completing materials to get personalized priority suggestions.</p>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center">
                      <CheckCircle className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-base font-semibold text-foreground">All materials completed!</p>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">No pending materials — you're fully prepared for exams.</p>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                <BookOpen className="h-8 w-8 opacity-30" />
                <p className="text-sm">Click the sparkle icon on Material Progress</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Quiz Insight AI Dialog */}
      <Dialog open={quizInsightOpen} onOpenChange={setQuizInsightOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden gap-0 shadow-2xl border-0">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-5 pt-5 pb-6">
            <motion.div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-400/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-400/8 rounded-full blur-2xl" animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
            <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-sm">
                  <Target className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-white">AI Quiz Insights</DialogTitle>
                  <DialogDescription className="text-xs text-white/60 mt-0.5">
                    {quizInsight ? `Based on ${quizInsight.totalQuizzes} quizzes` : 'Analyzing...'}
                  </DialogDescription>
                </div>
              </div>
              {quizInsight && (
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-white tabular-nums">{quizInsight.avgScore}%</div>
                  <div className="text-[9px] text-white/50 font-medium uppercase tracking-wider">Average</div>
                </div>
              )}
            </div>
          </div>
          {/* Body */}
          <div className="p-5">
            {quizInsightLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                  <motion.div className="absolute inset-0 rounded-full border-2 border-teal-500/20" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <p className="text-sm text-muted-foreground">Analyzing your quiz data...</p>
              </div>
            ) : quizInsight?.insights?.length ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-teal-400 to-emerald-400" />
                  <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Focus on these topics to boost your score</p>
                </div>
                {quizInsight.insights.map((item: any, i: number) => {
                  const maxGain = quizInsight.insights[0].gain
                  const barPct = (item.gain / maxGain) * 100
                  return (
                    <motion.button
                      key={item.topic}
                      type="button"
                      onClick={() => {
                        const topicMap: Record<string, string> = {
                          'Arrays & Linked Lists': 'arrays',
                          'Trees & BST': 'trees',
                          'Sorting Algorithms': 'sorting',
                          'Graphs & Traversal': 'graph',
                          'Dynamic Programming': 'dp',
                          'Hash Tables': 'hashing',
                          'Recursion': 'recursion',
                          'Big-O Complexity': 'complexity',
                        }
                        const topicId = topicMap[item.topic] || item.topic.toLowerCase().replace(/\s+/g, '-')
                        useAppStore.getState().setPreselectedQuizTopic(topicId)
                        useAppStore.getState().setPreselectedQuizTopicTitle(item.topic)
                        useAppStore.getState().setActivePage('quiz')
                      }}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                       className="group relative w-full text-left rounded-xl border border-border/50 bg-card hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-emerald-50/80 dark:hover:from-teal-950/20 dark:hover:to-emerald-950/20 hover:border-teal-200/50 dark:hover:border-teal-800/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300',
                          'bg-muted text-muted-foreground group-hover:bg-teal-100 group-hover:text-teal-700 dark:group-hover:bg-teal-900/50 dark:group-hover:text-teal-300'
                        )}>
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                            {item.topic}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barPct}%` }}
                                transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-teal-600 dark:text-teal-400 shrink-0">+{item.gain}%</span>
                          </div>
                        </div>
                        <div className="shrink-0 h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40 group-hover:text-teal-500 transition-all duration-300">
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-teal-500" />
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            ) : quizInsight && !quizInsight.insights?.length ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-emerald-500" />
                  </div>
                  <motion.div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <p className="text-base font-semibold text-foreground">All Topics Looking Strong!</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">No major weak spots — consistent performance across the board. Keep it up!</p>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Target className="h-8 w-8 opacity-30" />
                <p className="text-sm">Click the Target icon on the Quiz Average card</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Weak Topic AI Analysis Dialog */}
      <Dialog open={weakDialogOpen} onOpenChange={setWeakDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden gap-0 shadow-2xl border-0">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 px-5 pt-5 pb-6">
            <motion.div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-400/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-400/8 rounded-full blur-2xl" animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
            <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-sm">
                <BrainCircuit className="h-5 w-5 text-orange-300" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-base font-bold text-white">AI Topic Analysis</DialogTitle>
                <DialogDescription className="text-xs text-white/60 mt-0.5">
                  {weakAnalysis ? weakAnalysis.topic : 'Analyzing...'}
                </DialogDescription>
              </div>
              {weakAnalysis && (
                <div className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm',
                  weakAnalysis.analysis?.confidence === 'struggling' ? 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 border border-red-200 dark:from-red-950/30 dark:to-red-900/20 dark:text-red-300 dark:border-red-800/30' :
                  weakAnalysis.analysis?.confidence === 'improving' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 border border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30' :
                  'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 border border-amber-200 dark:from-amber-950/30 dark:to-amber-900/20 dark:text-amber-300 dark:border-amber-800/30'
                )}>
                  {weakAnalysis.analysis?.confidence === 'struggling' ? 'Needs Work' :
                   weakAnalysis.analysis?.confidence === 'improving' ? 'Improving' : 'Needs Consistency'}
                </div>
              )}
            </div>
          </div>
          <div className="p-5">
            {weakLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <motion.div className="absolute inset-0 rounded-full border-2 border-orange-500/20" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <p className="text-sm text-muted-foreground">Analyzing your weakest topic...</p>
              </div>
            ) : weakAnalysis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl px-4 py-3 border border-border/50 bg-gradient-to-r from-muted/50 to-muted/30">
                  <span className="text-sm font-semibold">Average Score</span>
                  <span className={cn(
                    'text-xl font-bold tabular-nums',
                    weakAnalysis.avgScore >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  )}>{weakAnalysis.avgScore}%</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100/60 dark:from-orange-950/30 dark:to-orange-900/20 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                      <AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Root Cause</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-foreground/85 leading-relaxed">{weakAnalysis.analysis?.rootCause}</p>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-sky-50 to-sky-100/60 dark:from-sky-950/30 dark:to-sky-900/20 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
                      <Target className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">Strategy</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-foreground/85 leading-relaxed">{weakAnalysis.analysis?.strategy}</p>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/60 dark:from-emerald-950/30 dark:to-emerald-900/20 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Focus Areas</span>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {weakAnalysis.analysis?.focusAreas?.map((area: string, i: number) => (
                        <div key={i} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/30 text-sm font-medium text-emerald-700 dark:text-emerald-300 shadow-sm">
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/50 px-4 py-3 bg-gradient-to-r from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground/80">Estimated effort:</strong> {weakAnalysis.analysis?.estimatedPracticeNeeded}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <BrainCircuit className="h-8 w-8 opacity-30" />
                <p className="text-sm">Click the AI icon on the Weakest Topic card to analyze</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

