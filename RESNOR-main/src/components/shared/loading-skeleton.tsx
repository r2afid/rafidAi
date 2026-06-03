'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type SkeletonType = 'card' | 'chart' | 'list' | 'text'

interface LoadingSkeletonProps {
  type: SkeletonType
  count?: number
  className?: string
}

export function LoadingSkeleton({ type, count = 1, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => <SkeletonPattern key={i} type={type} />)}
    </div>
  )
}

function SkeletonPattern({ type }: { type: SkeletonType }) {
  switch (type) {
    case 'card': return <CardSkeleton />
    case 'chart': return <ChartSkeleton />
    case 'list': return <ListSkeleton />
    case 'text': return <TextSkeleton />
    default: return null
  }
}

function CardSkeleton() {
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-[240px] w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-1 gap-3">
        <div className="flex flex-col justify-between py-1">
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-1 flex-col justify-between">
            <div className="h-px bg-border" />
            <div className="h-px bg-border" />
            <div className="h-px bg-border" />
          </div>
          <div className="flex items-end gap-2 h-3/4 -mt-4">
            {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 55, 90].map((height, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between px-11">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-2.5 w-8" />)}
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-2.5 w-2/5" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  )
}
