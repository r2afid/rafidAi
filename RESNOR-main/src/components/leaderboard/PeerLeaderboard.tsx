'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import {
  Trophy,
  TrendingUp,
  Minus,
  Users,
  Star,
  Medal,
  Crown,
  ChevronUp,
  ChevronDown,
  Zap,
  Flame,
  Loader2,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LeaderboardStudent {
  id: string
  name: string
  initials: string
  xp: number
  badges: number
  streak: number
  rank: number
  change: number
  isCurrentUser?: boolean
}

type TimeTab = 'weekly' | 'monthly' | 'alltime'

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function formatXP(xp: number): string {
  return xp.toLocaleString()
}

function getChangeDisplay(change: number) {
  if (change > 0) return { icon: ChevronUp, label: 'UP', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
  if (change < 0) return { icon: ChevronDown, label: 'DOWN', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' }
  return { icon: Minus, label: '—', color: 'text-muted-foreground', bg: 'bg-muted/30' }
}

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-400/30' }
  if (rank === 2) return { bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-400/30' }
  if (rank === 3) return { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-400/30' }
  return { bg: '', border: '', text: 'text-muted-foreground', ring: '' }
}

function getInitialsBgColor(id: string): string {
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-teal-500 to-cyan-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconBg,
  iconColor,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  iconBg: string
  iconColor: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{subtext}</p>
      </div>
    </motion.div>
  )
}

function PodiumCard({
  student,
  place,
  delay,
}: {
  student: LeaderboardStudent
  place: 1 | 2 | 3
  delay: number
}) {
  const isFirst = place === 1
  const isSecond = place === 2
  const isThird = place === 3

  const avatarSize = isFirst ? 'w-16 h-16 text-xl' : 'w-14 h-14 text-lg'
  const cardWidth = isFirst ? 'max-w-[200px]' : 'max-w-[170px]'

  const medalIcon = isFirst ? '🥇' : isSecond ? '🥈' : '🥉'

  const theme = {
    1: {
      avatar: 'from-amber-400 via-yellow-500 to-amber-500',
      border: 'border-amber-400/40 dark:border-amber-500/30',
      glow: 'from-amber-400/40 via-yellow-500/30 to-amber-500/40',
      bg: 'bg-gradient-to-b from-amber-50/90 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20',
      shadow: 'shadow-amber-400/25 dark:shadow-amber-500/15',
      text: 'text-amber-700 dark:text-amber-300',
      textMuted: 'text-amber-600/70 dark:text-amber-400/70',
      badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      base: 'from-amber-300 to-amber-200 dark:from-amber-700/60 dark:to-amber-600/40',
    },
    2: {
      avatar: 'from-slate-400 via-gray-400 to-slate-500',
      border: 'border-slate-300/60 dark:border-slate-600/40',
      glow: 'from-slate-400/30 via-gray-400/20 to-slate-500/30',
      bg: 'bg-gradient-to-b from-slate-50/90 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-700/20',
      shadow: 'shadow-slate-400/20 dark:shadow-slate-500/10',
      text: 'text-slate-700 dark:text-slate-300',
      textMuted: 'text-slate-500/70 dark:text-slate-400/70',
      badge: 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600',
      base: 'from-slate-300 to-slate-200 dark:from-slate-700/50 dark:to-slate-600/30',
    },
    3: {
      avatar: 'from-orange-400 via-amber-500 to-orange-600',
      border: 'border-orange-300/60 dark:border-orange-700/40',
      glow: 'from-orange-400/30 via-amber-500/20 to-orange-600/30',
      bg: 'bg-gradient-to-b from-orange-50/90 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20',
      shadow: 'shadow-orange-400/20 dark:shadow-orange-500/10',
      text: 'text-orange-700 dark:text-orange-300',
      textMuted: 'text-orange-600/70 dark:text-orange-400/70',
      badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      base: 'from-orange-300 to-orange-200 dark:from-orange-700/50 dark:to-orange-600/30',
    },
  }[place]

  const floatAmplitude = isFirst ? 8 : isSecond ? 5 : 3
  const hoverLift = isFirst ? -18 : isSecond ? -12 : -8
  const sparkleCount = isFirst ? 10 : isSecond ? 4 : 0
  const floatDuration = isFirst ? 2.5 : isSecond ? 3.5 : 4.5

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={cn(
        'flex flex-col items-center gap-2',
        isFirst ? 'order-2 md:order-2 z-10' : isSecond ? 'order-1 md:order-1 z-0' : 'order-3 md:order-3 z-0',
      )}
    >
      {/* Rank icon above card — bounces periodically */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: 1,
          rotate: 0,
          y: isFirst ? [0, -4, 0, -2, 0] : [0, 0],
        }}
        transition={{
          duration: 0.5, delay: delay + 0.3, type: 'spring', stiffness: 150,
          y: isFirst ? { duration: 2, repeat: Infinity, delay: 1.5, ease: 'easeInOut' } : undefined,
        }}
        className="text-xl"
      >
        {medalIcon}
      </motion.div>

      {/* Continuous pulsing glow under card — strongest for #1 */}
      {isFirst && (
        <motion.div
          className={cn(
            'absolute -bottom-6 w-3/4 h-6 rounded-full blur-2xl',
            'bg-amber-400/30 dark:bg-amber-500/20',
          )}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Floating card wrapper */}
      <motion.div
        animate={{ y: [0, -floatAmplitude, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay }}
        whileHover={{ y: hoverLift, scale: 1.08, transition: { duration: 0.3, ease: 'easeOut' } }}
        className="relative"
      >
        {/* Glow ring behind card */}
        <motion.div
          className={cn(
            'absolute -inset-4 rounded-3xl opacity-0 blur-xl bg-gradient-to-br',
            isFirst ? 'opacity-40' : 'opacity-0',
          )}
          animate={isFirst ? { scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] } : {}}
          transition={isFirst ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          whileHover={{ opacity: 0.7, scale: 1.15 }}
        />

        {/* Card */}
        <motion.div
          className={cn(
            'relative rounded-2xl p-5 border backdrop-blur-sm shadow-lg overflow-hidden',
            cardWidth,
            theme.border,
            theme.bg,
            theme.shadow,
          )}
          whileHover={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.3)', scale: 1.02 }}
        >
          {/* Shimmer sweep for #1 */}
          {isFirst && (
            <motion.div
              className="absolute inset-0 -z-5 pointer-events-none"
              aria-hidden
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 dark:via-amber-400/15 to-transparent skew-x-[-20deg]"
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </motion.div>
          )}

          {/* Animated border glow on hover */}
          <motion.div
            className={cn(
              'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 -z-10',
              theme.glow,
            )}
            whileHover={{ opacity: 0.3 }}
            transition={{ duration: 0.3 }}
          />

          {/* Rank badge */}
          <motion.div
            className={cn(
              'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full w-8 h-8 flex items-center justify-center border-2 font-bold text-xs shadow-md',
              theme.badge,
            )}
            whileHover={{ scale: 1.2, rotate: [0, -10, 10, -5, 0] }}
            transition={{ duration: 0.4 }}
          >
            {place}
          </motion.div>

          {/* Sparkle particles */}
          {sparkleCount > 0 && (
            <>
              {[...Array(sparkleCount)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-[8px] pointer-events-none"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.3, 0],
                    y: [0, -25 - Math.random() * 25],
                    x: [0, (Math.random() - 0.5) * 25],
                  }}
                  transition={{
                    duration: 1.5 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * (isFirst ? 2 : 3),
                  }}
                >
                  {isFirst ? (i % 2 === 0 ? '✦' : '✧') : '✦'}
                </motion.span>
              ))}
            </>
          )}

          {/* Avatar with subtle pulse for #1 */}
          <div className="mt-2 mb-3">
            <motion.div
              animate={isFirst ? { scale: [1, 1.04, 1] } : {}}
              transition={isFirst ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            >
              <Avatar className={cn(avatarSize, 'ring-2 ring-offset-2 ring-offset-background', theme.border.replace('border-', 'ring-'))}>
                <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold', theme.avatar)}>
                  {student.initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          {/* Name */}
          <p className={cn('font-bold text-sm text-center leading-tight truncate max-w-full', theme.text)}>
            {student.name}
          </p>

          {/* XP */}
          <motion.div
            className="flex items-center justify-center gap-1 mt-2"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className={cn('w-3.5 h-3.5', theme.text)} />
            <span className={cn('text-sm font-bold', theme.text)}>
              {formatXP(student.xp)}
            </span>
          </motion.div>

          {/* Badges */}
          <div className="flex items-center justify-center gap-1 mt-1">
            <Medal className={cn('w-3 h-3', theme.textMuted)} />
            <span className={cn('text-xs', theme.textMuted)}>{student.badges} badges</span>
          </div>

          {/* Streak — revealed on hover */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            whileHover={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-1 pt-1.5 mt-1.5 border-t border-border/50">
              <Flame className={cn('w-3 h-3', theme.text)} />
              <span className={cn('text-xs font-medium', theme.text)}>{student.streak} day streak</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Podium base with animated height and subtle glow pulse */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{
          scaleY: 1,
          opacity: isFirst ? [0.8, 1, 0.8] : 1,
        }}
        transition={{
          duration: 0.5, delay: delay + 0.4, ease: [0.34, 1.56, 0.64, 1],
          opacity: isFirst ? { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: delay + 1 } : undefined,
        }}
        className={cn(
          'w-full max-w-[140px] rounded-t-lg bg-gradient-to-t origin-bottom',
          isFirst ? 'h-16' : isSecond ? 'h-10' : 'h-7',
          theme.base,
        )}
      >
        <div className="flex items-center justify-center h-full">
          <span className={cn('text-[10px] font-bold tracking-wider opacity-80', theme.text)}>
            {formatXP(student.xp)} XP
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RankingsRow({
  student,
  index,
}: {
  student: LeaderboardStudent
  index: number
}) {
  const changeDisplay = getChangeDisplay(student.change)
  const ChangeIcon = changeDisplay.icon
  const isCurrentUser = student.isCurrentUser
  const isTop3 = student.rank <= 3

  const rankBadgeColors: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
    2: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300' },
    3: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-default',
        'hover:bg-accent/60 hover:shadow-sm',
        isCurrentUser && 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/40',
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 flex items-center justify-center">
        {isTop3 ? (
          <span className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border',
            rankBadgeColors[student.rank].bg,
            rankBadgeColors[student.rank].text,
          )}>
            {student.rank}
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground w-7 text-center">
            {student.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className={cn(
          'text-[11px] font-bold bg-gradient-to-br text-white',
          getInitialsBgColor(student.id),
        )}>
          {student.initials}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm font-medium truncate',
            isCurrentUser ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
          )}>
            {student.name}
          </p>
          {isCurrentUser && (
            <Badge className="h-4 px-1.5 text-[9px] font-bold bg-emerald-500 text-white border-0 shrink-0">
              YOU
            </Badge>
          )}
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center shrink-0 w-20 justify-end">
        {student.change !== 0 ? (
          <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none', changeDisplay.bg, changeDisplay.color)}>
            <ChangeIcon className="w-3 h-3" />
            <span>{Math.abs(student.change)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1 shrink-0 w-12 justify-end">
        <Flame className="w-3 h-3 text-amber-500" />
        <span className="text-xs text-muted-foreground font-medium">{student.streak}</span>
      </div>

      {/* Badges count */}
      <div className="flex items-center gap-1 shrink-0 w-14 justify-end">
        <Medal className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">{student.badges}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 shrink-0 w-24 justify-end">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {formatXP(student.xp)}
        </span>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function PeerLeaderboard() {
  const authUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<TimeTab>('alltime')
  const [data, setData] = useState<LeaderboardStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUser?.id) return
    const fetchData = () => {
      fetch(`/api/leaderboard?period=${activeTab}&current_user_id=${authUser.id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.students) setData(res.students)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    const onXpUpdate = () => fetchData()
    window.addEventListener('xp-updated', onXpUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('xp-updated', onXpUpdate)
    }
  }, [authUser?.id, activeTab])

  const currentUser = useMemo(
    () => data.find(s => s.isCurrentUser),
    [data],
  )
  const top3 = data.slice(0, 3)
  const remaining = data.slice(3)
  const totalPeers = data.length

  const tabLabels: Record<TimeTab, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    alltime: 'All Time',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data.length || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Users className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">No leaderboard data yet</p>
        <p className="text-sm text-muted-foreground/60">Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">npm run seed:leaderboard</code> to populate</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Peer Leaderboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compete with your peers and track your progress
          </p>
        </div>

        {/* Tab Filters */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TimeTab)}>
          <TabsList className="h-9">
            {(Object.keys(tabLabels) as TimeTab[]).map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs px-3">
                {tabLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Your Rank"
          value={`#${currentUser.rank}`}
          subtext={`of ${totalPeers} students`}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          delay={0.1}
        />
        <StatCard
          icon={Star}
          label="Total Points"
          value={`${formatXP(currentUser.xp)} XP`}
          subtext="Earned this period"
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          iconColor="text-amber-600 dark:text-amber-400"
          delay={0.2}
        />
        <StatCard
          icon={Users}
          label="Active Peers"
          value={totalPeers.toString()}
          subtext="Students competing"
          iconBg="bg-teal-100 dark:bg-teal-900/40"
          iconColor="text-teal-600 dark:text-teal-400"
          delay={0.3}
        />
      </div>

      {/* Podium Section */}
      {top3.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 md:p-7 shadow-lg"
        >
          {/* Decorative background blobs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-400/30">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold tracking-tight">Top Performers</h3>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hidden sm:block h-px flex-1 bg-gradient-to-r from-amber-300/50 to-transparent ml-2"
              />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex flex-col md:flex-row items-end justify-center gap-5 md:gap-8">
                  {top3[1] && <PodiumCard student={top3[1]} place={2} delay={0.1} />}
                  {top3[0] && <PodiumCard student={top3[0]} place={1} delay={0.25} />}
                  {top3[2] && <PodiumCard student={top3[2]} place={3} delay={0.15} />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Full Rankings Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold">Full Rankings</h3>
          <Badge variant="outline" className="text-[10px] font-medium">
            {totalPeers} students
          </Badge>
        </div>

        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20">
          <div className="w-8 shrink-0" />
          <div className="w-8 shrink-0" />
          <div className="flex-1">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Student</span>
          </div>
          <div className="w-20 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Change</span>
          </div>
          <div className="w-12 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Streak</span>
          </div>
          <div className="w-14 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Badges</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">XP</span>
          </div>
        </div>

        {/* Rankings list */}
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-2 space-y-1"
            >
              {remaining.map((student, index) => (
                <RankingsRow key={student.id} student={student} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: oklch(0.7 0.01 260);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: oklch(0.6 0.01 260);
        }
      `}</style>
    </div>
  )
}
