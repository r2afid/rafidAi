'use client'

import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SidebarProvider, Sidebar, SidebarRail, useSidebar,
} from '@/components/ui/sidebar'
import {
  Search, Flame, GraduationCap,
} from 'lucide-react'
import { useSyncExternalStore, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchCommand from '@/components/SearchCommand'
import OnboardingTour from '@/components/OnboardingTour'
import AuthPage from '@/components/auth/AuthPage'
import { useTelemetry } from '@/hooks/useTelemetry'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { MobileTabBar } from '@/components/navigation/MobileTabBar'
import { QuickActionsFab } from '@/components/navigation/QuickActionsFab'
import { NotificationBell } from '@/components/navigation/NotificationBell'
import { ScreenTimeBadge } from '@/components/navigation/ScreenTimeBadge'
import { BreakReminderModal } from '@/components/navigation/BreakReminderModal'
import { pageComponents, pageLabels, teacherPageComponents } from '@/components/navigation/nav-config'



function SidebarToggle() {
  const { toggleSidebar, open } = useSidebar()
  return (
    <button
      onClick={toggleSidebar}
      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent/60 active:scale-90 transition-all duration-200 group"
      title="Toggle sidebar"
    >
      <div className="relative w-4 h-3.5">
        <motion.span
          className="absolute left-0 top-0 block h-[2px] w-full rounded-full bg-foreground/60 group-hover:bg-foreground/90 transition-colors duration-200"
          style={{ transformOrigin: 'center' }}
          animate={open
            ? { top: 6, rotate: 45 }
            : { top: 0, rotate: 0 }
          }
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute left-0 top-[6px] block h-[2px] w-full rounded-full bg-foreground/60 group-hover:bg-foreground/90 transition-colors duration-200"
          animate={open
            ? { opacity: 0, scaleX: 0 }
            : { opacity: 1, scaleX: 1 }
          }
          transition={{ duration: 0.2 }}
        />
        <motion.span
          className="absolute left-0 bottom-0 block h-[2px] w-full rounded-full bg-foreground/60 group-hover:bg-foreground/90 transition-colors duration-200"
          style={{ transformOrigin: 'center' }}
          animate={open
            ? { bottom: 6, rotate: -45 }
            : { bottom: 0, rotate: 0 }
          }
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </div>
    </button>
  )
}

export default function Home() {
  const { activePage, setActivePage, currentUser } = useAppStore()
  const { isAuthenticated, isLoading, hydrate } = useAuthStore()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const authUser = useAuthStore.getState().user
      if (authUser) {
        const store = useAppStore.getState()
        if (store.currentUser?.id !== authUser.id) {
          store.setCurrentUser({
            id: authUser.id,
            name: authUser.name || 'User',
            email: authUser.email,
            role: authUser.role,
            avatar: authUser.avatar,
          })
        }
      }
    }
  }, [isLoading, isAuthenticated])

  useTelemetry()

  if (!mounted || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
            <GraduationCap className="w-7 h-7 text-white" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-medium">Loading RESNOR...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  const isTeacher = currentUser?.role === 'teacher'
  const resolvedPage = isTeacher
    ? (activePage !== 'teacher' && activePage !== 'profile' && activePage !== 'notifications' && activePage !== 'course-manager' && activePage !== 'quiz-manager' ? 'teacher' : activePage)
    : (activePage === 'teacher' ? 'dashboard' : activePage)
  const ActiveComponent = isTeacher && resolvedPage === 'notifications'
    ? teacherPageComponents['notifications']
    : isTeacher && resolvedPage === 'profile'
      ? teacherPageComponents['profile']
      : pageComponents[resolvedPage]

  return (
    <SidebarProvider>
      <div className="flex-1 h-screen flex overflow-hidden bg-background">
        <Sidebar collapsible="offcanvas">
          <AppSidebar />
          <SidebarRail />
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center px-3 md:px-5 gap-2 shrink-0">
            <SidebarToggle />

            <motion.div
              key={resolvedPage}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <div className="hidden sm:flex items-center gap-2.5 min-w-0">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
                <h1 className="text-sm font-semibold text-foreground truncate">{pageLabels(isTeacher)[resolvedPage]}</h1>
              </div>
              <div className="flex sm:hidden items-center gap-2 min-w-0">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="text-sm font-semibold truncate">{pageLabels(isTeacher)[resolvedPage]}</h2>
              </div>
            </motion.div>

            <div className="flex items-center gap-1">
              {!isTeacher && <>
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  className="h-8 px-2.5 text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 rounded-lg text-xs gap-2 font-normal transition-all duration-200"
                  onClick={() => {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
                  }}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Search</span>
                  <kbd className="pointer-events-none hidden xl:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/50 bg-muted/30 px-1 font-mono text-[9px] font-medium text-muted-foreground/50">
                    ⌘K
                  </kbd>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
                }}
              >
                <Search className="w-4 h-4" />
              </Button>
              </>}

              <div className="w-px h-5 bg-border/40 mx-0.5 hidden sm:block" />

              <ScreenTimeBadge />
              <NotificationBell />
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={resolvedPage}
                  initial={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, scale: 0.97, filter: 'blur(3px)' }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={cn(
                    resolvedPage === 'tutor' ? 'h-[calc(100vh-56px)] overflow-hidden p-0' : 'h-full p-4 md:p-6 pb-20 md:pb-6',
                    'max-w-[1600px]'
                  )}
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>

        {!isTeacher && <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
          className="hidden md:block"
        >
          <QuickActionsFab />
        </motion.div>}

        {!isTeacher && <MobileTabBar />}
        {!isTeacher && <SearchCommand />}
        {!isTeacher && <OnboardingTour />}
        <BreakReminderModal />
      </div>
    </SidebarProvider>
  )
}
