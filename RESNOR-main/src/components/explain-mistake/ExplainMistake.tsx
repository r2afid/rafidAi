'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import LeftPanel from './LeftPanel'
import CenterPanel from './CenterPanel'
import RightPanel from './RightPanel'
import type { QuizAttempt, QuizQuestion, MistakeExplanationData, MisconceptionRecord, RemediationExerciseData, MistakeTypeEnum } from './types'
import { Send, MessageSquare, GraduationCap, Stethoscope, BarChart3, BookOpen, AlertCircle, RefreshCw, X, PanelLeft, LayoutDashboard, Brain } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

function mapApiQuestionToQuizQuestion(q: any): QuizQuestion {
  const apiMistakeType = q.mistakeType || q.question?.mistakeType || null
  return {
    id: q.question?.id || q.questionId,
    text: q.question?.question || q.question || q.text || '',
    studentAnswer: q.selectedKey || q.studentAnswer || '',
    correctAnswer: q.question?.correctKey || q.correctKey || q.correctAnswer || '',
    isCorrect: q.isCorrect,
    mistakeType: apiMistakeType,
    difficulty: q.difficulty || q.question?.difficulty,
    topic: q.topic || q.question?.topic,
    optionA: q.question?.optionA,
    optionB: q.question?.optionB,
    optionC: q.question?.optionC,
    optionD: q.question?.optionD,
  }
}

function mapApiExplanationToMistakeExplanationData(apiExp: any): MistakeExplanationData {
  return {
    mistakeSummary: apiExp.mistakeSummary || '',
    rootCauseAnalysis: apiExp.rootCauseAnalysis || '',
    reasoningBreakdown: apiExp.reasoningBreakdown || '',
    quickFix: apiExp.quickFix || '',
    correctConceptExplanation: apiExp.correctConceptExplanation || '',
    simplifiedAnalogy: apiExp.simplifiedAnalogy || '',
    stepByStepCorrection: apiExp.stepByStepCorrection || '',
    preventionTips: apiExp.preventionTips || '',
    errorCategory: apiExp.errorCategory || '',
    relatedTopics: apiExp.relatedTopics || [],
    mistakeType: (apiExp.mistakeType as MistakeTypeEnum) || 'KNOWLEDGE_GAP',
    correctnessLevel: 'INCORRECT',
    knowledgeGaps: [],
    confidenceDissonanceFlag: false,
    remediationExercises: (apiExp.remediationExercises || []).map((ex: any, i: number) => ({
      id: ex.id || `ex-${i}`,
      exerciseType: ex.exerciseType || 'multiple_choice',
      difficulty: ex.difficulty || 'medium',
      question: ex.question || '',
      correctAnswer: ex.correctAnswer || '',
      options: ex.options || null,
      hint: ex.hint || null,
      isCompleted: false,
      score: null,
    })),
    knowledgeNode: apiExp.knowledgeNode || null,
    knowledgeEdges: apiExp.knowledgeEdges || [],
    pending: apiExp.pending ?? false,
  }
}

