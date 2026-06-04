'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, Bot, CalendarDays, Library, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore, type PageKey } from '@/stores/app'

export function QuickActionsFab() {
  const [open, setOpen] = useState(false)
  const { setActivePage } = useAppStore()

  const actions = [
    { label: 'Start Quiz', icon: Brain, color: 'text-emerald-500', page: 'quiz' as PageKey },
    { label: 'Ask AI Tutor', icon: Bot, color: 'text-teal-500', page: 'tutor' as PageKey },
    { label: 'Study Planner', icon: CalendarDays, color: 'text-amber-500', page: 'planner' as PageKey },
    { label: 'Courses', icon: Library, color: 'text-rose-500', page: 'courses' as PageKey },
    { label: 'View Progress', icon: Activity, color: 'text-teal-600', page: 'dashboard' as PageKey },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
                >
                  <Button
                    onClick={() => {
                      setActivePage(action.page)
                      setOpen(false)
                    }}
                    className={cn(
                      'shadow-lg shadow-black/10 dark:shadow-black/30',
                      'bg-card border border-border/50 hover:bg-accent',
                      'gap-2.5 pl-4 pr-5 h-11 rounded-full',
                      'transition-all duration-200 hover:scale-105',
                    )}
                  >
                    <Icon className={cn('w-4 h-4', action.color)} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </motion.div>
              )
            })}
          </>
        )}
      </AnimatePresence>

      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className={cn(
            'w-14 h-14 rounded-full shadow-xl shadow-emerald-500/25',
            'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
            'text-white transition-all duration-300',
            open && 'rotate-45',
          )}
        >
          <Zap className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  )
}
