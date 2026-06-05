'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import QuizGenerator from './QuizGenerator'
import TeacherQuizTaker from './TeacherQuizTaker'
import { cn } from '@/lib/utils'
import { Brain, GraduationCap } from 'lucide-react'

export default function QuizPage() {
  const [tab, setTab] = useState('ai')
  return (
    <div className="w-full">
      <div className="relative flex items-center bg-white/[0.01] dark:bg-card/10 backdrop-blur-sm border border-slate-200/50 dark:border-border/50 p-1 mx-4 mb-4 rounded-xl w-fit shadow-none">
        <button
          onClick={() => setTab('ai')}
          className={cn(
            'relative z-10 flex items-center justify-center gap-1.5 px-5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200',
            tab === 'ai' ? 'text-emerald-600 dark:text-white' : 'text-slate-400 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground'
          )}
        >
          {tab === 'ai' && (
            <motion.div
              layoutId="activeQuizTabPill"
               className="absolute inset-0 bg-white dark:bg-card/30 border border-slate-200/80 dark:border-border rounded-lg shadow-md shadow-slate-200/50 dark:shadow-black/40 z-0 backdrop-blur-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Brain className="size-4" />
            AI Quiz Generator
          </span>
        </button>
        <button
          onClick={() => setTab('teacher')}
          className={cn(
            'relative z-10 flex items-center justify-center gap-1.5 px-5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200',
            tab === 'teacher' ? 'text-emerald-600 dark:text-white' : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {tab === 'teacher' && (
            <motion.div
              layoutId="activeQuizTabPill"
               className="absolute inset-0 bg-white dark:bg-card/30 border border-slate-200/80 dark:border-border rounded-lg shadow-md shadow-slate-200/50 dark:shadow-black/40 z-0 backdrop-blur-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <GraduationCap className="size-4" />
            Teacher Quizzes
          </span>
        </button>
      </div>
      {tab === 'ai' && <QuizGenerator />}
      {tab === 'teacher' && <TeacherQuizTaker />}
    </div>
  )
}
