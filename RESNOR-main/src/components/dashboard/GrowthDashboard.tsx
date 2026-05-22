'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, animate } from 'framer-motion'

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
function SectionHeader({ icon: Icon, title, accentColor = 'border-l-emerald-500', iconColor = 'text-emerald-600 dark:text-emerald-400' }: {
  icon: React.ComponentType<{ className?: string }>; title: string; accentColor?: string; iconColor?: string
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className={cn('flex h-7 w-7 items-center justify-center rounded-md bg-muted/80', iconColor)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className={cn('h-5 w-[3px] rounded-full', accentColor)} />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
    </div>
  )
}

// ── Stat Card ──
function StatCard({ title, rawValue, decimals, subtitle, icon: Icon, borderColor, iconColor, hoverGlow, trend, trendValue, sparkline, sparkColor, suffix = '' }: {
  title: string; rawValue: number; decimals: number; subtitle: string
  icon: React.ComponentType<{ className?: string }>; borderColor: string; iconColor: string; hoverGlow: string
  trend: 'up' | 'down' | 'neutral'; trendValue: string; sparkline: number[]; sparkColor: string; suffix?: string
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
          <div className={cn('h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center', iconColor)}>
            <Icon className="h-4.5 w-4.5" />
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
function WelcomeBanner({ name, materialsToday, bestQuiz, streak }: {
  name: string; materialsToday: number; bestQuiz: string; streak: number
}) {
  const { setActivePage } = useAppStore()
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-6 md:p-8 text-white shadow-lg shadow-emerald-900/10">
      <motion.div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.8, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 0.9, 1.2, 1], x: [0, 20, -15, 10, 0], y: [0, -10, 15, -8, 0], opacity: [0.3, 0.6, 0.4, 0.5, 0.3] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute top-4 right-8 w-20 h-20 bg-white/5 rounded-2xl rotate-12" />
      <div className="absolute bottom-6 right-24 w-12 h-12 bg-white/5 rounded-xl -rotate-12" />
      <div className="absolute inset-0 rounded-2xl bg-white/[0.06] backdrop-blur-[1px] pointer-events-none" />
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.1)] pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2 text-white/80">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{dateStr}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {name}! 👋</h2>
        <p className="text-white/85 text-sm md:text-base mb-6 max-w-lg">
          {materialsToday > 0
            ? `You've completed ${materialsToday} material${materialsToday > 1 ? 's' : ''} today with a best quiz score of ${bestQuiz}. `
            : `Your best quiz score is ${bestQuiz}. `}
          Keep going — you're on a {streak}-day streak! 🔥
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setActivePage('tutor')} className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shadow-emerald-900/20 transition-all hover:shadow-xl hover:scale-[1.02]">
            Continue Studying <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setActivePage('digital-twin')} className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:text-white backdrop-blur-sm transition-all hover:scale-[1.02]">
            <Sparkles className="mr-2 h-4 w-4" /> View Recommendations
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Weekly Goals Section ──
function WeeklyGoalsSection({ goals }: { goals: { id: string; label: string; current: number; target: number; icon: React.ComponentType<{ className?: string }>; color: string; progressColor: string; textColor: string }[] }) {
  const completed = goals.filter(g => g.current >= g.target).length
  const overall = Math.round(goals.reduce((a, g) => a + Math.min(g.current / g.target, 1), 0) / goals.length * 100)
  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60">
              <Target className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base">This Week's Goals</CardTitle>
              <CardDescription className="text-xs mt-0.5">{completed} of {goals.length} completed</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">{overall}% overall</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((goal, index) => {
            const pct = Math.round((goal.current / goal.target) * 100)
            const isComplete = goal.current >= goal.target
            const GoalIcon = goal.icon
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                className={cn('flex items-center gap-3 rounded-lg p-2.5 transition-colors', isComplete ? 'bg-emerald-50/80 dark:bg-emerald-950/20' : 'bg-muted/40 hover:bg-muted/60')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isComplete ? 'bg-emerald-500 text-white' : cn('bg-muted', goal.textColor))}>
                  {isComplete ? <CheckCircle className="h-4 w-4" /> : <GoalIcon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={cn('text-xs font-medium truncate', isComplete && 'text-emerald-700 dark:text-emerald-300')}>{goal.label}</p>
                    <span className={cn('text-xs font-semibold tabular-nums shrink-0', isComplete ? 'text-emerald-600 dark:text-emerald-400' : goal.textColor)}>{goal.current}/{goal.target}</span>
                  </div>
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
  const bestQuiz = data.quizAttempts?.length
    ? Math.max(...data.quizAttempts.map((a: any) => a.score))
    : 0

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

  // Weekly goals
  const goals = [
    { id: 'materials', label: 'Complete 10 materials', current: mp.done, target: Math.max(mp.total, 10), icon: BookOpen, color: 'bg-emerald-500', progressColor: '[&>div]:bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'quizzes', label: 'Score 80%+ on quizzes', current: highScoreQuizCount, target: Math.max(data.totalQuizAttempts || 10, 10), icon: Award, color: 'bg-teal-500', progressColor: '[&>div]:bg-teal-500', textColor: 'text-teal-600 dark:text-teal-400' },
    { id: 'study-hours', label: 'Study 20+ hours', current: Math.round(totalTime / 60 * 10) / 10, target: 20, icon: Timer, color: 'bg-amber-500', progressColor: '[&>div]:bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
    { id: 'streak', label: 'Maintain daily streak', current: streak.current, target: Math.max(streak.longest || 7, 7), icon: Flame, color: 'bg-rose-500', progressColor: '[&>div]:bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' },
  ]

  // Stat cards
  const statCards = [
    { title: 'Total Materials', rawValue: mp.total, decimals: 0, subtitle: `${mp.done} done · ${mp.pending} pending`, icon: BookOpen, borderColor: 'border-l-emerald-500', iconColor: 'text-emerald-500', hoverGlow: 'oklch(0.646 0.222 41.116)', trend: 'up' as const, trendValue: `${mp.total > 0 ? Math.round(mp.done / mp.total * 100) : 0}%`, sparkline: [mp.total - mp.pending - mp.inProgress, mp.done + mp.inProgress, mp.total], sparkColor: 'oklch(0.646 0.222 41.116)' },
    { title: 'Study Time', rawValue: totalTime, decimals: 0, subtitle: `${data.weeklyActivity?.reduce((a: number, d: any) => a + d.hours, 0).toFixed(1) || 0}h this week`, icon: Clock, borderColor: 'border-l-amber-500', iconColor: 'text-amber-500', hoverGlow: 'oklch(0.769 0.188 70.08)', trend: 'up' as const, trendValue: `${totalTime > 0 ? '+' + Math.round(totalTime / 60 * 10) / 10 + 'h' : '0h'}`, sparkline: data.weeklyActivity?.map((d: any) => d.hours) || [0], sparkColor: 'oklch(0.769 0.188 70.08)', suffix: 'm' },
    { title: 'Quiz Average', rawValue: avgScore, decimals: 1, subtitle: `Across ${data.totalQuizAttempts || 0} quizzes`, icon: Target, borderColor: 'border-l-teal-500', iconColor: 'text-teal-500', hoverGlow: 'oklch(0.6 0.118 184.704)', trend: 'up' as const, trendValue: avgScore > 0 ? `+${avgScore > 50 ? Math.round(avgScore / 5) : avgScore}%` : '0%', sparkline: data.quizAttempts?.map((a: any) => a.score).reverse() || [0], sparkColor: 'oklch(0.6 0.118 184.704)', suffix: '%' },
    { title: 'Weakest Topic', rawValue: weakestTopic ? Math.round(weakestTopic.avg) : 0, decimals: 0, subtitle: weakestTopic ? `${weakestTopic.name} · last: ${Math.round(weakestTopic.scores[weakestTopic.scores.length - 1])}%` : 'No data', icon: AlertCircle, borderColor: 'border-l-orange-500', iconColor: 'text-orange-500', hoverGlow: 'oklch(0.6 0.2 65)', trend: weakestTrend, trendValue: weakestTrendVal, sparkline: weakestTopic?.scores.slice(-5) || [0], sparkColor: 'oklch(0.6 0.2 65)', suffix: '%' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <WelcomeBanner name={authUser?.name || 'Student'} materialsToday={data.materialsToday || 0} bestQuiz={`${bestQuiz}%`} streak={streak.current} />
      </motion.div>

      {/* Weekly Goals */}
      <WeeklyGoalsSection goals={goals} />

      {/* Section: Performance Overview */}
      <SectionHeader icon={BarChart3} title="Performance Overview" accentColor="border-l-emerald-500" iconColor="text-emerald-600 dark:text-emerald-400" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      {/* Section: Learning Analytics */}
      <SectionHeader icon={TrendingUp} title="Learning Analytics" accentColor="border-l-teal-500" iconColor="text-teal-600 dark:text-teal-400" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Material Progress Donut */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="h-full transition-shadow duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Material Progress</CardTitle>
              <CardDescription>Completion breakdown across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              {mp.total > 0 ? (
                <>
                  <div className="relative">
                    <ChartContainer config={{ completed: { label: 'Completed', color: 'oklch(0.646 0.222 41.116)' }, inProgress: { label: 'In Progress', color: 'oklch(0.769 0.188 70.08)' }, pending: { label: 'Pending', color: 'oklch(0.828 0.189 84.429)' } }} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={[
                          { name: 'Completed', value: mp.done, fill: 'oklch(0.646 0.222 41.116)' },
                          { name: 'In Progress', value: mp.inProgress, fill: 'oklch(0.769 0.188 70.08)' },
                          { name: 'Pending', value: mp.pending, fill: 'oklch(0.828 0.189 84.429)' },
                        ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} strokeWidth={2} stroke="oklch(1 0 0)">
                          {[0, 1, 2].map((i) => <Cell key={i} fill={['oklch(0.646 0.222 41.116)', 'oklch(0.769 0.188 70.08)', 'oklch(0.828 0.189 84.429)'][i]} />)}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                    <DonutCenterLabel percentage={completionPct} />
                  </div>
                  <div className="mt-3 flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'oklch(0.646 0.222 41.116)' }} /><span className="text-muted-foreground">{mp.done} completed</span></div>
                    <div className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5" style={{ color: 'oklch(0.769 0.188 70.08)' }} /><span className="text-muted-foreground">{mp.inProgress} in progress</span></div>
                    <div className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5" style={{ color: 'oklch(0.828 0.189 84.429)' }} /><span className="text-muted-foreground">{mp.pending} pending</span></div>
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
                          { label: 'Correct', value: totalCorrect, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200/50 dark:border-emerald-800/30', dot: 'bg-emerald-500' },
                          { label: 'Incorrect', value: totalQuestions - totalCorrect, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200/50 dark:border-rose-800/30', dot: 'bg-rose-500' },
                          { label: 'Total Questions', value: totalQuestions, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200/50 dark:border-sky-800/30', dot: 'bg-sky-500' },
                        ].map(stat => (
                          <div key={stat.label} className={cn("rounded-xl border p-3", stat.bg, stat.border)}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn("h-2 w-2 rounded-full", stat.dot)} />
                              <span className="text-xs text-muted-foreground">{stat.label}</span>
                            </div>
                            <p className={cn("text-xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
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
                          attempt: `#${i + 1}`,
                          correct: a.correctCount,
                          incorrect: a.totalQuestions - a.correctCount,
                        }))}
                      margin={{ left: -20, right: 10, top: 5 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                      <XAxis
                        dataKey="attempt"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: 'oklch(0.6 0 0)' }}
                      />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: 'oklch(0.6 0 0)' }} />
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
                        fill="oklch(0.6 0.18 145)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                        animationDuration={800}
                      />
                      <Bar
                        dataKey="incorrect"
                        fill="oklch(0.6 0.2 25)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
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

      {/* Bottom Row: Weekly Activity + Recent Quiz Attempts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} domain={[0, 'auto']} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="hours" fill="oklch(0.646 0.222 41.116)" radius={[6, 6, 0, 0]} maxBarSize={40} />
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
        <div className="flex flex-col">
          <SectionHeader icon={Clock} title="Recent Activity" accentColor="border-l-rose-500" iconColor="text-rose-600 dark:text-rose-400" />
          <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="flex-1">
            <Card className="h-full transition-shadow duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Quiz Attempts</CardTitle>
                <CardDescription>Your last {data.quizAttempts?.length || 0} quiz results</CardDescription>
              </CardHeader>
              <CardContent>
                {data.quizAttempts?.length ? (
                  <div className="space-y-1">
                    {data.quizAttempts.map((quiz: any, index: number) => (
                      <motion.div key={quiz.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.05 * index }}
                        className={cn('flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors', index % 2 === 0 ? 'bg-transparent' : 'bg-muted/30')}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{quiz.date?.slice(5)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full shrink-0 ring-2', getScoreColor(quiz.score), getScoreRing(quiz.score))} />
                            <p className="truncate text-sm font-medium">{quiz.title}</p>
                          </div>
                          <div className="flex items-center gap-2.5 ml-4 mt-1">
                            <Progress value={quiz.score} className="mt-0.5 h-1.5 flex-1 max-w-24" />
                            <span className="text-xs font-bold tabular-nums">{quiz.score}</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">/100</span>
                          </div>
                        </div>
                        <Badge variant={quiz.score >= 70 ? 'default' : 'secondary'}
                          className={quiz.score >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0' : quiz.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-0'}>
                          {quiz.score >= 70 ? 'Passed' : quiz.score >= 60 ? 'Average' : 'Low'}
                        </Badge>
                      </motion.div>
                    ))}
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
    </div>
  )
}
