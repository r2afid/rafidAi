'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  BarChart3,
  Loader2,
} from 'lucide-react'
import type { QuizAttempt, QuizQuestion } from './types'

const MISTAKE_TYPE_LABELS: Record<string, string> = {
  'CONCEPT_MISUNDERSTANDING': 'Type confusion',
  'FALSE_ASSUMPTION': 'False assumption',
  'FORMULA_MISUSE': 'Formula misuse',
  'ALGEBRAIC_ERROR': 'Algebraic error',
  'CALCULATION_FLOW_EXCEPTION': 'Calculation error',
  'LOGIC_ERROR': 'Logic error',
  'SEQUENTIAL_REASONING_FAILURE': 'Reasoning failure',
  'SYNTAX_ERROR': 'Syntax mix-up',
  'EXECUTION_FLOW_DISCONNECT': 'Flow disconnect',
  'MISINTERPRETATION': 'Misinterpretation',
  'CARELESS_MISTAKE': 'Careless mistake',
  'KNOWLEDGE_GAP': 'Knowledge gap',
  'GUESS_BASED': 'Guess-based',
  'SUPERFICIALLY_MEMORIZED': 'Superficially memorized',
}

const mistakeTypeColors: Record<string, string> = {
  'CONCEPT_MISUNDERSTANDING': 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
  'FALSE_ASSUMPTION': 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800',
  'FORMULA_MISUSE': 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  'ALGEBRAIC_ERROR': 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800',
  'CALCULATION_FLOW_EXCEPTION': 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
  'LOGIC_ERROR': 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  'SEQUENTIAL_REASONING_FAILURE': 'bg-pink-500/10 text-pink-600 border-pink-200 dark:border-pink-800',
  'SYNTAX_ERROR': 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  'EXECUTION_FLOW_DISCONNECT': 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800',
  'MISINTERPRETATION': 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  'CARELESS_MISTAKE': 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800',
  'KNOWLEDGE_GAP': 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800',
  'GUESS_BASED': 'bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-800',
  'SUPERFICIALLY_MEMORIZED': 'bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800',
}

function getMistakeLabel(type: string | undefined): string {
  if (!type) return ''
  return MISTAKE_TYPE_LABELS[type] || type
}

function getMistakeColor(type: string | undefined): string {
  if (!type) return ''
  return mistakeTypeColors[type] || 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800'
}

interface LeftPanelProps {
  attempt: QuizAttempt
  selectedQuestion: QuizQuestion | null
  onSelectQuestion: (q: QuizQuestion) => void
  accuracy: number
  wrongCount: number
  mostCommonMistake: string
  loadingQuestionId: number | null
}

export default function LeftPanel({
  attempt,
  selectedQuestion,
  onSelectQuestion,
  accuracy,
  wrongCount,
  mostCommonMistake,
  loadingQuestionId,
}: LeftPanelProps) {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card/60 backdrop-blur-xl rounded-xl border border-border/50 p-2.5 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
            <XCircle className="size-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-tight">Wrong</p>
            <p className="text-sm font-bold leading-tight">{wrongCount}</p>
          </div>
        </div>
        <div className="bg-card/60 backdrop-blur-xl rounded-xl border border-border/50 p-2.5 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Target className="size-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-tight">Accuracy</p>
            <p className="text-sm font-bold leading-tight">{accuracy}%</p>
          </div>
        </div>
        <div className="bg-card/60 backdrop-blur-xl rounded-xl border border-border/50 col-span-2 p-2.5 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <AlertTriangle className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground leading-tight">Most Common Mistake</p>
            <p className="text-xs font-medium truncate">{mostCommonMistake}</p>
          </div>
        </div>
        <div className="bg-card/60 backdrop-blur-xl rounded-xl border border-border/50 col-span-2 p-2.5 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-tight">Score</p>
            <p className="text-sm font-bold leading-tight">{attempt.score}%</p>
          </div>
        </div>
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {attempt.questions.map((q, idx) => {
                const isSelected = selectedQuestion?.id === q.id
                const label = getMistakeLabel(q.mistakeType)
                const color = getMistakeColor(q.mistakeType)
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(q)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary/40 bg-primary/[0.04]'
                        : 'border-transparent hover:border-border/60 hover:bg-muted/40'
                    } ${!q.isCorrect ? 'border-l-[3px] border-l-rose-500' : 'border-l-[3px] border-l-emerald-500'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5 ${
                          q.isCorrect
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : 'bg-rose-500/20 text-rose-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs leading-relaxed line-clamp-2">{q.text}</p>
                        {!q.isCorrect && loadingQuestionId === q.id && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <Loader2 className="size-2.5 animate-spin" />
                            Analyzing...
                          </span>
                        )}
                        {!q.isCorrect && loadingQuestionId !== q.id && label && (
                          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>
                            {label}
                          </span>
                        )}
                        {!q.isCorrect && loadingQuestionId !== q.id && !label && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            Click to analyze
                          </span>
                        )}
                        {q.isCorrect && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <CheckCircle2 className="size-2.5" />
                            Correct
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
