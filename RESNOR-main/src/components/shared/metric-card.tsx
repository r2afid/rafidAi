'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'

type MetricColor = 'emerald' | 'cyan' | 'amber' | 'rose'

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: ReactNode
  color?: MetricColor
  className?: string
}

const colorMap: Record<MetricColor, { value: string; icon: string; bg: string }> = {
  emerald: { value: 'text-emerald-500', icon: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  cyan: { value: 'text-cyan-500', icon: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  amber: { value: 'text-amber-400', icon: 'text-amber-400', bg: 'bg-amber-400/10' },
  rose: { value: 'text-rose-400', icon: 'text-rose-400', bg: 'bg-rose-400/10' },
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  color = 'emerald',
  className,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0
  const isNegative = change !== undefined && change < 0
  const colors = colorMap[color]

  return (
    <GlassCard
      hover
      glow={color === 'emerald' || color === 'cyan' ? color : 'none'}
      variant="liquid"
      className={cn('relative overflow-hidden group', className)}
    >
      <motion.div
        className={cn(
          'absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-15 blur-2xl',
          color === 'emerald' && 'bg-emerald-500',
          color === 'cyan' && 'bg-cyan-500',
          color === 'amber' && 'bg-amber-400',
          color === 'rose' && 'bg-rose-400'
        )}
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.22, 0.15] }}
        transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      />

      <div className="relative flex items-start justify-between p-4 md:p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>

          <AnimatePresence mode="popLayout">
            <motion.div
              key={String(value)}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn('text-2xl md:text-3xl font-bold tracking-tight', colors.value)}
            >
              {value}
            </motion.div>
          </AnimatePresence>

          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  isPositive && 'bg-emerald-500/15 text-emerald-500',
                  isNegative && 'bg-rose-400/15 text-rose-400'
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? '+' : ''}{change}%
              </motion.div>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>

        {icon && (
          <motion.div
            className={cn('flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg', colors.bg)}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <span className={colors.icon}>{icon}</span>
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}
