'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, Lightbulb, CheckCircle2, Zap, RefreshCw, BarChart2, ShieldAlert, Info, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/auth'
import {
  Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const colorPalette = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6']

const factorDescriptions: Record<string, string> = {
  'Study Hours': 'Total hours spent studying this week. More hours = higher cognitive load and burnout risk.',
  'Mood': 'Your average mood score this week (1-10). Lower scores indicate stress and exhaustion.',
  'Low Mood Days': 'Number of days your mood was 4 or below out of the last 7. Frequent low moods signal burnout.',
  'Late Nights': 'Percentage of focus sessions that started before 6 AM. Late-night study disrupts recovery sleep.',
  'Workload Balance': 'How evenly your study load is spread across the week. Cramming spikes increase burnout risk.',
}

export default function BurnoutPredictor() {
  const user = useAuthStore((s) => s.user)
  const [riskLevel, setRiskLevel] = useState('low')
  const [factors, setFactors] = useState<{ name: string; impact: number }[]>([])
  const [trend, setTrend] = useState<{ week: string; risk: number }[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [crammingAlert, setCrammingAlert] = useState(false)
  const [crammingMessage, setCrammingMessage] = useState('')
  const [stressPercentage, setStressPercentage] = useState(30)
  const [stressMessage, setStressMessage] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)
  const [showSyncMessage, setShowSyncMessage] = useState(false)
  const [lastSyncedEnergy, setLastSyncedEnergy] = useState<number>(3)
  const [selectedEnergy, setSelectedEnergy] = useState<number>(3)
  const [selectedStress, setSelectedStress] = useState<number>(3)
  const [syncedToday, setSyncedToday] = useState<{ energy: number; timestamp: number } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('burnout-energy-sync')
      if (stored) {
        const parsed = JSON.parse(stored)
        const elapsed = Date.now() - parsed.timestamp
        if (elapsed < 86400000) {
          setSyncedToday(parsed)
        } else {
          localStorage.removeItem('burnout-energy-sync')
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/wellbeing/burnout?student_id=${user?.id || 'stu_001'}`)
      if (res.ok) {
        const data = await res.json()
        if (data.riskLevel) setRiskLevel(data.riskLevel)
        if (data.factors) setFactors(data.factors)
        if (data.trend) setTrend(data.trend)
        if (data.recommendations) setRecommendations(data.recommendations)
        if (data.crammingAlert !== undefined) setCrammingAlert(data.crammingAlert)
        if (data.crammingMessage) setCrammingMessage(data.crammingMessage)
        if (data.stressPercentage !== undefined) setStressPercentage(data.stressPercentage)
        if (data.knnPrediction?.stressMessage) setStressMessage(data.knnPrediction.stressMessage)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  const handleSyncEnergy = async () => {
    setSubmittingCheckIn(true)
    try {
      const mappedRating = 6 - selectedEnergy
      const res = await fetch('/api/wellbeing/burnout/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || 'stu_001',
          rating: mappedRating,
          stress_rating: selectedStress,
        }),
      })

      if (res.ok) {
        const syncData = { energy: selectedEnergy, timestamp: Date.now() }
        setLastSyncedEnergy(selectedEnergy)
        setSyncedToday(syncData)
        setShowSyncMessage(true)
        localStorage.setItem('burnout-energy-sync', JSON.stringify(syncData))
        setTimeout(() => setShowSyncMessage(false), 5000)
        await fetchData()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  const syncMessages: Record<number, { title: string; desc: string }> = {
    1: { title: 'We hear you — you\'re feeling drained.', desc: 'Noted. Your low energy helps us detect burnout patterns and recommend rest when you need it most.' },
    2: { title: 'You\'re running low — we\'re tracking it.', desc: 'This tells us you might need a break soon. Over time, we\'ll learn the warning signs before you hit empty.' },
    3: { title: 'Balanced — we\'ve logged it.', desc: 'Your steady energy helps us build a baseline. The more you check in, the better we can spot when something\'s off.' },
    4: { title: 'You\'re feeling good — we see it.', desc: 'High energy logged. This helps us understand what a healthy week looks like for you, so we can warn you when things shift.' },
    5: { title: 'Peak energy — awesome!', desc: 'We\'ve recorded your high. Tracking these ups and downs teaches us to recognize your personal burnout triggers early.' },
  }

  const energyOptions = [
    { value: 1, emoji: '🪫', label: 'Drained', desc: 'Completely worn out' },
    { value: 2, emoji: '🔌', label: 'Low', desc: 'Need a break soon' },
    { value: 3, emoji: '🔋', label: 'Balanced', desc: 'Feeling okay' },
    { value: 4, emoji: '⚡', label: 'Energized', desc: 'Pretty good' },
    { value: 5, emoji: '🚀', label: 'Peak', desc: 'Fully refreshed' },
  ]

  const stressOptions = [
    { value: 1, emoji: '🧘', label: 'Calm', desc: 'Totally at ease' },
    { value: 2, emoji: '😰', label: 'Mild', desc: 'Slightly tense' },
    { value: 3, emoji: '😟', label: 'Moderate', desc: 'Noticeably stressed' },
    { value: 4, emoji: '😫', label: 'High', desc: 'Very stressed' },
    { value: 5, emoji: '🤯', label: 'Overwhelmed', desc: 'Cannot cope' },
  ]

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading burnout analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Burnout Status</h1>
          <p className="text-sm text-muted-foreground">AI analysis of your current energy and cognitive load</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} className="h-9 w-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Burnout Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
          riskLevel === 'low'
            ? 'border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/5'
            : 'border-red-500/30 bg-red-500/10 shadow-red-500/5'
        }`}
      >
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${riskLevel === 'low' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
        <div className="space-y-0.5">
          <h4 className={`text-sm font-semibold ${riskLevel === 'low' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            AI Analysis: {riskLevel === 'low' ? 'You\'re not burnt out' : riskLevel === 'moderate' ? 'Early burnout signs detected' : 'You are experiencing burnout'}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {riskLevel === 'low'
              ? 'Your current patterns match your healthy weeks. Keep it up.'
              : riskLevel === 'moderate'
                ? 'Your study and mood patterns suggest you may be heading toward burnout. Consider resting.'
                : 'Your metrics show critical exhaustion levels. Prioritize rest and recovery.'}
          </p>
        </div>
      </motion.div>

      {/* Stress Level Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
          stressPercentage < 30
            ? 'border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/5'
            : stressPercentage < 50
              ? 'border-amber-500/30 bg-amber-500/10 shadow-amber-500/5'
              : 'border-rose-500/30 bg-rose-500/10 shadow-rose-500/5'
        }`}
      >
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          stressPercentage < 30 ? 'bg-emerald-500' : stressPercentage < 50 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
        }`} />
        <div className="space-y-0.5">
          <h4 className={`text-sm font-semibold ${
            stressPercentage < 30 ? 'text-emerald-600 dark:text-emerald-400' : stressPercentage < 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            AI Analysis: {stressPercentage < 30 ? 'You seem calm' : stressPercentage < 50 ? 'Mild stress detected' : 'High stress detected'}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {stressMessage || (stressPercentage < 30
              ? 'Your patterns match calm, low-stress periods.'
              : stressPercentage < 50
                ? 'Your patterns show moderate stress levels.'
                : 'Your patterns indicate high stress — prioritize relaxation.')}
          </p>
        </div>
      </motion.div>

      {/* Sync Confirmation Banner */}
      <AnimatePresence>
        {showSyncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3 shadow-lg shadow-emerald-500/5"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{syncMessages[lastSyncedEnergy].title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{syncMessages[lastSyncedEnergy].desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Energy Sync */}
      {syncedToday ? (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold">Already logged today</h3>
              <p className="text-xs text-muted-foreground">
                You said: {energyOptions[syncedToday.energy - 1].label} {energyOptions[syncedToday.energy - 1].emoji}
                &nbsp;&mdash; come back tomorrow for another check-in.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Energy Sync</h3>
            <p className="text-sm text-muted-foreground">
              Rate your actual mental capacity right now. RESNOR merges this subjective feeling with telemetry hours to build your personalized prediction model.
            </p>
          </div>

          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['1','2','3','4','5'].map((val) => (
                <button
                  key={val}
                  onClick={() => setSelectedEnergy(Number(val))}
                  className={`p-2 rounded-lg text-center text-sm font-medium transition-all ${
                    selectedEnergy === Number(val)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 border-2'
                      : 'bg-muted border border-transparent text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <div className="px-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={selectedEnergy}
                onChange={(e) => setSelectedEnergy(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
                <span>Drained 🪫</span>
                <span>Low 🔌</span>
                <span>Balanced 🔋</span>
                <span>Energized ⚡</span>
                <span>Peak 🚀</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Current Stress Level</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['1','2','3','4','5'].map((val) => (
                <button
                  key={val}
                  onClick={() => setSelectedStress(Number(val))}
                  className={`p-2 rounded-lg text-center text-sm font-medium transition-all ${
                    selectedStress === Number(val)
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400 border-2'
                      : 'bg-muted border border-transparent text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="px-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={selectedStress}
                onChange={(e) => setSelectedStress(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
                <span>Calm 🧘</span>
                <span>Mild 😰</span>
                <span>Moderate 😟</span>
                <span>High 😫</span>
                <span>Overwhelmed 🤯</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Once per day. Every check-in trains the model to spot burnout early.
            </div>
            
            <Button
              onClick={handleSyncEnergy}
              disabled={submittingCheckIn}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md shadow-emerald-500/10 whitespace-nowrap"
            >
              {submittingCheckIn ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Log My Energy
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Contributing Factors & Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              Your Real-Time Habit Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TooltipProvider>
            {factors.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No factor data available yet.</p>
            )}
            {factors.map((factor, i) => {
              const key = Object.keys(factorDescriptions).find(k => factor.name.startsWith(k)) || ''
              return (
                <Tooltip key={factor.name}>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-help">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{factor.name}</span>
                        <Info className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: colorPalette[i % colorPalette.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(factor.impact * 2, 100)}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                    <p>{factorDescriptions[key] || 'This metric contributes to your burnout risk.'}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Exhaustion History & Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="burnoutGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="oklch(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="oklch(var(--muted-foreground))" />
                  <ReTooltip />
                  <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#burnoutGrad)" name="Burnout Risk" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Not enough data yet. Check back after a few analyses.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recovery Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-500" />
              AI Recovery Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{rec}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