export default function ExplainMistake() {
  const user = useAuthStore((s) => s.user)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const setPendingTutorContext = useAppStore((s) => s.setPendingTutorContext)

  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [attemptsLoading, setAttemptsLoading] = useState(true)
  const [attemptsError, setAttemptsError] = useState<string | null>(null)

  const [explanations, setExplanations] = useState<Record<string, MistakeExplanationData>>({})
  const [loadingQuestionId, setLoadingQuestionId] = useState<number | null>(null)
  const [explanationsLoading, setExplanationsLoading] = useState(false)
  const [showMobileLeft, setShowMobileLeft] = useState(false)
  const [showMobileRight, setShowMobileRight] = useState(false)

  const [misconceptions, setMisconceptions] = useState<MisconceptionRecord[]>([])
  const [exercises, setExercises] = useState<RemediationExerciseData[]>([])
  const [rightLoading, setRightLoading] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>('')
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [followUpInput, setFollowUpInput] = useState('')
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'misconceptions' | 'mastery'>('diagnosis')

  const fetchMisconceptions = useCallback(() => {
    if (!user?.id) return
    setRightLoading(true)
    fetch(`/api/quiz/explain-mistake/misconceptions?student_id=${user.id}`)
      .then((r) => r.json())
      .then((misconData) => {
        const mc = (misconData.misconceptions || []).map((m: any) => ({
          id: `miscon-${m.conceptNodeId}`,
          conceptNodeId: m.conceptNodeId,
          conceptLabel: m.conceptLabel,
          frequencyCounter: m.frequencyCounter,
          lastTriggeredAt: m.lastTriggeredAt || '',
          recoveryStatus: m.recoveryStatus,
          mistakeType: m.mistakeType || 'KNOWLEDGE_GAP',
          patternDescription: m.patternDescription || '',
          relatedQuestions: m.relatedQuestions || [],
        }))
        setMisconceptions(mc)
        setRightLoading(false)
      })
      .catch(() => setRightLoading(false))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setAttemptsLoading(false)
      return
    }
    setAttemptsLoading(true)
    setAttemptsError(null)

    fetch(`/api/quiz/history?student_id=${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load quiz history')
        return res.json()
      })
      .then((data) => {
        const mappedAttempts: QuizAttempt[] = (data.attempts || []).map((a: any) => ({
          id: a.id,
          label: `${a.quiz?.title || 'Quiz'} — ${new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          date: a.completedAt ? a.completedAt.split('T')[0] : '',
          score: a.score ?? 0,
          questions: (a.answers || []).map((ans: any) => mapApiQuestionToQuizQuestion(ans)),
        }))
        setAttempts(mappedAttempts)
        if (mappedAttempts.length > 0) {
          setSelectedAttemptId(mappedAttempts[0].id)
        }
        setAttemptsLoading(false)
      })
      .catch((err) => {
        setAttemptsError(err.message)
        setAttemptsLoading(false)
      })
  }, [user?.id])

  const selectedAttempt = useMemo(
    () => attempts.find((a) => a.id === selectedAttemptId) ?? attempts[0] ?? null,
    [attempts, selectedAttemptId]
  )

  const wrongQuestions = useMemo(
    () => selectedAttempt?.questions.filter((q) => !q.isCorrect) ?? [],
    [selectedAttempt]
  )

  const correctCount = useMemo(
    () => selectedAttempt?.questions.filter((q) => q.isCorrect).length ?? 0,
    [selectedAttempt]
  )

  const accuracy = useMemo(
    () => selectedAttempt ? Math.round((correctCount / selectedAttempt.questions.length) * 100) : 0,
    [correctCount, selectedAttempt]
  )

  const mostCommonMistake = useMemo(() => {
    const counts: Record<string, number> = {}
    wrongQuestions.forEach((q) => {
      const t = q.mistakeType ?? 'Unknown'
      counts[t] = (counts[t] ?? 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? 'None'
  }, [wrongQuestions])

  const selectedQuestion = useMemo(
    () =>
      selectedQuestionId && selectedAttempt
        ? selectedAttempt.questions.find((q) => q.id === selectedQuestionId) ?? null
        : wrongQuestions[0] ?? null,
    [selectedQuestionId, selectedAttempt, wrongQuestions]
  )

  const selectedExplanation = useMemo(
    () => (selectedAttempt && selectedQuestion ? explanations[`${selectedAttempt.id}-${selectedQuestion.id}`] ?? null : null),
    [explanations, selectedAttempt, selectedQuestion]
  )

  useEffect(() => {
    if (!selectedAttemptId) return
    setExplanationsLoading(true)

    fetch(`/api/quiz/explain-mistake?attempt_id=${selectedAttemptId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load explanations')
        return res.json()
      })
      .then((data) => {
        const expMap: Record<string, MistakeExplanationData> = {}
        const apiQuestions = data.questions || []
        const expList = data.explanations || []

        if (apiQuestions.length > 0) {
          setAttempts((prev) =>
            prev.map((a) => {
              if (a.id !== selectedAttemptId) return a
              return {
                ...a,
                questions: a.questions.map((q) => {
                  const apiQ = apiQuestions.find(
                    (aq: any) => String(aq.questionId) === String(q.id)
                  )
                  if (apiQ?.mistakeType) {
                    return { ...q, mistakeType: apiQ.mistakeType }
                  }
                  return q
                }),
              }
            })
          )
        }

        apiQuestions.forEach((q: any) => {
          const apiExp = expList.find((e: any) => e.questionId === q.questionId)
          if (apiExp) {
            expMap[`${selectedAttemptId}-${q.questionId}`] = mapApiExplanationToMistakeExplanationData(apiExp)
          } else {
            expMap[`${selectedAttemptId}-${q.questionId}`] = {
              mistakeSummary: '',
              rootCauseAnalysis: '',
              reasoningBreakdown: '',
              quickFix: '',
              correctConceptExplanation: '',
              simplifiedAnalogy: '',
              stepByStepCorrection: '',
              preventionTips: '',
              errorCategory: '',
              relatedTopics: [],
              mistakeType: 'KNOWLEDGE_GAP',
              correctnessLevel: q.isCorrect ? 'CORRECT' : 'INCORRECT',
              knowledgeGaps: [],
              confidenceDissonanceFlag: false,
              remediationExercises: [],
              knowledgeNode: null,
              knowledgeEdges: [],
            }
          }
        })
        setExplanations(expMap)
        setExplanationsLoading(false)

        const allExercises: RemediationExerciseData[] = []
        Object.values(expMap).forEach((exp) => {
          if (exp.remediationExercises?.length) allExercises.push(...exp.remediationExercises)
        })
        setExercises(allExercises)
        // Auto-select the first wrong question so per-question AI fetch triggers
        if (selectedQuestionId == null) {
          const firstWrong = apiQuestions.find((q: any) => !q.isCorrect)
          if (firstWrong) setSelectedQuestionId(firstWrong.questionId)
        }
        // Re-fetch misconceptions now that new MistakeExplanation records exist
        fetchMisconceptions()
      })
      .catch(() => {
        setExplanations({})
        setExplanationsLoading(false)
      })
  }, [selectedAttemptId])

  // Per-question lazy load: when user clicks a wrong answer that has no cached analysis, fetch AI for just that question
  useEffect(() => {
    if (!selectedAttemptId || selectedQuestionId == null) return

    const key = `${selectedAttemptId}-${selectedQuestionId}`
    const existing = explanations[key]
    if (existing && existing.rootCauseAnalysis) return

    setLoadingQuestionId(selectedQuestionId)

    fetch(`/api/quiz/explain-mistake?attempt_id=${selectedAttemptId}&question_id=${selectedQuestionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then((data) => {
        setExplanations((prev) => {
          const updated = { ...prev }
          const apiExps = data.explanations || []
          const newExercises: RemediationExerciseData[] = []
          apiExps.forEach((apiExp: any) => {
            const mapped = mapApiExplanationToMistakeExplanationData(apiExp)
            updated[`${selectedAttemptId}-${apiExp.questionId}`] = mapped
            if (mapped.remediationExercises?.length) newExercises.push(...mapped.remediationExercises)
          })
          if (newExercises.length > 0) {
            setExercises((prevEx) => {
              const existingIds = new Set(prevEx.map((e) => e.id))
              const deduped = newExercises.filter((e) => !existingIds.has(e.id))
              return [...prevEx, ...deduped]
            })
          }
          return updated
        })

        // Update mistakeType on attempt questions so LeftPanel shows the label
        const apiQuestions = data.questions || []
        if (apiQuestions.length > 0) {
          setAttempts((prev) =>
            prev.map((a) => {
              if (a.id !== selectedAttemptId) return a
              return {
                ...a,
                questions: a.questions.map((q) => {
                  const apiQ = apiQuestions.find((aq: any) => String(aq.questionId) === String(q.id))
                  if (apiQ?.mistakeType) {
                    return { ...q, mistakeType: apiQ.mistakeType }
                  }
                  return q
                }),
              }
            })
          )
        }

        setLoadingQuestionId(null)
      })
      .catch(() => setLoadingQuestionId(null))
  }, [selectedAttemptId, selectedQuestionId])

  useEffect(() => {
    if (activeTab !== 'mastery' || !user?.id || !selectedAttemptId) return
    fetchMisconceptions()
  }, [activeTab, user?.id, selectedAttemptId, fetchMisconceptions])

  const handleSelectQuestion = useCallback((q: QuizQuestion) => {
    setSelectedQuestionId(q.id)
  }, [])

  const handleAttemptChange = useCallback((value: string) => {
    setSelectedAttemptId(value)
    setSelectedQuestionId(null)
    setFollowUpInput('')
  }, [])

  const handleFollowUpSubmit = useCallback(async () => {
    if (!followUpInput.trim()) return
    const qText = selectedQuestion?.text || ''
    const mType = selectedQuestion?.mistakeType || ''
    const sAnswer = selectedQuestion?.studentAnswer || ''
    const cAnswer = selectedQuestion?.correctAnswer || ''
    const context = `[From Explain My Mistake]\nQuestion: ${qText}\nMy answer: ${sAnswer}\nCorrect answer: ${cAnswer}\nMistake type: ${mType}\n\nFollow-up: ${followUpInput.trim()}`

    if (user?.id) {
      fetch('/api/quiz/explain-mistake/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          attemptId: selectedAttempt?.id,
          questionId: selectedQuestion?.id,
          message: followUpInput.trim(),
        }),
      }).catch(() => {})
    }

    setPendingTutorContext(context)
    setFollowUpInput('')
    setActivePage('tutor')
  }, [followUpInput, selectedQuestion, selectedAttempt, user?.id, setPendingTutorContext, setActivePage])

  const handleCompleteExercise = useCallback(async (exerciseId: string) => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/quiz/explain-mistake/complete-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, studentId: user.id }),
      })
      if (res.ok) {
        setExercises((prev) =>
          prev.map((ex) => (ex.id === exerciseId ? { ...ex, isCompleted: true } : ex))
        )
      }
    } catch {}
  }, [user?.id])

  if (!attemptsLoading && !attemptsError && attempts.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="shrink-0 border-b bg-card/60 backdrop-blur-xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-600 dark:text-violet-400">
              <GraduationCap className="size-4" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">Explain My Mistake</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg bg-card/50 backdrop-blur-xl border-dashed">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-violet-500/10">
                  <BookOpen className="size-8 text-violet-600" />
                </div>
              </div>
              <h2 className="text-lg font-bold">No quiz attempts yet</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Complete your first quiz to get AI-powered mistake analysis and personalized recommendations.
              </p>
              <Button onClick={() => setActivePage('quiz')} size="sm" className="gap-2">
                <BookOpen className="size-4" />
                Take a Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (attemptsLoading) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="shrink-0 border-b bg-card/60 backdrop-blur-xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <Skeleton className="h-full rounded-xl" />
            <Skeleton className="h-full rounded-xl" />
            <Skeleton className="h-full rounded-xl hidden xl:block" />
          </div>
        </div>
      </div>
    )
  }

  if (attemptsError) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="shrink-0 border-b bg-card/60 backdrop-blur-xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-600 dark:text-violet-400">
              <GraduationCap className="size-4" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">Explain My Mistake</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md bg-card/50 backdrop-blur-xl border-dashed border-rose-500/30">
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/10">
                  <AlertCircle className="size-6 text-rose-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{attemptsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="shrink-0 border-b bg-card/60 backdrop-blur-xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-600 dark:text-violet-400">
              <GraduationCap className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight leading-tight">Explain My Mistake</h1>
              <p className="text-[10px] text-muted-foreground truncate">
                AI-powered cognitive diagnosis & learning recovery
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Select Attempt:
            </span>
            <Select value={selectedAttemptId} onValueChange={handleAttemptChange}>
              <SelectTrigger className="w-[200px] sm:w-[260px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {attempts.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    {a.label} — {a.score}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">


        <aside className="w-[280px] lg:w-[320px] shrink-0 hidden lg:flex flex-col border-r bg-card/40 backdrop-blur-xl h-full overflow-y-auto scrollbar-thin">
          <div className="p-3">
            {selectedAttempt ? (
              <LeftPanel
                attempt={selectedAttempt}
                selectedQuestion={selectedQuestion}
                onSelectQuestion={(q) => { handleSelectQuestion(q); setShowMobileLeft(false) }}
                accuracy={accuracy}
                wrongCount={wrongQuestions.length}
                mostCommonMistake={mostCommonMistake}
                loadingQuestionId={loadingQuestionId}
              />
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-xs text-muted-foreground">No attempt selected</p>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile left panel overlay */}
        {showMobileLeft && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileLeft(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col bg-card border-r shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="text-xs font-semibold text-muted-foreground">Questions</span>
                <button onClick={() => setShowMobileLeft(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-3 flex-1">
                {selectedAttempt ? (
                  <LeftPanel
                    attempt={selectedAttempt}
                    selectedQuestion={selectedQuestion}
                    onSelectQuestion={(q) => { handleSelectQuestion(q); setShowMobileLeft(false) }}
                    accuracy={accuracy}
                    wrongCount={wrongQuestions.length}
                    mostCommonMistake={mostCommonMistake}
                    loadingQuestionId={loadingQuestionId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-xs text-muted-foreground">No attempt selected</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Mobile right panel overlay */}
        {showMobileRight && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileRight(false)} />
            <aside className="absolute right-0 top-0 bottom-0 w-[300px] flex flex-col bg-card border-l shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between p-3 border-b shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">Mastery Tools</span>
                <button onClick={() => setShowMobileRight(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-3 flex-1 overflow-y-auto">
                <RightPanel
                  misconceptions={misconceptions}
                  exercises={exercises}
                  loading={rightLoading}
                  onCompleteExercise={handleCompleteExercise}
                  activeExplanation={selectedExplanation}
                  question={selectedQuestion}
                  onGenerateExercises={() => {
                    if (!selectedAttemptId) return
                    setExplanationsLoading(true)
                    setActiveTab('mastery')
                    fetch(`/api/quiz/explain-mistake?attempt_id=${selectedAttemptId}`)
                      .then((res) => res.json())
                      .then((data) => {
                        const newExercises: RemediationExerciseData[] = []
                        ;(data.explanations || []).forEach((apiExp: any) => {
                          const mapped = mapApiExplanationToMistakeExplanationData(apiExp)
                          if (mapped.remediationExercises?.length) newExercises.push(...mapped.remediationExercises)
                        })
                        setExercises((prev) => [...prev, ...newExercises])
                        setExplanationsLoading(false)
                      })
                      .catch(() => setExplanationsLoading(false))
                  }}
                />
              </div>
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-card/40 backdrop-blur-xl px-4 py-2 flex items-center gap-1.5">
            <div className="relative flex items-center bg-white/[0.01] backdrop-blur-sm border border-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'diagnosis' ? 'text-white dark:text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stethoscope className="size-3.5" />
                Core Diagnosis
                {activeTab === 'diagnosis' && (
                  <motion.div
                    layoutId="explainMistakeTab"
                    className="absolute inset-0 bg-white/[0.06] border border-white/10 rounded-lg shadow-md z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('mastery')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'mastery' ? 'text-white dark:text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="size-3.5" />
                Mastery Tools
                {activeTab === 'mastery' && (
                  <motion.div
                    layoutId="explainMistakeTab"
                    className="absolute inset-0 bg-white/[0.06] border border-white/10 rounded-lg shadow-md z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('misconceptions')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'misconceptions' ? 'text-white dark:text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brain className="size-3.5" />
                Misconception History
                {activeTab === 'misconceptions' && (
                  <motion.div
                    layoutId="explainMistakeTab"
                    className="absolute inset-0 bg-white/[0.06] border border-white/10 rounded-lg shadow-md z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setShowMobileLeft(true)}
              className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <PanelLeft className="size-3.5" />
              Questions
            </button>
            <button
              onClick={() => setShowMobileRight(true)}
              className="xl:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <LayoutDashboard className="size-3.5" />
              Tools
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 lg:p-4 scrollbar-thin">
            {selectedQuestion ? (
              <div className="space-y-4">
                <CenterPanel
                  question={selectedQuestion}
                  attemptId={selectedAttempt?.id ?? ''}
                  activeTab={activeTab}
                  explanation={selectedExplanation}
                  isLoading={explanationsLoading || (loadingQuestionId != null && loadingQuestionId === selectedQuestion?.id)}
                  questionNumber={selectedAttempt ? selectedAttempt.questions.findIndex((q) => q.id === selectedQuestion.id) + 1 : undefined}
                  onSwitchToMastery={() => setActiveTab('mastery')}
                />
                {activeTab !== 'diagnosis' && (
                  <RightPanel
                    variant={activeTab === 'misconceptions' ? 'misconceptions' : 'exercises'}
                    misconceptions={misconceptions}
                    exercises={exercises}
                    loading={rightLoading}
                    onCompleteExercise={handleCompleteExercise}
                    activeExplanation={selectedExplanation}
                    question={selectedQuestion}
                    onGenerateExercises={() => {
                      if (!selectedAttemptId) return
                      setExplanationsLoading(true)
                      setActiveTab('mastery')
                      fetch(`/api/quiz/explain-mistake?attempt_id=${selectedAttemptId}`)
                        .then((res) => res.json())
                        .then((data) => {
                          const newExercises: RemediationExerciseData[] = []
                          ;(data.explanations || []).forEach((apiExp: any) => {
                            const mapped = mapApiExplanationToMistakeExplanationData(apiExp)
                            if (mapped.remediationExercises?.length) newExercises.push(...mapped.remediationExercises)
                          })
                          setExercises((prev) => [...prev, ...newExercises])
                          setExplanationsLoading(false)
                        })
                        .catch(() => setExplanationsLoading(false))
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Card className="max-w-md bg-card/50 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      <MessageSquare className="size-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select a question from the left panel to view the AI diagnosis.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t bg-background/80 backdrop-blur-xl p-3">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Textarea
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="Ask a follow-up question about this mistake..."
                  className="min-h-[36px] max-h-[80px] text-sm resize-none pr-10 rounded-2xl bg-muted/50 border-border/50 focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleFollowUpSubmit()
                    }
                  }}
                />
              </div>
              <Button
                size="icon"
                onClick={handleFollowUpSubmit}
                disabled={!followUpInput.trim()}
                className="size-9 shrink-0 rounded-xl"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
