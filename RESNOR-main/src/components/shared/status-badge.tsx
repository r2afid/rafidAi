'use client'

import { cn } from '@/lib/utils'

type StatusVariant = 'improving' | 'stable' | 'declining' | 'active' | 'idle' | 'at-risk'
type BadgeSize = 'sm' | 'md'

interface StatusBadgeProps {
  status: StatusVariant
  size?: BadgeSize
  className?: string
}

const statusConfig: Record<StatusVariant, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  improving: { label: 'Improving', dotColor: 'bg-emerald-500', textColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  stable: { label: 'Stable', dotColor: 'bg-cyan-500', textColor: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  declining: { label: 'Declining', dotColor: 'bg-amber-400', textColor: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  active: { label: 'Active', dotColor: 'bg-emerald-500 animate-pulse', textColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  idle: { label: 'Idle', dotColor: 'bg-muted-foreground', textColor: 'text-muted-foreground', bgColor: 'bg-muted' },
  'at-risk': { label: 'At Risk', dotColor: 'bg-rose-400', textColor: 'text-rose-400', bgColor: 'bg-rose-400/10' },
}

const sizeConfig: Record<BadgeSize, { container: string; dot: string; text: string }> = {
  sm: { container: 'px-2 py-0.5 gap-1.5', dot: 'h-1.5 w-1.5', text: 'text-[11px]' },
  md: { container: 'px-2.5 py-1 gap-2', dot: 'h-2 w-2', text: 'text-xs' },
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', sizeStyles.container, config.bgColor, className)}>
      <span className={cn('shrink-0 rounded-full', sizeStyles.dot, config.dotColor)} aria-hidden="true" />
      <span className={cn(sizeStyles.text, config.textColor)}>{config.label}</span>
    </span>
  )
}
