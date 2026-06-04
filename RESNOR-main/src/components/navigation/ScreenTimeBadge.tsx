'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export function ScreenTimeBadge() {
  const authUser = useAuthStore((s) => s.user)
  const [seconds, setSeconds] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUser?.id || authUser?.role === 'teacher') return
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
