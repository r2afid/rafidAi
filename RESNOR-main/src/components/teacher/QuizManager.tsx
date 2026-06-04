"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Trash2,
  Loader2,
  Brain,
  Clock,
  BarChart3,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Calendar,
  Repeat,
  Sparkles,
  Eye,
  EyeOff,
  BookOpen,
  Wand2,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  timeLimit: number;
  maxAttempts: number;
  topic: { name: string };
  dueDate: string | null;
  questions: any[];
  _count: { attempts: number };
}

interface FormState {
  title: string;
  courseId: string;
  topic: string;
  difficulty: string;
  timeLimit: string;
  dueDate: string;
  maxAttempts: string;
  questions: QuizQuestion[];
}

const DIFFICULTIES = ["easy", "medium", "hard"];
const OPTION_LABELS = ["A", "B", "C", "D"];

interface CourseOption {
  id: string;
  name: string;
  code: string;
}

const DIFFICULTY_STYLES = {
  easy: {
    label: "Easy",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
    border: "border-l-emerald-400",
    icon: "text-emerald-500",
  },
  medium: {
    label: "Medium",
    dot: "bg-amber-500",
    badge: "bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/15",
    border: "border-l-amber-400",
    icon: "text-amber-500",
  },
  hard: {
    label: "Hard",
    dot: "bg-rose-500",
    badge: "bg-rose-500/8 text-rose-600 dark:text-rose-400 border-rose-500/15",
    border: "border-l-rose-400",
    icon: "text-rose-500",
  },
} as const;

