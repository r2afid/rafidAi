'use client'

import { type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type GlowVariant = 'emerald' | 'cyan' | 'none'

type GlassVariant = 'default' | 'liquid' | 'translucent'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: GlowVariant
  variant?: GlassVariant
  shimmer?: boolean
  breathing?: boolean
  flowingBorder?: boolean
}

const variantStyles: Record<GlassVariant, string> = {
  default: 'bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl shadow-sm',
  liquid: 'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-xl shadow-sm',
  translucent: 'bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl shadow-sm',
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = 'none',
  variant = 'default',
  shimmer = false,
  breathing = false,
  flowingBorder = false,
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        variantStyles[variant],
        hover && 'transition-all duration-300 hover:shadow-md hover:bg-card/80',
        glow === 'emerald' && 'shadow-emerald-500/10',
        glow === 'cyan' && 'shadow-cyan-500/10',
        shimmer && 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-[shimmer_3s_ease-in-out_infinite]',
        className
      )}
      {...motionProps}
    >
      {breathing && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 animate-pulse" />
      )}
      {flowingBorder && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 animate-pulse" />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  )
}
