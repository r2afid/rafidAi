'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
  type TooltipProps,
  type ValueType,
  type NameType,
} from 'recharts'
import {
  Heart, Brain, Activity, Flame, Moon, Sun,
  TrendingUp, TrendingDown, AlertTriangle, Shield,
  Sparkles, BookOpen, Clock, Zap, MessageCircle, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const defaultStressFactors = [
  { name: 'Study Hours', value: 0, color: '#8b5cf6' },
  { name: 'Quiz Pressure', value: 0, color: '#f59e0b' },
  { name: 'Sleep Disruption', value: 0, color: '#06b6d4' },
  { name: 'Low Mood', value: 0, color: '#ef4444' },
  { name: 'Workload Spike', value: 0, color: '#10b981' },
]

interface WellbeingDashboardProps {
  onEmergency: () => void
}

const ChartTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
      <p className="text-slate-100 text-xs font-semibold mb-2 pb-2 border-b border-slate-700/50">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-6 text-xs">
            <span className="text-slate-400">{entry.name}</span>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WellbeingDashboard({ onEmergency }: WellbeingDashboardProps) {
  const user = useAuthStore((s) => s.user)
  const [wellbeingScore, setWellbeingScore] = useState(72)
  const [stressScore, setStressScore] = useState(45)
  const [burnoutRisk, setBurnoutRisk] = useState(28)
  const [consistencyScore, setConsistencyScore] = useState(68)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [knnMessage, setKnnMessage] = useState('')
  const [knnStressMessage, setKnnStressMessage] = useState('')
  const [knnBurnoutRisk, setKnnBurnoutRisk] = useState(0)
  const [knnStressScore, setKnnStressScore] = useState(0)
  const [moodTrend, setMoodTrend] = useState<{ day: string; mood: number; stress: number; energy: number }[]>([])
  const [productivityTrend, setProductivityTrend] = useState<{ week: string; focus: number; study: number; break: number }[]>([])
  const [stressFactors, setStressFactors] = useState<{ name: string; value: number; color: string }[]>(defaultStressFactors)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = Date.now()
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/wellbeing/analysis?student_id=${user?.id || 'stu_001'}`)
        if (res.ok) {
          const data = await res.json()
          if (data.wellbeingScore !== undefined) setWellbeingScore(data.wellbeingScore)
          if (data.stressScore !== undefined) setStressScore(data.stressScore)
          if (data.burnoutRisk !== undefined) setBurnoutRisk(data.burnoutRisk)
          if (data.consistencyScore !== undefined) setConsistencyScore(data.consistencyScore)
          if (data.aiInsight) setAiInsight(data.aiInsight)
          if (data.knnMessage) setKnnMessage(data.knnMessage)
          if (data.knnStressMessage) setKnnStressMessage(data.knnStressMessage)
          if (data.knnBurnoutRisk !== undefined) setKnnBurnoutRisk(data.knnBurnoutRisk)
          if (data.knnStressScore !== undefined) setKnnStressScore(data.knnStressScore)
          if (data.moodTrend) setMoodTrend(data.moodTrend)
          if (data.productivityTrend) setProductivityTrend(data.productivityTrend)
          if (data.stressFactors) setStressFactors(data.stressFactors)
        }
      } catch {} finally {
        const elapsed = Date.now() - start
        const remaining = Math.max(0, 3000 - elapsed)
        setTimeout(() => setLoading(false), remaining)
      }
    }
    fetchData()
  }, [user?.id])

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/20'
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-rose-500/10 border-rose-500/20'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  const AnalysisCard = ({ title, message, risk, icon: Icon, tooltip = '' }: { title: string; message: string; risk: number; icon: React.ElementType; tooltip?: string }) => {
    const isHigh = risk >= 50
    const isModerate = risk >= 30
    const colorClass = isHigh ? 'text-rose-500' : isModerate ? 'text-amber-500' : 'text-emerald-500'
    const bgClass = isHigh ? 'bg-rose-500/10 border-rose-500/20' : isModerate ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
    const label = isHigh ? 'High' : isModerate ? 'Moderate' : 'Low'
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-card p-5 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgClass}`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`${colorClass} border-current/20`}>
              {label}
            </Badge>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {message || 'Not enough data yet.'}
          </p>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${risk}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${isHigh ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'}`}
          />
        </div>
      </motion.div>
    )
  }

  const ScoreCard = ({ title, score, icon: Icon, suffix = '%', tooltip = '' }: { title: string; score: number; icon: React.ElementType; suffix?: string; tooltip?: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border bg-card p-5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${getScoreBg(score)}`}>
          <Icon className={`w-5 h-5 ${getScoreColor(score)}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`${getScoreColor(score)} border-current/20`}>
            {getScoreLabel(score)}
          </Badge>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-end gap-1">
          <span className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>{score}</span>
          <span className="text-sm text-muted-foreground mb-1">{suffix}</span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
        />
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wellbeing Overview</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEmergency}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Need Help?
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Wellbeing Score"
          score={wellbeingScore}
          icon={Heart}
          tooltip="Measures your overall wellbeing using engagement, average mood, login streak, quiz scores, focus session completion, burnout level, low-mood recovery, mood trends, journal entries, and page diversity. Higher is better."
        />
        <AnalysisCard
          title="Burnout Analysis"
          message={knnMessage}
          risk={knnBurnoutRisk}
          icon={Flame}
          tooltip="Compares your current 24h study pattern (hours, mood, late nights, quiz scores) against past check-ins using KNN. Higher means your pattern matches days when you reported feeling burnt out."
        />
        <AnalysisCard
          title="Stress Analysis"
          message={knnStressMessage}
          risk={knnStressScore}
          icon={Activity}
          tooltip="Same KNN model as burnout, using your self-reported stress level (1-5 calm to overwhelmed) instead of energy. Higher means your pattern matches days you reported high stress."
        />
        <ScoreCard
          title="Consistency"
          score={consistencyScore}
          icon={Brain}
          tooltip="Measures how regularly you use the platform based on your current login streak. Longer streaks mean more consistent engagement."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Mood & Energy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={moodTrend.length > 0 ? moodTrend : [{ day: 'No data', mood: 0, stress: 0, energy: 0 }]} margin={{ top: 5, right: 15, bottom: 5, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(51 65 85 / 0.6)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                <ReTooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(148 163 184 / 0.3)', strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Mood" />
                <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Stress" />
                <Line type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mood</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Stress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Energy</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Stress Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stressFactors.length > 0 ? stressFactors : defaultStressFactors}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(stressFactors.length > 0 ? stressFactors : defaultStressFactors).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {(stressFactors.length > 0 ? stressFactors : defaultStressFactors).map((f) => (
                <div key={f.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Weekly Productivity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productivityTrend.length > 0 ? productivityTrend : [{ week: 'No data', focus: 0, study: 0, break: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(51 65 85 / 0.6)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
              <ReTooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(148 163 184 / 0.08)' }} />
              <Bar dataKey="focus" fill="#10b981" radius={[4, 4, 0, 0]} name="Focus Score" />
              <Bar dataKey="study" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Study Efficiency" />
              <Bar dataKey="break" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Break Quality" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-5"
        >
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">AI Wellbeing Insight</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{aiInsight}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
                <span className="text-[10px] text-muted-foreground">Based on your real-time data</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
