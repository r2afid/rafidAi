'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import {
  Brain,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Difficulty = 'easy' | 'medium' | 'hard'
type Step = 'list' | 'active' | 'results' | 'review'

interface TeacherQuiz {
  id: string
  title: string
  topic: string
  difficulty: Difficulty
  questionCount: number
  timeLimit: number
  maxAttempts: number
  attemptCount: number
  myAttempt?: {
    score: number
    totalQuestions: number
    correctCount: number
  }
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctKey: string
  explanation: string
}

interface QuizData {
  quiz: TeacherQuiz
  questions: QuizQuestion[]
}

interface SubmitResponse {
  score: number
  correctCount: number
  totalQuestions: number
  attemptId: string
}

const difficultyColor: Record<Difficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function TeacherQuizTaker() {
  const studentId = useAuthStore((s: any) => s.user?.id)
  const studentName = useAuthStore((s: any) => s.user?.name)

  const [step, setStep] = useState<Step>('list')
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [explainingIds, setExplainingIds] = useState<Record<string, boolean>>({})
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)

  const fetchQuizzes = useCallback(async () => {
    if (!studentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/teacher?student_id=${studentId}`)
      if (res.ok) {
        const data = await res.json()
        const mapped = (data.quizzes || []).map((q: any) => ({
          id: q.id,
          title: q.title,
          topic: q.topic?.name || 'General',
          difficulty: q.difficulty || 'medium',
          questionCount: q.questions?.length || 0,
          timeLimit: q.timeLimit || 600,
          maxAttempts: q.maxAttempts ?? 3,
          attemptCount: q._count?.attempts ?? 0,
          myAttempt: q.myAttempt || null,
        }))
        setQuizzes(mapped)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startQuiz = async (quizId: string) => {
    const found = quizzes.find(q => q.id === quizId)
    if (!found) return
    try {
      const res = await fetch(`/api/quizzes/teacher?student_id=${studentId}`)
      if (!res.ok) return
      const data = await res.json()
      const full = data.quizzes?.find((q: any) => q.id === quizId)
      if (!full) return

      const questions: QuizQuestion[] = (full.questions || []).map((qu: any) => ({
        id: qu.id,
        question: qu.question,
        options: [qu.optionA, qu.optionB, qu.optionC, qu.optionD].filter(Boolean),
        correctKey: qu.correctKey,
        explanation: qu.explanation || '',
      }))

      setQuizData({ quiz: found, questions })
      setCurrentIndex(0)
      setSelectedKeys({})
      setResult(null)
      setTimeLeft(found.timeLimit * 60)
      startTimeRef.current = Date.now()
      setStep('active')

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      /* ignore */
    }
  }

  const handleSelect = (key: string) => {
    if (!quizData) return
    const q = quizData.questions[currentIndex]
    setSelectedKeys((prev) => ({ ...prev, [q.id]: key }))
  }

  const handleNext = () => {
    if (!quizData) return
    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleSubmit = async () => {
    if (!quizData || !studentId || submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData.quiz.id,
          studentId,
          answers: selectedKeys,
          timeSpent,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult({
          score: data.score,
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          attemptId: data.attempt?.id || '',
        })
        setStep('results')
        fetchQuizzes()
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false)
    }
  }

  const handleExplainMistake = async (questionId: string) => {
    if (aiExplanations[questionId] || !result?.attemptId) return
    setExplainingIds(prev => ({ ...prev, [questionId]: true }))
    try {
      const res = await fetch(`/api/quiz/explain-mistake?attempt_id=${result.attemptId}&question_id=${questionId}`)
      if (res.ok) {
        const data = await res.json()
        const explanation = data.explanations?.find((e: any) => e.questionId === questionId)
        if (explanation) {
          const lines: string[] = []
          if (explanation.mistakeSummary) lines.push(`• ${explanation.mistakeSummary}`)
          if (explanation.rootCauseAnalysis) lines.push(`• ${explanation.rootCauseAnalysis}`)
          if (explanation.correctConceptExplanation) lines.push(`• ${explanation.correctConceptExplanation}`)
          if (explanation.simplifiedAnalogy) lines.push(`• ${explanation.simplifiedAnalogy}`)
          if (explanation.stepByStepCorrection) lines.push(`• ${explanation.stepByStepCorrection}`)
          if (explanation.preventionTips) lines.push(`• ${explanation.preventionTips}`)
          setAiExplanations(prev => ({ ...prev, [questionId]: lines.join('\n') }))
        }
      }
    } catch {}
    setExplainingIds(prev => ({ ...prev, [questionId]: false }))
  }

  const handleBackToList = () => {
    setStep('list')
    setQuizData(null)
    setCurrentIndex(0)
    setSelectedKeys({})
    setResult(null)
    setTimeLeft(0)
  }

  if (!studentId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Brain className="size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Please sign in to view and take teacher-created quizzes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── List View ──────────────────────────────────────────────────────────────

  if (step === 'list') {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Brain className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Teacher Quizzes</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and take quizzes created by your teachers
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
            <Brain className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No teacher quizzes available yet.</p>
          </div>
        ) : (
          <div className="w-full max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
            {quizzes.map((quiz) => {
              const attemptsLeft = quiz.maxAttempts - quiz.attemptCount
              const attemptsExhausted = attemptsLeft <= 0
              return (
              <button
                key={quiz.id}
                onClick={() => !attemptsExhausted && startQuiz(quiz.id)}
                disabled={attemptsExhausted}
                className={cn(
                  'bg-white dark:bg-card/10 border border-slate-200/60 dark:border-border/50 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm dark:shadow-none text-left',
                  attemptsExhausted && 'opacity-40 pointer-events-none'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {quiz.title}
                    </h3>
                    <span className="text-xs text-muted-foreground mt-0.5 block truncate">
                      {quiz.topic}
                    </span>
                  </div>
                  {attemptsExhausted ? (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-500 px-2.5 py-1 text-[11px] font-medium border border-rose-500/20">
                      <XCircle className="size-3" />
                      Locked
                    </span>
                  ) : quiz.myAttempt ? (
                    <span className={cn(
                      'shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border',
                      quiz.myAttempt.score >= 70
                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    )}>
                      {quiz.myAttempt.score >= 70 ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <AlertTriangle className="size-3" />
                      )}
                      {quiz.myAttempt.score}%
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-medium border border-emerald-500/20">
                      <CheckCircle2 className="size-3" />
                      Available
                    </span>
                  )}
                </div>

                {/* Metadata Footer */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-5 pt-4 border-t border-slate-200/60 dark:border-border/50">
                  <span className="flex items-center gap-1.5">
                    <Brain className="size-3.5" />
                    {quiz.questionCount} Questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {quiz.timeLimit} min
                  </span>
                  {!attemptsExhausted && !quiz.myAttempt && (
                    <span className="ml-auto flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
                      Start
                      <ChevronRight className="size-3" />
                    </span>
                  )}
                  {!attemptsExhausted && quiz.myAttempt && (
                    <span className="ml-auto text-slate-400 dark:text-slate-500 text-[11px]">
                      {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>

                {/* Locked Warning */}
                {attemptsExhausted && (
                  <div className="bg-rose-500/5 text-rose-400 border border-rose-500/10 rounded-xl px-3 py-2 text-xs mt-4 font-medium flex items-center gap-2">
                    <XCircle className="size-3.5 shrink-0" />
                    No attempts remaining
                  </div>
                )}
              </button>
            )}
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Active View ────────────────────────────────────────────────────────────

  if (step === 'active' && quizData) {
    const q = quizData.questions[currentIndex]
    const isLast = currentIndex === quizData.questions.length - 1
    const isAnswered = !!selectedKeys[q?.id]
    const allAnswered = quizData.questions.every((question) => !!selectedKeys[question.id])
    const optionKeys = ['A', 'B', 'C', 'D']

    const timeRunningDown = timeLeft <= 60

    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="mr-1.5 size-4" />
            Quit
          </Button>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Question {currentIndex + 1} of {quizData.questions.length}
            </span>
            <span
              className={cn(
                'flex items-center gap-1.5 font-medium tabular-nums',
                timeRunningDown ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              <Clock className="size-4" />
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / quizData.questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {optionKeys.map((key, idx) => {
              const isSelected = selectedKeys[q.id] === key
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  disabled={timeLeft <= 0}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'border-input hover:border-primary/50 hover:bg-muted/50',
                    timeLeft <= 0 && 'pointer-events-none opacity-60'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {key}
                  </span>
                  {q.options[idx]}
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <div />
          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting || timeLeft <= 0}
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trophy className="mr-2 size-4" />
              )}
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!isAnswered || timeLeft <= 0}>
              Next
              <ChevronRight className="ml-1.5 size-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── Results View ───────────────────────────────────────────────────────────

  if (step === 'results' && result) {
    const percentage = Math.round((result.correctCount / result.totalQuestions) * 100)
    const passed = percentage >= 70

    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-4 md:p-8">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <div
              className={cn(
                'flex size-20 items-center justify-center rounded-full',
                passed
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {passed ? (
                <Trophy className="size-10" />
              ) : (
                <XCircle className="size-10" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold">{passed ? 'Great job!' : 'Keep practicing'}</h2>
              <p className="mt-1 text-muted-foreground">
                {quizData?.quiz.title}
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{percentage}</span>
              <span className="text-xl text-muted-foreground">%</span>
            </div>

            <div className="flex w-full justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="size-4" />
                <span>
                  {result.correctCount} correct
                </span>
              </div>
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="size-4" />
                <span>
                  {result.totalQuestions - result.correctCount} wrong
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button className="w-full" onClick={() => setStep('review')}>
                <Brain className="mr-2 size-4" />
                Explain My Mistakes
              </Button>
              <Button variant="outline" className="w-full" onClick={handleBackToList}>
                <ArrowLeft className="mr-2 size-4" />
                Back to list
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Review (Explain Mistakes) View ───────────────────────────────────────

  if (step === 'review' && result && quizData) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Review Your Answers</h2>
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Button>
        </div>

        {quizData.questions.map((q, i) => {
          const selectedKey = selectedKeys[q.id]
          const correctKey = q.correctKey
          const isCorrect = selectedKey === correctKey
          const optionLabels = ['A', 'B', 'C', 'D']

          return (
            <Card key={q.id} className={isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                    {isCorrect ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <XCircle className="size-4 text-rose-500" />
                    )}
                  </div>
                  <Badge variant="outline" className={isCorrect ? 'text-emerald-500 border-emerald-500/30' : 'text-rose-500 border-rose-500/30'}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>

                <p className="text-sm font-medium leading-relaxed">{q.question}</p>

                <div className="grid gap-1.5">
                  {optionLabels.map((key, idx) => {
                    const isSelected = selectedKey === key
                    const isRightAnswer = correctKey === key
                    return (
                      <div
                        key={key}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                          isSelected && !isCorrect && 'border-rose-500/50 bg-rose-500/5',
                          isRightAnswer && !isCorrect && 'border-emerald-500/50 bg-emerald-500/5',
                          isSelected && isCorrect && 'border-emerald-500/50 bg-emerald-500/5',
                          !isSelected && !isRightAnswer && 'border-transparent bg-white/[0.02]'
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-bold bg-muted text-muted-foreground">
                          {key}
                        </span>
                        <span className="text-foreground/80">{q.options[idx]}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Teacher's Explanation */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-emerald-500 mb-1">Teacher&apos;s Explanation</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{q.explanation || 'No teacher explanation provided.'}</p>
                </div>

                  {/* AI Explanation toggle */}
                  <div>
                    {aiExplanations[q.id] ? (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-amber-500 mb-1">AI Analysis</p>
                        <div className="text-xs text-foreground/70 leading-relaxed space-y-1">
                          {aiExplanations[q.id].split('\n').filter(Boolean).map((line, li) => (
                            <p key={li} className="leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExplainMistake(q.id)}
                      disabled={explainingIds[q.id]}
                      className="gap-1.5 text-xs h-7 px-2"
                    >
                      {explainingIds[q.id] ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Brain className="size-3" />
                      )}
                      {explainingIds[q.id] ? 'Analysing...' : 'Ask AI'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return null
}
