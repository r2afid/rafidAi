'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { BarChart3 } from 'lucide-react'

interface ChartWrapperProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
}

export function ChartWrapper({
  title, subtitle, children, className, loading = false, empty = false, emptyMessage = 'No data available yet',
}: ChartWrapperProps) {
  return (
    <GlassCard className={cn('flex flex-col', className)} hover={false} glow="none" variant="liquid">
      {(title || subtitle) && (
        <div className="mb-4 flex flex-col gap-1">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="relative flex-1 min-h-0">
        {loading ? (
          <LoadingSkeleton type="chart" count={1} />
        ) : empty ? (
          <EmptyState icon={<BarChart3 className="h-10 w-10" />} title="No Chart Data" description={emptyMessage} />
        ) : (
          <div className="[&_.recharts-surface]:overflow-visible">{children}</div>
        )}
      </div>
    </GlassCard>
  )
}
