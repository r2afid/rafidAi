'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app'

export function BreakReminderModal() {
  const { breakReminder, dismissBreakReminder, setActivePage } = useAppStore()

  if (!breakReminder.show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              <Timer className="w-7 h-7 text-amber-500" />
            </motion.div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Time for a break!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your brain has been focused for a while — it deserves a rest. Step away for <strong>15 minutes</strong> to recharge and come back sharper.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={dismissBreakReminder}>
              Dismiss
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                dismissBreakReminder()
                setActivePage('pomodoro')
              }}
            >
              Take a Break
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
