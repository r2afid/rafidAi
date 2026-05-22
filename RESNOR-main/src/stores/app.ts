import { create } from 'zustand'

export type PageKey = 
  | 'dashboard' 
  | 'tutor' 
  | 'quiz' 
  | 'cgpa' 
  | 'digital-twin' 
  | 'explain-mistake' 
  | 'engagement' 
  | 'gamification' 
  | 'notifications' 
  | 'teacher' 
  | 'wellbeing'
  | 'pomodoro'
  | 'leaderboard'
  | 'notes'
  | 'planner'
  | 'courses'
  | 'resources'
  | 'profile'
  | 'forum'
  | 'grades'

interface AppState {
  activePage: PageKey
  setActivePage: (page: PageKey) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  currentUser: {
    id: string
    name: string
    email: string
    role: 'student' | 'teacher'
    avatar?: string
    studentId?: string | null
  } | null
  setCurrentUser: (user: AppState['currentUser']) => void
  breakReminder: { show: boolean; autoStartLongBreak: boolean }
  triggerBreakReminder: () => void
  dismissBreakReminder: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  breakReminder: { show: false, autoStartLongBreak: false },
  triggerBreakReminder: () => set({ breakReminder: { show: true, autoStartLongBreak: true } }),
  dismissBreakReminder: () => set({ breakReminder: { show: false, autoStartLongBreak: false } }),
}))
