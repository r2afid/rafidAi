"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  Target,
  Activity,
  Search,
  Send,
  Save,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  PenLine,
  Sparkles, ChevronDown, Lightbulb,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentDetailModal from "@/components/teacher/StudentDetailModal";


// ── Types ──────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  email: string;
  lastActive: string;
  quizAvg: number;
  engagementScore: number;
  status: "At Risk" | "Warning" | "OK";
}

type SortField = "name" | "email" | "lastActive" | "quizAvg" | "engagementScore" | "status";
type SortDirection = "asc" | "desc";

type Tone = "supportive" | "encouraging" | "formal";

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusBadge(status: Student["status"]) {
  switch (status) {
    case "At Risk":
      return <Badge className="bg-red-600 text-white hover:bg-red-600/90 border-transparent">At Risk</Badge>;
    case "Warning":
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90 border-transparent">Warning</Badge>;
    case "OK":
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90 border-transparent">OK</Badge>;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day ago`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  // Search & sort state for at-risk tracker
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("engagementScore");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Intervention builder state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("supportive");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  // Student detail state
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [detailStudentName, setDetailStudentName] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  // AI Class Summary
  const [classSummary, setClassSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // AI Risk Explanation — Sheet
  const [riskSheetOpen, setRiskSheetOpen] = useState(false);
  const [riskStudent, setRiskStudent] = useState<Student | null>(null);
  const [riskExplanation, setRiskExplanation] = useState<string | null>(null);
  const [riskExplaining, setRiskExplaining] = useState(false);

  // AI Topic Analysis
  const [topicAnalysis, setTopicAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/teacher/class-metrics').then(r => r.json()),
      fetch('/api/teacher/at-risk-students').then(r => r.json()),
    ])
      .then(([classRes, riskRes]) => {
        if (!classRes.error) setMetrics(classRes)
        if (!riskRes.error && riskRes.students) {
          setStudents(riskRes.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            lastActive: s.lastActive,
            quizAvg: s.quizAverage,
            engagementScore: s.engagementScore,
            status: s.status as Student["status"],
          })))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openIntervention = useCallback((student: Student) => {
    setSelectedStudent(student);
    setTone("supportive");
    setSubject(`Checking in — ${student.name}`);
    setMessage(
      `Hi ${student.name},\n\nI wanted to reach out and check in on your progress. Your quiz average is currently ${student.quizAvg}%. Let me know if you'd like to schedule a 1-on-1 session this week.\n\nBest regards,\nYour Instructor`
    );
    setSheetOpen(true);
  }, []);

  const openDetail = useCallback((student: Student) => {
    setDetailStudentId(student.id);
    setDetailStudentName(student.name);
    setDetailOpen(true);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField]
  );

  const handleGenerateAI = useCallback(async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/teacher/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selectedStudent.name,
          student_email: selectedStudent.email,
          quiz_average: selectedStudent.quizAvg,
          engagement_score: selectedStudent.engagementScore,
          days_since_active: Math.floor((Date.now() - new Date(selectedStudent.lastActive).getTime()) / (1000 * 60 * 60 * 24)),
          tone,
        }),
      })
      const data = await res.json()
      if (data.message) setMessage(data.message)
    } catch {
      // fallback to template on error
      setMessage(
        `Hi ${selectedStudent.name},\n\nI wanted to reach out and check in on your progress. Your quiz average is currently ${selectedStudent.quizAvg}%. Let me know if you'd like to schedule a 1-on-1 session.\n\nBest regards,\nYour Instructor`
      )
    }
    setIsGenerating(false);
  }, [selectedStudent, tone]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedStudent) return;
    setSending(true);
    // Save to intervention records
    try {
      await fetch('/api/teacher/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          subject,
          message,
          tone,
          status: 'sent',
        }),
      })
    } catch {}
    setSending(false);
    setSheetOpen(false);
  }, [selectedStudent, subject, message, tone]);

  const handleSaveDraft = useCallback(async () => {
    if (!selectedStudent) return;
    try {
      await fetch('/api/teacher/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          subject,
          message,
          tone,
          status: 'draft',
        }),
      })
    } catch {}
    setSheetOpen(false);
  }, [selectedStudent, subject, message, tone]);

  const handleToneChange = useCallback(
    (newTone: Tone) => {
      if (!selectedStudent) return;
      setTone(newTone);
    },
    [selectedStudent]
  );

  // ── Computed ─────────────────────────────────────────────────────────────

  const sortedStudents = useMemo(() => {
    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "lastActive":
          cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        case "quizAvg":
          cmp = a.quizAvg - b.quizAvg;
          break;
        case "engagementScore":
          cmp = a.engagementScore - b.engagementScore;
          break;
        case "status": {
          const order = { "At Risk": 0, Warning: 1, OK: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [search, sortField, sortDir, students]);

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const overview = metrics?.overview || { totalStudents: 0, avgCompletionRate: 0, avgQuizScore: 0, activeStudents: 0 }
  const recentActivity = metrics?.recentActivity || []
  const topicMetrics = metrics?.topicMetrics || []
  const scoreDist = metrics?.scoreDistribution || []

  const completionData = topicMetrics.map((t: any) => ({
    topic: t.topicName,
    completed: t.completed,
    inProgress: t.inProgress,
    pending: t.pending,
  }))

  const scoreDistribution = scoreDist.map((s: any) => ({
    range: s.range.includes('-') ? s.range + '%' : s.range,
    students: s.count,
  }))

  const activeStudents = overview.activeStudents

  // Categorize topics by completion rate
  const completedTopics = topicMetrics.filter((t: any) => t.total > 0 && (t.completed / t.total) >= 0.6)
  const strugglingTopics = topicMetrics.filter((t: any) => t.total > 0 && (t.completed / t.total) < 0.6)

  // ── AI: Class Summary ────────────────────────────────────────────────────

  const handleGenerateSummary = useCallback(async () => {
    if (classSummary) { setClassSummary(null); return }
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/teacher/class-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalStudents: overview.totalStudents,
          avgCompletionRate: overview.avgCompletionRate,
          avgQuizScore: overview.avgQuizScore,
          activeStudents: overview.activeStudents,
          scoreDistribution: scoreDist,
        }),
      })
      const data = await res.json()
      if (data.summary) setClassSummary(data.summary)
    } catch {}
    setSummaryLoading(false);
  }, [classSummary, overview, scoreDist]);

  // ── AI: Risk Explanation ─────────────────────────────────────────────────

  const handleExplainRisk = useCallback(async (student: Student) => {
    setRiskStudent(student);
    setRiskSheetOpen(true);
    setRiskExplanation(null);
    setRiskExplaining(true);
    try {
      const res = await fetch('/api/teacher/explain-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          quizAverage: student.quizAvg,
          engagementScore: student.engagementScore,
          daysSinceActive: Math.floor((Date.now() - new Date(student.lastActive).getTime()) / (1000 * 60 * 60 * 24)),
          status: student.status,
        }),
      })
      const data = await res.json()
      if (data.explanation) setRiskExplanation(data.explanation)
    } catch {}
    setRiskExplaining(false);
  }, []);

  // ── AI: Topic Analysis ───────────────────────────────────────────────────

  const handleTopicAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setTopicAnalysis(null);
    try {
      const res = await fetch('/api/teacher/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicMetrics,
          avgQuizScore: overview.avgQuizScore,
          avgCompletionRate: overview.avgCompletionRate,
        }),
      })
      const data = await res.json()
      if (data.analysis) setTopicAnalysis(data.analysis)
    } catch {}
    setAnalysisLoading(false);
  }, [topicMetrics, overview.avgQuizScore, overview.avgCompletionRate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor class performance, track at-risk students, and send interventions.
        </p>
      </div>

      {/* ── AI Class Summary ─────────────────────────────────────────────── */}
      <Collapsible
        open={classSummary !== null}
        onOpenChange={(open) => { if (!open) setClassSummary(null) }}
        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-500">AI Class Summary</span>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="gap-1.5 text-xs"
            >
              {summaryLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : classSummary ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {summaryLoading ? 'Generating...' : classSummary ? 'Hide' : 'Generate'}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <p className="text-sm text-foreground/80 leading-relaxed">{classSummary}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="size-4" />
            Class Overview
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="gap-1.5">
            <AlertTriangle className="size-4" />
            At-Risk Tracker
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════ Tab 1 – Class Overview ═══════════════════════ */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{overview.totalStudents}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                  <p className="text-xl font-bold">{overview.avgCompletionRate}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                  <Target className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
                  <p className="text-xl font-bold">{overview.avgQuizScore}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-xl font-bold">{activeStudents}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Course Completion Rates – Stacked Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Completion Rates</CardTitle>
                <CardDescription>Student progress across topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="topic" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="oklch(0.62 0.19 163)" name="Completed" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inProgress" stackId="a" fill="oklch(0.75 0.18 85)" name="In Progress" />
                      <Bar dataKey="pending" stackId="a" fill="oklch(0.88 0.06 70)" name="Pending" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Score Distribution</CardTitle>
                <CardDescription>Number of students per score range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Bar dataKey="students" fill="oklch(0.55 0.16 150)" radius={[4, 4, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest quiz completions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
                )}
                {recentActivity.slice(0, 5).map((a: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <BookOpen className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{a.studentName}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>
                        {a.topic && <span className="font-medium"> — {a.topic}</span>}
                        {a.score != null && (
                          <span className={a.score >= 80 ? 'text-emerald-500' : a.score >= 50 ? 'text-amber-500' : 'text-rose-500'}>
                            {' '}({Math.round(a.score)}%)
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {timeAgo(a.time)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── AI Topic Analysis ── */}
          <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="size-4 text-emerald-500" />
                  AI Topic Analysis
                </CardTitle>
                <CardDescription>Which topics are completed, where students struggle, and what needs attention</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTopicAnalysis}
                disabled={analysisLoading}
                className="gap-1.5 shrink-0"
              >
                {analysisLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {analysisLoading ? 'Analysing...' : 'Analyse'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Completed / On Track
                  </p>
                  {completedTopics.length > 0 ? completedTopics.map((t: any, i: number) => (
                    <div key={i} className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2 text-xs text-emerald-600/90">
                      <span className="font-medium">{t.topicName}</span>
                      <span className="text-emerald-500/70 ml-2">{Math.round((t.completed / t.total) * 100)}% done</span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">No topics at this threshold yet</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" />
                    Needs Attention
                  </p>
                  {strugglingTopics.length > 0 ? strugglingTopics.map((t: any, i: number) => (
                    <div key={i} className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] px-3 py-2 text-xs text-rose-600/90">
                      <span className="font-medium">{t.topicName}</span>
                      <span className="text-rose-500/70 ml-2">{t.pending} pending, {Math.round((t.completed / t.total) * 100)}% done</span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">All topics are on track</p>
                  )}
                </div>
              </div>

              {topicAnalysis && (
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground/60 flex items-center gap-1.5">
                    <Sparkles className="size-3" />
                    AI Insights
                  </p>
                  <div className="space-y-1.5">
                    {topicAnalysis
                      .split('\n')
                      .filter(l => l.trim().startsWith('-'))
                      .map((line, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                          <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                          <span className="leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════ Tab 2 – At-Risk Tracker ═══════════════════════ */}
        <TabsContent value="at-risk" className="space-y-4 pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {sortedStudents.length} student{sortedStudents.length !== 1 && "s"} found
            </p>
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("name")}
                    >
                      Student Name{sortArrow("name")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("email")}
                    >
                      Email{sortArrow("email")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("lastActive")}
                    >
                      Last Active{sortArrow("lastActive")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("quizAvg")}
                    >
                      Quiz Avg{sortArrow("quizAvg")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("engagementScore")}
                    >
                      Engagement{sortArrow("engagementScore")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("status")}
                    >
                      Status{sortArrow("status")}
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <button
                          onClick={() => openDetail(student)}
                          className="font-medium text-left hover:text-emerald-500 transition-colors underline-offset-2 hover:underline cursor-pointer"
                        >
                          {student.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>{formatDate(student.lastActive)}</TableCell>
                      <TableCell>{student.quizAvg}%</TableCell>
                      <TableCell>{student.engagementScore}</TableCell>
                      <TableCell>{statusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExplainRisk(student)}
                            className="gap-1 text-xs h-8 px-2"
                          >
                            <Sparkles className="size-3" />
                            AI
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openIntervention(student)}
                            className="gap-1.5"
                          >
                            <PenLine className="size-3.5" />
                            Draft
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* ═══════════════════════ Intervention Sheet ═══════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pr-6">
            <SheetTitle>Intervention Builder</SheetTitle>
            <SheetDescription>
              Compose a message for the selected student.
            </SheetDescription>
          </SheetHeader>

          {selectedStudent && (
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-6 pb-4">
                {/* Student metrics */}
                <Card>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                        {selectedStudent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{selectedStudent.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Quiz Avg</p>
                        <p className="text-sm font-bold">{selectedStudent.quizAvg}%</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-sm font-bold">{selectedStudent.engagementScore}</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Last Active</p>
                        <p className="text-sm font-bold">{formatDate(selectedStudent.lastActive)}</p>
                      </div>
                    </div>
                    <div className="text-center">{statusBadge(selectedStudent.status)}</div>
                  </CardContent>
                </Card>

                {/* Subject line */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject Line
                  </label>
                  <Input
                    id="subject"
                    placeholder="Message subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Tone selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Tone</label>
                  <Select value={tone} onValueChange={(v) => handleToneChange(v as Tone)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supportive">Supportive</SelectItem>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message textarea */}
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    className="min-h-[200px] resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isGenerating}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="gap-1.5"
                  >
                    {isGenerating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="size-3.5" />
                    )}
                    {isGenerating ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          <SheetFooter className="border-t px-4 py-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={sending} className="gap-1.5">
              <Save className="size-3.5" />
              {sending ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={handleSendMessage} disabled={sending} className="gap-1.5">
              <Send className="size-3.5" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════ Risk Explanation Sheet ═══════════════════════ */}
      <Sheet open={riskSheetOpen} onOpenChange={(open) => { setRiskSheetOpen(open); if (!open) setRiskStudent(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pr-6">
            <SheetTitle>Risk Explanation</SheetTitle>
            <SheetDescription>
              {riskStudent ? `AI analysis for ${riskStudent.name}` : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-4">
            {riskStudent && (
              <Card>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {riskStudent.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium">{riskStudent.name}</p>
                      <p className="text-sm text-muted-foreground">{riskStudent.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Quiz Avg</p>
                      <p className="text-sm font-bold">{riskStudent.quizAvg}%</p>
                    </div>
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="text-sm font-bold">{riskStudent.engagementScore}</p>
                    </div>
                    <div className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Last Active</p>
                      <p className="text-sm font-bold">{formatDate(riskStudent.lastActive)}</p>
                    </div>
                  </div>
                  <div className="text-center">{statusBadge(riskStudent.status)}</div>
                </CardContent>
              </Card>
            )}

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
              {riskExplaining ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating AI explanation...
                </div>
              ) : riskExplanation ? (
                <div className="space-y-1.5">
                  {riskExplanation
                    .split('\n')
                    .filter(l => l.trim().startsWith('-'))
                    .map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="text-rose-500 mt-0.5 shrink-0">•</span>
                        <span className="leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click AI to generate risk explanation.</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════ Student Detail Modal ═══════════════════════ */}
      <StudentDetailModal
        studentId={detailStudentId || ''}
        studentName={detailStudentName}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
