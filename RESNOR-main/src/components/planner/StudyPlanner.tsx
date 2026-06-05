'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Plus,
  Timer,
  Clock,
  CheckCircle2,
  Flame,
  Trash2,
  Play,
  GripVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle,
  ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Course = 'DS' | 'AI' | 'DB' | 'SE'
type Priority = 'high' | 'medium' | 'low'
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface StudySession {
  id: string
  course: Course
  topic: string
  dayIndex: DayIndex
  startHour: number
  startMinute: number
  duration: number
  priority: Priority
}

interface PlannerTask {
  id: string
  title: string
  priority: Priority
  dueDayIndex: DayIndex
  completed: boolean
}

interface SessionFormData {
  course: Course
  topic: string
  dayIndex: number
  startHour: number
  startMinute: number
  duration: number
  priority: Priority
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COURSE_CONFIG: Record<
  Course,
  {
    name: string
    bg: string
    border: string
    text: string
    solid: string
    dot: string
  }
> = {
  DS: {
    name: 'Data Structures',
    bg: 'bg-emerald-500/10',
    border: 'border-l-4 border-l-emerald-500 border-white/5',
    text: 'text-emerald-700 dark:text-emerald-300',
    solid: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  AI: {
    name: 'Artificial Intelligence',
    bg: 'bg-teal-500/10',
    border: 'border-l-4 border-l-teal-500 border-white/5',
    text: 'text-teal-700 dark:text-teal-300',
    solid: 'bg-teal-500',
    dot: 'bg-teal-500',
  },
  DB: {
    name: 'Database Systems',
    bg: 'bg-amber-500/10',
    border: 'border-l-4 border-l-amber-500 border-white/5',
    text: 'text-amber-700 dark:text-amber-300',
    solid: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  SE: {
    name: 'Software Engineering',
    bg: 'bg-rose-500/10',
    border: 'border-l-4 border-l-rose-500 border-white/5',
    text: 'text-rose-700 dark:text-rose-300',
    solid: 'bg-rose-500',
    dot: 'bg-rose-500',
  },
}

const PRIORITY_CONFIG: Record<
  Priority,
  { bg: string; text: string; label: string; dot: string }
> = {
  high: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    label: 'High',
    dot: 'bg-red-500',
  },
  medium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Medium',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Low',
    dot: 'bg-emerald-500',
  },
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const HOUR_HEIGHT = 56
const START_HOUR = 8
const END_HOUR = 22
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '150', label: '2.5 hours' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDayIndex(): DayIndex {
  const d = new Date().getDay()
  return ((d === 0 ? 6 : d - 1) as DayIndex)
}

function getWeekDates(): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(today.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? 'AM' : 'PM'
  return minute === 0 ? `${h} ${ampm}` : `${h}:${minute.toString().padStart(2, '0')} ${ampm}`
}

function formatHourLabel(hour: number): string {
  const h = hour % 12 || 12
  return hour < 12 ? `${h} AM` : `${h} PM`
}

function formatWeekRange(dates: Date[]): string {
  const s = dates[0]
  const e = dates[6]
  const so: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const eo: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${s.toLocaleDateString('en-US', so)} – ${e.toLocaleDateString('en-US', eo)}`
}

function dueLabel(dayIndex: DayIndex, today: DayIndex): { text: string; className: string } {
  if (dayIndex === today) return { text: 'Due today', className: 'text-amber-600 dark:text-amber-400' }
  if (dayIndex < today) return { text: 'Overdue', className: 'text-red-600 dark:text-red-400' }
  return { text: `Due ${DAY_NAMES[dayIndex]}`, className: 'text-muted-foreground' }
}

let _idCounter = 100
function uid(): string {
  return `pl_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const TODAY_IDX = getTodayDayIndex()

function makeInitialSessions(): StudySession[] {
  return [
    { id: uid(), course: 'DS', topic: 'Trees & Graphs', dayIndex: 0, startHour: 9, startMinute: 0, duration: 90, priority: 'high' },
    { id: uid(), course: 'AI', topic: 'Neural Networks', dayIndex: 0, startHour: 14, startMinute: 0, duration: 90, priority: 'medium' },
    { id: uid(), course: 'DB', topic: 'SQL Joins Practice', dayIndex: 1, startHour: 10, startMinute: 0, duration: 120, priority: 'high' },
    { id: uid(), course: 'SE', topic: 'Agile Methodologies', dayIndex: 1, startHour: 16, startMinute: 0, duration: 60, priority: 'low' },
    { id: uid(), course: 'DS', topic: 'Dynamic Programming', dayIndex: 2, startHour: 11, startMinute: 0, duration: 120, priority: 'high' },
    { id: uid(), course: 'AI', topic: 'CNN Architectures', dayIndex: 3, startHour: 9, startMinute: 0, duration: 60, priority: 'medium' },
    { id: uid(), course: 'DB', topic: 'Normalization', dayIndex: 3, startHour: 14, startMinute: 0, duration: 120, priority: 'medium' },
    { id: uid(), course: 'DS', topic: 'Sorting Algorithms', dayIndex: 4, startHour: 10, startMinute: 0, duration: 90, priority: 'low' },
    { id: uid(), course: 'SE', topic: 'Design Patterns', dayIndex: 4, startHour: 15, startMinute: 0, duration: 90, priority: 'high' },
    { id: uid(), course: 'AI', topic: 'Transformer Models', dayIndex: 5, startHour: 9, startMinute: 0, duration: 120, priority: 'high' },
    { id: uid(), course: 'DB', topic: 'Indexing & Optimization', dayIndex: 5, startHour: 13, startMinute: 0, duration: 90, priority: 'medium' },
    { id: uid(), course: 'SE', topic: 'System Design Review', dayIndex: 6, startHour: 11, startMinute: 0, duration: 60, priority: 'low' },
  ]
}

function makeInitialTasks(): PlannerTask[] {
  const t = TODAY_IDX
  return [
    { id: uid(), title: 'Complete DS Assignment 5', priority: 'high', dueDayIndex: t as DayIndex, completed: false },
    { id: uid(), title: 'Read AI paper on attention mechanism', priority: 'high', dueDayIndex: ((t + 1) % 7) as DayIndex, completed: false },
    { id: uid(), title: 'Practice 20 SQL problems', priority: 'medium', dueDayIndex: ((t + 3) % 7) as DayIndex, completed: false },
    { id: uid(), title: 'Review SE lecture notes Ch.7', priority: 'medium', dueDayIndex: ((t + 2) % 7) as DayIndex, completed: false },
    { id: uid(), title: 'Set up DB project environment', priority: 'low', dueDayIndex: ((t + 5) % 7) as DayIndex, completed: false },
    { id: uid(), title: 'Submit DS lab report', priority: 'high', dueDayIndex: ((t + 6) % 7) as DayIndex, completed: true },
    { id: uid(), title: 'Watch AI lecture recording', priority: 'medium', dueDayIndex: ((t + 4) % 7) as DayIndex, completed: true },
    { id: uid(), title: 'Complete SE reading assignment', priority: 'low', dueDayIndex: ((t + 6) % 7) as DayIndex, completed: true },
  ]
}

// ---------------------------------------------------------------------------
// Session Dialog
// ---------------------------------------------------------------------------

function SessionDialog({
  open,
  onOpenChange,
  session,
  onSubmit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  session: StudySession | null
  onSubmit: (data: SessionFormData) => void
  onDelete: (id: string) => void
}) {
  const getDefaults = (): SessionFormData => {
    if (session) {
      return {
        course: session.course,
        topic: session.topic,
        dayIndex: session.dayIndex,
        startHour: session.startHour,
        startMinute: session.startMinute,
        duration: session.duration,
        priority: session.priority,
      }
    }
    return { course: 'DS', topic: '', dayIndex: TODAY_IDX, startHour: 9, startMinute: 0, duration: 60, priority: 'medium' }
  }

  const [form, setForm] = useState<SessionFormData>(getDefaults)

  const updateField = useCallback(<K extends keyof SessionFormData>(key: K, val: SessionFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  const canSubmit = form.topic.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({ ...form, topic: form.topic.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Study Session' : 'Add Study Session'}</DialogTitle>
          <DialogDescription>
            {session ? 'Update the details of your study session.' : 'Schedule a new study session for this week.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Course */}
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={form.course} onValueChange={(v) => updateField('course', v as Course)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(COURSE_CONFIG) as Course[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span className={cn('inline-block w-2 h-2 rounded-full', COURSE_CONFIG[c].dot)} />
                      {COURSE_CONFIG[c].name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              placeholder="e.g. Binary Trees, CNNs, SQL Joins..."
              value={form.topic}
              onChange={(e) => updateField('topic', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
          </div>

          {/* Day + Time row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={String(form.dayIndex)} onValueChange={(v) => updateField('dayIndex', Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Select value={`${form.startHour}`} onValueChange={(v) => updateField('startHour', Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>{formatHourLabel(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={String(form.duration)} onValueChange={(v) => updateField('duration', Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => updateField('priority', v as Priority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2">
                      <span className={cn('inline-block w-2 h-2 rounded-full', PRIORITY_CONFIG[p].dot)} />
                      {PRIORITY_CONFIG[p].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {session && (
            <Button variant="destructive" onClick={() => { onDelete(session.id); onOpenChange(false) }}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {session ? 'Update Session' : 'Add Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Session Block (positioned inside calendar day column)
// ---------------------------------------------------------------------------

function SessionBlock({
  session,
  onEdit,
}: {
  session: StudySession
  onEdit: (s: StudySession) => void
}) {
  const cfg = COURSE_CONFIG[session.course]
  const top =
    (session.startHour - START_HOUR) * HOUR_HEIGHT +
    (session.startMinute / 60) * HOUR_HEIGHT
  const height = Math.max((session.duration / 60) * HOUR_HEIGHT, 28)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.2 }}
      className="absolute left-[3px] right-[3px] z-10"
      style={{ top, height }}
    >
      <div
        draggable
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          e.dataTransfer.setData('text/plain', session.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => onEdit(session)}
        className={cn(
          'rounded-lg px-3 py-2 cursor-pointer h-full',
          'border border-white/5 transition-shadow hover:shadow-md',
          'overflow-hidden select-none',
          cfg.bg,
          cfg.border,
        )}
      >
        <div className="flex items-start justify-between gap-0.5">
          <div className="min-w-0 flex-1">
            <p className={cn('text-[11px] font-semibold leading-none', cfg.text)}>
              {session.course}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
              {session.topic}
            </p>
            {height > 36 && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                {formatTime(session.startHour, session.startMinute)} &middot; {session.duration} min
              </p>
            )}
          </div>
          <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Task Item
// ---------------------------------------------------------------------------

function TaskItem({
  task,
  index,
  onToggle,
  onDelete,
}: {
  task: PlannerTask
  index: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const pc = PRIORITY_CONFIG[task.priority]
  const dl = dueLabel(task.dueDayIndex, TODAY_IDX)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border border-white/5 p-2.5 transition-all group',
        task.completed ? 'opacity-40' : 'hover:bg-white/[0.03]',
        'mb-2',
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            task.completed && 'text-muted-foreground',
          )}
        >
          {task.title}
        </p>
        {!task.completed && (
          <p className={cn('text-[10px] font-medium mt-0.5', dl.className)}>
            {dl.text}
          </p>
        )}
      </div>
      {!task.completed && (
        <Badge
          className={cn(
            'border-0 text-[10px] px-1.5 py-0 shrink-0',
            pc.bg,
            pc.text,
          )}
        >
          {pc.label}
        </Badge>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete task</TooltipContent>
      </Tooltip>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function StudyPlanner() {
  const isMobile = useIsMobile()
  const setActivePage = useAppStore((s) => s.setActivePage)

  // --- State ---
  const [sessions, setSessions] = useState<StudySession[]>(makeInitialSessions)
  const [tasks, setTasks] = useState<PlannerTask[]>(makeInitialTasks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)
  const [mobileDay, setMobileDay] = useState<number>(TODAY_IDX)
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium')

  // --- Derived ---
  const weekDates = useMemo(() => getWeekDates(), [])
  const todaySessions = useMemo(
    () =>
      sessions
        .filter((s) => s.dayIndex === TODAY_IDX)
        .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)),
    [sessions],
  )
  const completedTasksCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])
  const totalWeeklyMinutes = useMemo(() => sessions.reduce((s, x) => s + x.duration, 0), [sessions])
  const weeklyHours = (totalWeeklyMinutes / 60).toFixed(1)
  const weeklyGoalHours = 25
  const weeklyProgress = Math.min((totalWeeklyMinutes / (weeklyGoalHours * 60)) * 100, 100)

  const displayDayIndices = isMobile
    ? [mobileDay as DayIndex]
    : (Array.from({ length: 7 }, (_, i) => i) as DayIndex[])

  // --- Handlers ---
  const handleOpenAdd = useCallback(() => {
    setEditingSession(null)
    setDialogOpen(true)
  }, [])

  const handleEditSession = useCallback((s: StudySession) => {
    setEditingSession(s)
    setDialogOpen(true)
  }, [])

  const handleSessionSubmit = useCallback(
    (data: SessionFormData) => {
      if (editingSession) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === editingSession.id
              ? { ...s, ...data, dayIndex: data.dayIndex as DayIndex }
              : s,
          ),
        )
      } else {
        setSessions((prev) => [
          ...prev,
          { ...data, id: uid(), dayIndex: data.dayIndex as DayIndex },
        ])
      }
      setEditingSession(null)
    },
    [editingSession],
  )

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setEditingSession(null)
  }, [])

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }, [])

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleAddTask = useCallback(() => {
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    setTasks((prev) => [
      { id: uid(), title: trimmed, priority: newTaskPriority, dueDayIndex: TODAY_IDX, completed: false },
      ...prev,
    ])
    setNewTaskTitle('')
  }, [newTaskTitle, newTaskPriority])

  const handleDragOverDay = useCallback((dayIdx: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverDay(dayIdx)
    }
  }, [])

  const handleDropOnDay = useCallback(
    (targetDay: number) => {
      return (e: React.DragEvent) => {
        e.preventDefault()
        setDragOverDay(null)
        const sessionId = e.dataTransfer.getData('text/plain')
        if (!sessionId) return
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, dayIndex: targetDay as DayIndex } : s,
          ),
        )
      }
    },
    [],
  )

  const handlePrevDay = useCallback(() => {
    setMobileDay((d) => (d - 1 + 7) % 7)
  }, [])
  const handleNextDay = useCallback(() => {
    setMobileDay((d) => (d + 1) % 7)
  }, [])

  // --- Render ---
  return (
    <div className="space-y-6 bg-slate-900/40 min-h-screen">
      {/* ================================================================ */}
      {/* Header */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarDays className="w-7 h-7 text-emerald-500" />
            Study Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatWeekRange(weekDates)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() => setActivePage('pomodoro')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4" />
                  Start Focus
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>Start a Pomodoro focus session</TooltipContent>
          </Tooltip>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" />
              Add Session
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Progress Overview */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Weekly Study Hours */}
        <div className="bg-white/[0.02] dark:bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Weekly Study Hours</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {weeklyHours}
                </span>
                <span className="text-xs text-muted-foreground">/ {weeklyGoalHours}h goal</span>
              </div>
              <Progress value={weeklyProgress} className="h-1.5 mt-1.5" />
            </div>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white/[0.02] dark:bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                  {completedTasksCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {tasks.length} tasks
                </span>
              </div>
              <Progress
                value={tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}
                className="h-1.5 mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-white/[0.02] dark:bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Study Streak</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  5
                </span>
                <span className="text-xs text-muted-foreground">consecutive days</span>
              </div>
              <div className="flex gap-0.5 mt-1.5">
                {DAY_NAMES.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      i < 5 ? 'bg-amber-500' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Main Content */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* -------------------------------------------------------------- */}
        {/* Calendar */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-8 bg-white/[0.02] dark:bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl rounded-2xl overflow-hidden max-h-[750px] overflow-y-auto pr-2 scrollbar-thin">
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {isMobile ? 'Day Schedule' : 'Weekly Schedule'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isMobile
                    ? `${DAY_NAMES[mobileDay]}, ${weekDates[mobileDay].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : `${sessions.length} sessions this week`}
                </p>
              </div>
              {isMobile && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[90px] text-center">
                    {DAY_NAMES[mobileDay]}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextDay}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Day Headers */}
          <div className="flex border-b border-white/5 bg-white/[0.02] mx-6">
            <div className="w-12 shrink-0 hidden sm:block" />

            {displayDayIndices.map((di) => {
              const isToday = di === TODAY_IDX
              const isDragOver = dragOverDay === di
              return (
                <div
                  key={di}
                  className={cn(
                    'flex-1 py-2.5 text-center border-r border-white/5 last:border-r-0 transition-colors',
                    isToday && 'bg-emerald-500/5',
                    isDragOver && !isMobile && 'bg-emerald-500/10 ring-2 ring-inset ring-emerald-500/30',
                  )}
                  onDragOver={!isMobile ? handleDragOverDay(di) : undefined}
                  onDrop={!isMobile ? handleDropOnDay(di) : undefined}
                  onDragLeave={() => setDragOverDay(null)}
                >
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isToday
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground',
                    )}
                  >
                    {DAY_NAMES[di]}
                  </span>
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {weekDates[di].getDate()}
                  </span>
                  {isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mt-0.5" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Calendar Body */}
          <div className="flex px-6 pb-6" style={{ minHeight: TOTAL_HEIGHT }}>
            {/* Time Labels */}
            <div className="w-12 shrink-0 hidden sm:block relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-2 text-[10px] text-muted-foreground font-medium tabular-nums"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {displayDayIndices.map((dayIdx) => {
              const daySessions = sessions
                .filter((s) => s.dayIndex === dayIdx)
                .sort(
                  (a, b) =>
                    a.startHour * 60 + a.startMinute -
                    (b.startHour * 60 + b.startMinute),
                )

              return (
                <div
                  key={dayIdx}
                  className="flex-1 relative border-r border-white/5 last:border-r-0"
                  style={{ height: TOTAL_HEIGHT }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-x-0 border-t border-white/5"
                      style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Today highlight */}
                  {dayIdx === TODAY_IDX && (
                    <div className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />
                  )}

                  {/* Session blocks */}
                  <AnimatePresence mode="popLayout">
                    {daySessions.map((session) => (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        onEdit={handleEditSession}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Empty state for this day */}
                  {daySessions.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-[11px] text-muted-foreground/40">No sessions</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Right Panel: Today's Schedule + Tasks */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white/[0.02] dark:bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500" />
                  Today&apos;s Schedule
                </p>
                <p className="text-sm text-muted-foreground">
                  {todaySessions.length === 0
                    ? 'Nothing planned — add a session!'
                    : `${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} planned`}
                </p>
              </div>
            </div>

            {todaySessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Calendar className="w-8 h-8 opacity-30" />
                <p className="text-sm">Free day!</p>
                <Button variant="outline" size="sm" onClick={handleOpenAdd}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Session
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {todaySessions.map((session, idx) => {
                    const cfg = COURSE_CONFIG[session.course]
                    const pc = PRIORITY_CONFIG[session.priority]
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => handleEditSession(session)}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg border border-white/5 cursor-pointer',
                          'transition-all hover:brightness-110',
                          cfg.bg,
                        )}
                      >
                        <div className={cn('w-1 self-stretch rounded-full shrink-0', cfg.solid)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">
                            {session.course}: {session.topic}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatTime(session.startHour, session.startMinute)} &middot;{' '}
                            {session.duration} min
                          </p>
                        </div>
                        <Badge
                          className={cn('border-0 text-[10px] px-1.5 py-0 shrink-0', pc.bg, pc.text)}
                        >
                          {pc.label}
                        </Badge>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Total today */}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5">
                  <span className="text-xs text-muted-foreground">Total today</span>
                  <span className="text-xs font-semibold tabular-nums">
                    {(todaySessions.reduce((s, x) => s + x.duration, 0) / 60).toFixed(1)}h
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Task List */}
          <div className="bg-white/[0.02] dark:bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-semibold flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-amber-500" />
                  Tasks
                </p>
                <p className="text-sm text-muted-foreground">
                  {completedTasksCount} of {tasks.length} completed
                </p>
              </div>
            </div>

            {/* Add Task Form */}
            <div className="flex gap-2 mb-3 p-1.5 rounded-lg bg-slate-800/30 border border-white/5">
              <Input
                placeholder="New task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask()
                }}
                className="flex-1 h-8 text-sm bg-slate-800/50 border-white/10"
              />
              <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                <SelectTrigger className="w-[100px] h-8 text-xs bg-slate-800/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_CONFIG[p].dot)} />
                        {PRIORITY_CONFIG[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add task</TooltipContent>
              </Tooltip>
            </div>

            <Separator className="mb-3 bg-white/5" />

            {/* Task List */}
            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
              <AnimatePresence>
                {tasks.map((task, i) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={i}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="w-7 h-7 opacity-30" />
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs">Add a task above to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Session Dialog */}
      {/* ================================================================ */}
      <SessionDialog
        key={dialogOpen ? (editingSession?.id ?? 'new') : 'closed'}
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) setEditingSession(null)
        }}
        session={editingSession}
        onSubmit={handleSessionSubmit}
        onDelete={handleDeleteSession}
      />
    </div>
  )
}
