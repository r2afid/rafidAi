'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore, type PageKey } from '@/stores/app'
import { navItems, mobileTabKeys, mobileMoreKeys } from './nav-config'
import { Menu } from 'lucide-react'

export function MobileTabBar() {
  const { activePage, setActivePage } = useAppStore()
  const [moreOpen, setMoreOpen] = useState(false)

  const mainTabs = mobileTabKeys.slice(0, 4)
  const isMainTab = mainTabs.some((k) => k === activePage) || activePage === 'courses'

  const moreItems = mobileMoreKeys.map((key) => {
    const item = navItems.find((n) => n.key === key)
    return item ?? { key, label: key, icon: Menu, group: '' }
  })

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-card/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mainTabs.map((key) => {
            const item = navItems.find((n) => n.key === key)
            if (!item) return null
            const Icon = item.icon
            const isActive = activePage === key

            return (
              <button
                key={key}
                onClick={() => setActivePage(key)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-all duration-200',
                  'active:scale-95',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive && 'scale-110',
                  )} />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-all duration-200',
                  isActive && 'font-semibold',
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
          {/* Courses tab */}
          {(() => {
            const coursesItem = navItems.find((n) => n.key === 'courses')
            if (!coursesItem) return null
            const Icon = coursesItem.icon
            const isActive = activePage === 'courses'
            return (
              <button
                key="courses"
                onClick={() => setActivePage('courses')}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-all duration-200',
                  'active:scale-95',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-5 h-5 transition-all duration-200', isActive && 'scale-110')} />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn('text-[10px] font-medium transition-all duration-200', isActive && 'font-semibold')}>
                  Courses
                </span>
              </button>
            )
          })()}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-all duration-200 active:scale-95',
              !isMainTab && activePage !== 'courses' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
            )}
          >
            <div className="relative">
              <Menu className={cn('w-5 h-5 transition-all duration-200', !isMainTab && activePage !== 'courses' && 'scale-110')} />
              {!isMainTab && activePage !== 'courses' && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span className={cn('text-[10px] font-medium transition-all duration-200', !isMainTab && activePage !== 'courses' && 'font-semibold')}>
              More
            </span>
          </button>
        </div>

        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-[-1]"
                onClick={() => setMoreOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute bottom-full left-2 right-2 mb-2 bg-card border rounded-2xl shadow-xl p-2 grid grid-cols-4 gap-1 max-h-[280px] overflow-y-auto"
              >
                {moreItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activePage === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActivePage(item.key)
                        setMoreOpen(false)
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-colors active:scale-95',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                    </button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
