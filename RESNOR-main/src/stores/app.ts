import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PageKey = 
  | 'dashboard' 
  | 'tutor' 
  | 'quiz' 
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
  | 'exam-routine'
  | 'peer-comparison'
  | 'death-week-planner'

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
  preselectedQuizTopic: string | null
  setPreselectedQuizTopic: (topic: string | null) => void
  preselectedQuizTopicTitle: string | null
  setPreselectedQuizTopicTitle: (title: string | null) => void
  preselectedQuizTitle: string | null
  setPreselectedQuizTitle: (title: string | null) => void
  reviewAttemptData: {
    id: string
    label: string
    date: string
    score: number
    totalQuestions: number
    questions: Array<{
      id: number
      text: string
      options: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      mistakeType?: string
    }>
  } | null
  setReviewAttemptData: (data: AppState['reviewAttemptData']) => void
  pendingTutorContext: string | null
  setPendingTutorContext: (ctx: string | null) => void
  pendingNoteData: { title: string; content: string } | null
  setPendingNoteData: (data: { title: string; content: string } | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      preselectedQuizTopic: null,
      setPreselectedQuizTopic: (topic) => set({ preselectedQuizTopic: topic }),
      preselectedQuizTopicTitle: null,
      setPreselectedQuizTopicTitle: (title) => set({ preselectedQuizTopicTitle: title }),
      preselectedQuizTitle: null,
      setPreselectedQuizTitle: (title) => set({ preselectedQuizTitle: title }),
      reviewAttemptData: null,
      setReviewAttemptData: (data) => set({ reviewAttemptData: data }),
      pendingTutorContext: null,
      setPendingTutorContext: (ctx) => set({ pendingTutorContext: ctx }),
      pendingNoteData: null,
      setPendingNoteData: (data) => set({ pendingNoteData: data }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        activePage: state.activePage,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