function emptyQuestion(): QuizQuestion {
  return {
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "A",
    explanation: "",
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    courseId: "",
    topic: "",
    difficulty: "medium",
    timeLimit: "10",
    dueDate: "",
    maxAttempts: "3",
    questions: [emptyQuestion()],
  });

  const [generationMode, setGenerationMode] = useState<'manual' | 'ai'>('manual');
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiCourseId, setAiCourseId] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const fetchQuizzes = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/teacher/quizzes").then(r => r.json()),
      fetch("/api/teacher/courses").then(r => r.json()),
    ])
      .then(([quizRes, courseRes]) => {
        if (!quizRes.error) setQuizzes(quizRes.quizzes);
        if (!courseRes.error) setCourses(courseRes.courses ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const totalStats = {
    quizzes: quizzes.length,
    questions: quizzes.reduce((s, q) => s + (q.questions?.length || 0), 0),
    attempts: quizzes.reduce((s, q) => s + (q._count?.attempts || 0), 0),
  };

  const filteredQuizzes = quizzes.filter(q =>
    !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExplanation = (idx: number) => {
    setExpandedExplanations(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFormChange = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleQuestionChange = useCallback(
    (index: number, field: keyof QuizQuestion, value: string) => {
      setForm((prev) => {
        const questions = [...prev.questions];
        if (field === "options") return prev;
        (questions[index] as any)[field] = value;
        return { ...prev, questions };
      });
    },
    []
  );

  const handleOptionChange = useCallback(
    (qIndex: number, oIndex: number, value: string) => {
      setForm((prev) => {
        const questions = [...prev.questions];
        questions[qIndex] = {
          ...questions[qIndex],
          options: questions[qIndex].options.map((opt, i) =>
            i === oIndex ? value : opt
          ),
        };
        return { ...prev, questions };
      });
    },
    []
  );

  const addQuestion = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setForm((prev) => {
      if (prev.questions.length <= 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFeedback(null);
      try {
        const body = {
          title: form.title,
          courseId: form.courseId,
          topicId: form.topic,
          difficulty: form.difficulty,
          timeLimit: parseInt(form.timeLimit, 10) * 60,
          dueDate: form.dueDate || null,
          maxAttempts: parseInt(form.maxAttempts, 10) || 3,
          questions: form.questions.map((q) => ({
            question: q.questionText,
            optionA: q.options[0] || '',
            optionB: q.options[1] || '',
            optionC: q.options[2] || '',
            optionD: q.options[3] || '',
            correctKey: q.correctAnswer,
            explanation: q.explanation,
          })),
        };
        const res = await fetch("/api/teacher/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.error) {
          setFeedback({ type: 'success', text: `Quiz "${form.title}" created successfully!` });
          setForm({
            title: "",
            courseId: "",
            topic: "",
            difficulty: "medium",
            timeLimit: "10",
            dueDate: "",
            maxAttempts: "3",
            questions: [emptyQuestion()],
          });
          setShowForm(false);
          fetchQuizzes();
          setTimeout(() => setFeedback(null), 3000);
        } else {
          setFeedback({ type: 'error', text: data.error || 'Failed to create quiz' });
        }
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', text: 'Network error. Please try again.' });
      }
      setSubmitting(false);
    },
    [form, fetchQuizzes]
  );

  const handleDeleteQuiz = useCallback(async (quizId: string, quizTitle: string) => {
    try {
      const res = await fetch(`/api/teacher/quizzes?id=${quizId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        setFeedback({ type: 'success', text: `Quiz "${quizTitle}" deleted.` });
        fetchQuizzes();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete quiz' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error. Please try again.' });
    }
    setDeleteConfirmId(null);
  }, [fetchQuizzes]);

  const handleAiGenerate = useCallback(async () => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/teacher/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          difficulty: aiDifficulty,
          questionCount: aiQuestionCount,
          courseId: aiCourseId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.error) {
        setAiResult(data);
        setFeedback({ type: 'success', text: data.message || 'Quiz generated successfully!' });
        fetchQuizzes();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to generate quiz' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error. Please try again.' });
    }
    setAiGenerating(false);
  }, [aiTopic, aiDifficulty, aiQuestionCount, aiCourseId, fetchQuizzes]);

  const closeAiResult = useCallback(() => {
    setAiResult(null);
    setShowForm(false);
  }, []);

  if (loading) {
    return (
      <div className="h-full max-h-full overflow-hidden flex flex-col gap-5">
        <div className="shrink-0 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-44 rounded-md bg-muted/60 animate-pulse" />
            <div className="h-3.5 w-56 rounded-md bg-muted/40 animate-pulse" />
          </div>
          <div className="h-9 w-28 rounded-lg bg-muted/60 animate-pulse" />
        </div>
        <div className="shrink-0 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col">
      {/* ===== Top fixed strip ===== */}
      <div className="shrink-0 space-y-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/8">
                <Brain className="size-3.5 text-primary" />
              </span>
              Quiz Manager
            </h1>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Create, view, and manage quizzes for your students.
            </p>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className={cn(
              "gap-1.5 transition-all text-sm h-9",
              showForm && "bg-rose-500/8 text-rose-500 hover:bg-rose-500/15 border border-rose-500/15"
            )}
            variant={showForm ? "outline" : "default"}
            size="sm"
          >
            {showForm ? (
              <><X className="size-3.5" /> Cancel</>
            ) : (
              <><Plus className="size-3.5" /> New Quiz</>
            )}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="grid gap-3 sm:grid-cols-3"
        >
          {[
            { icon: Brain, label: "Quizzes", value: totalStats.quizzes, color: "text-violet-500 bg-violet-500/8" },
            { icon: FileQuestion, label: "Questions", value: totalStats.questions, color: "text-sky-500 bg-sky-500/8" },
            { icon: BarChart3, label: "Attempts", value: totalStats.attempts, color: "text-emerald-500 bg-emerald-500/8" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", stat.color)}>
                <stat.icon className="size-4" />
              </div>
              <div>
                <p className="text-lg font-semibold tabular-nums leading-none">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                'rounded-lg px-3.5 py-2.5 text-xs flex items-center gap-2 font-medium',
                feedback.type === 'success'
                  ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/12'
                  : 'bg-rose-500/8 text-rose-600 dark:text-rose-400 border border-rose-500/12'
              )}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="size-3.5 shrink-0" />
              ) : (
                <XCircle className="size-3.5 shrink-0" />
              )}
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Main content ===== */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.08 } } }}
        className="flex-1 overflow-hidden mt-5"
      >
        {showForm ? (
          /* ─── Split-column workspace ─── */
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ═══ LEFT: Global Settings Sidebar (span 4) ═══ */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-card/60 dark:backdrop-blur-sm dark:border-border/50 dark:shadow-2xl dark:rounded-2xl p-5 space-y-5">
                {/* iOS-style Segmented Control */}
                <div className="relative bg-slate-100 border border-slate-200 dark:bg-muted dark:border-border p-1 rounded-xl flex mb-5">
                  {([
                    { key: 'manual' as const, icon: MessageSquare, label: 'Manual' },
                    { key: 'ai' as const, icon: Wand2, label: 'AI Generate' },
                  ]).map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setGenerationMode(key); if (key !== 'ai') setAiResult(null); }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium relative transition-colors",
                        generationMode === key
                          ? "text-foreground"
                          : "text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                      )}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className={cn(
                          "size-3.5",
                          generationMode === key
                            ? (key === 'ai' ? "text-violet-500" : "text-primary")
                            : "text-muted-foreground/40"
                        )} />
                        {label}
                      </span>
                      {generationMode === key && (
                        <motion.div
                          layoutId="segmented-active"
                          className="absolute inset-0 rounded-lg bg-white text-slate-800 shadow-sm dark:bg-card dark:text-foreground dark:border dark:border-border"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Quiz Details Fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Title</label>
                    <Input
                      placeholder="Midterm Review Quiz"
                      value={form.title}
                      onChange={(e) => handleFormChange("title", e.target.value)}
                      required
                      className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Course</label>
                    <Select
                      value={form.courseId}
                      onValueChange={(v) => handleFormChange("courseId", v)}
                    >
                      <SelectTrigger className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                        <SelectValue placeholder="Select course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Topic</label>
                    <Input
                      placeholder="e.g. Algebra"
                      value={form.topic}
                      onChange={(e) => handleFormChange("topic", e.target.value)}
                      required
                      className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Difficulty</label>
                    <Select
                      value={form.difficulty}
                      onValueChange={(v) => handleFormChange("difficulty", v)}
                    >
                      <SelectTrigger className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d}>
                            <div className="flex items-center gap-2">
                              <span className={cn("size-1.5 rounded-full", DIFFICULTY_STYLES[d as keyof typeof DIFFICULTY_STYLES].dot)} />
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3.5" />
                        Time (min)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="10"
                        value={form.timeLimit}
                        onChange={(e) => handleFormChange("timeLimit", e.target.value)}
                        required
                        className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground flex items-center gap-1">
                        <Repeat className="size-3.5" />
                        Max Attempts
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="3"
                        value={form.maxAttempts}
                        onChange={(e) => handleFormChange("maxAttempts", e.target.value)}
                        required
                        className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => handleFormChange("dueDate", e.target.value)}
                      className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Dynamic Action Workspace (span 8) ═══ */}
            <div className="lg:col-span-8">
              {/* ── MANUAL MODE ── */}
              {generationMode === 'manual' && (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-card/60 dark:backdrop-blur-sm dark:border-border/50 dark:shadow-2xl dark:rounded-2xl p-5 flex flex-col h-full"
                >
                  {/* Questions header */}
                  <div className="shrink-0 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-semibold text-slate-800 dark:text-foreground">Questions</span>
                      <span className="text-xs text-muted-foreground/50">
                        ({form.questions.length})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addQuestion}
                      className="gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Add Question
                    </Button>
                  </div>

                  {/* Scrollable questions */}
                  <div className="flex-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-subtle min-h-0 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {form.questions.map((q, qIndex) => (
                        <motion.div
                          key={qIndex}
                          layout
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="rounded-xl border border-border/60 bg-card dark:bg-card/40 dark:border-border/30 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
                              <div className="flex items-center gap-2.5">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                                  {qIndex + 1}
                                </span>
                                <span className="text-sm font-medium">Question {qIndex + 1}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleExplanation(qIndex)}
                                  className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                    expandedExplanations[qIndex]
                                      ? "bg-amber-500/10 text-amber-600"
                                      : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
                                  )}
                                >
                                  {expandedExplanations[qIndex] ? (
                                    <EyeOff className="size-3" />
                                  ) : (
                                    <Eye className="size-3" />
                                  )}
                                  {expandedExplanations[qIndex] ? "Hide" : "Explain"}
                                </button>
                                {form.questions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                  >
                                    <Trash2 className="size-3" />
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 space-y-4">
                              <Textarea
                                placeholder="Write your question here..."
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                                required
                                className="min-h-[72px] text-sm leading-relaxed resize-none rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                              />

                              <div className="grid gap-2 sm:grid-cols-2">
                                {OPTION_LABELS.map((label, oIndex) => {
                                  const isCorrect = q.correctAnswer === label;
                                  return (
                                    <label
                                      key={label}
                                      className={cn(
                                        "flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all",
                                        isCorrect
                                          ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                                          : "border-border/60 hover:border-muted-foreground/20 bg-card"
                                      )}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleQuestionChange(qIndex, "correctAnswer", label)}
                                        className={cn(
                                          "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all mt-0.5",
                                          isCorrect
                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                            : "bg-muted text-muted-foreground/60 border border-border/60"
                                        )}
                                      >
                                        {label}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <Input
                                          placeholder={`Enter option ${label}`}
                                          value={q.options[oIndex] || ""}
                                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                          required
                                          className={cn(
                                            "border-0 bg-transparent p-0 h-auto text-sm",
                                            "placeholder:text-muted-foreground/30",
                                            "focus-visible:ring-0",
                                            isCorrect && "text-emerald-700 dark:text-emerald-300"
                                          )}
                                        />
                                        {isCorrect && (
                                          <span className="text-[10px] text-emerald-500 mt-0.5 block font-medium">
                                            Correct answer
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Explanation */}
                              <AnimatePresence>
                                {expandedExplanations[qIndex] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/20 p-3">
                                      <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                                        <BookOpen className="size-3" />
                                        Explanation
                                      </label>
                                      <Textarea
                                        placeholder="Explain why the correct answer is right — students will see this after answering."
                                        value={q.explanation}
                                        onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)}
                                        className="min-h-[48px] text-sm rounded-xl px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addQuestion}
                      className="w-full gap-1.5 border-dashed text-sm h-10"
                    >
                      <Plus className="size-4" />
                      Add Another Question
                    </Button>
                  </div>

                  {/* Sticky footer */}
                  <div className="shrink-0 pt-4 mt-4 border-t border-border/20 flex items-center gap-3">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="gap-2 min-w-[150px]"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {submitting ? "Creating..." : "Create Quiz"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* ── AI GENERATE MODE ── */}
              {generationMode === 'ai' && (
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-card/60 dark:backdrop-blur-sm dark:border-border/50 dark:shadow-2xl dark:rounded-2xl p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="shrink-0 flex items-center gap-3 mb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-violet-500/10">
                      <Wand2 className="size-3.5 text-violet-500" />
                    </span>
                    <h2 className="text-base font-semibold text-slate-800 dark:text-foreground">AI Generate Quiz</h2>
                  </div>

                  {/* Scrollable params */}
                  <div className="flex-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-subtle min-h-0 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Course</label>
                        <Select
                          value={aiCourseId}
                          onValueChange={setAiCourseId}
                        >
                          <SelectTrigger className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                            <SelectValue placeholder="Select course (optional)..." />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                          Topic <span className="text-rose-400">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Machine Learning, React Hooks..."
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Difficulty</label>
                        <Select
                          value={aiDifficulty}
                          onValueChange={setAiDifficulty}
                        >
                          <SelectTrigger className="rounded-xl px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map((d) => (
                              <SelectItem key={d} value={d}>
                                <div className="flex items-center gap-2">
                                  <span className={cn("size-1.5 rounded-full", DIFFICULTY_STYLES[d as keyof typeof DIFFICULTY_STYLES].dot)} />
                                  {d.charAt(0).toUpperCase() + d.slice(1)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                          <SlidersHorizontal className="size-3.5" />
                          Questions: <span className="font-semibold text-foreground/80">{aiQuestionCount}</span>
                        </label>
                        <div className="pt-1.5">
                          <input
                            type="range"
                            min={3}
                            max={15}
                            value={aiQuestionCount}
                            onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                            className="w-full h-1.5 appearance-none rounded-full bg-muted accent-violet-500 cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-violet-500/20"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1 px-0.5">
                            <span>3</span>
                            <span>15</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Result */}
                    <AnimatePresence>
                      {aiResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                  {aiResult.quiz?.title || "Quiz Generated"}
                                </p>
                                <p className="text-[11px] text-emerald-600/60 dark:text-emerald-400/60">
                                  {aiResult.quiz?.questions?.length || 0} questions · ready to use
                                </p>
                              </div>
                            </div>
                          </div>
                          {aiResult.usedFallback && (
                            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 flex items-center gap-2">
                              <Brain className="size-3.5 shrink-0" />
                              {aiResult.message}
                            </p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="default" onClick={closeAiResult}>
                              Done
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setAiTopic(""); setAiResult(null); }}
                            >
                              Generate Another
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Sticky footer */}
                  <div className="shrink-0 pt-4 mt-4 border-t border-border/20 flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={aiGenerating || !aiTopic.trim()}
                      className="gap-2 min-w-[180px] bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── Quiz list view ─── */
          <motion.div
            variants={{ ...fadeUp, hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
            className="h-full overflow-y-auto scrollbar-thin space-y-5"
          >
            {/* Search */}
            {quizzes.length > 0 && (
              <motion.div variants={fadeUp}>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <Input
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs rounded-xl px-3.5 py-2 pl-8 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:bg-muted/10 dark:border-border dark:text-foreground placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-2 dark:focus:ring-emerald-500/10 dark:focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Quiz Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.length === 0 && !loading && (
                <motion.div variants={fadeUp} className="sm:col-span-2 lg:col-span-3">
                  <div className="flex flex-col items-center justify-center py-14 text-center rounded-xl border border-dashed border-border/50">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 mb-3">
                      <Brain className="size-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/70">
                      {searchQuery ? "No quizzes match your search" : "No quizzes yet"}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {searchQuery
                        ? "Try a different search term."
                        : "Click \"New Quiz\" to create your first quiz."
                      }
                    </p>
                  </div>
                </motion.div>
              )}

              {filteredQuizzes.map((quiz) => {
                const diff = quiz.difficulty as keyof typeof DIFFICULTY_STYLES;
                const ds = DIFFICULTY_STYLES[diff] || DIFFICULTY_STYLES.medium;
                const totalQ = quiz.questions?.length ?? 0;
                const totalA = quiz._count?.attempts ?? 0;
                return (
                  <motion.div key={quiz.id} variants={fadeUp} layout>
                    <div className={cn(
                      "group relative rounded-lg border border-border/60 bg-card transition-all duration-150 hover:shadow-sm hover:border-border/80",
                      ds.border
                    )}>
                      <div className="p-3.5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold leading-snug truncate">
                              {quiz.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] text-muted-foreground/60 truncate">
                                {quiz.topic?.name || "General"}
                              </span>
                              <span className="text-[9px] text-muted-foreground/30">·</span>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] px-1.5 py-0 h-4 font-normal", ds.badge)}
                              >
                                <span className={cn("size-1 rounded-full mr-1 inline-block", ds.dot)} />
                                {ds.label}
                              </Badge>
                            </div>
                          </div>
                          <AnimatePresence mode="wait">
                            {deleteConfirmId === quiz.id ? (
                              <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-1 shrink-0"
                              >
                                <button
                                  onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                                  className="text-[10px] font-medium text-emerald-600 hover:text-emerald-500 px-1.5 py-0.5"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 px-1.5 py-0.5"
                                >
                                  Cancel
                                </button>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="delete"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setDeleteConfirmId(quiz.id)}
                                className="text-muted-foreground/30 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <Trash2 className="size-3" />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground/50">
                          <span className="flex items-center gap-1">
                            <FileQuestion className="size-3" />
                            {totalQ}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {quiz.timeLimit}m
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="size-3" />
                            {totalA}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="size-3" />
                            {quiz.maxAttempts ?? 3}
                          </span>
                          {quiz.dueDate && (
                            <span className="flex items-center gap-1 text-amber-500/70">
                              <Calendar className="size-3" />
                              {new Date(quiz.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
