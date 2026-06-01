"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Loader2,
  Sparkles,
  Flame,
  Target,
  BarChart3,
  BrainCircuit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth";

// ── Types ──

interface FeatureTime {
  pageId: string;
  label: string;
  icon: string;
  activeSeconds: number;
  passiveSeconds: number;
  totalSeconds: number;
  activePercent: number;
}

interface DailyTotal {
  date: string;
  label: string;
  total: number;
  active: number;
  passive: number;
}

interface ScreenTimeData {
  today: {
    totalSeconds: number;
    activeSeconds: number;
    passiveSeconds: number;
    activePercent: number;
    display: string;
  };
  features: FeatureTime[];
  dailyTotals: DailyTotal[];
  insight: {
    type: "warning" | "tip";
    message: string;
    feature: string;
  };
}

interface AiInsight {
  type: "warning" | "tip";
  message: string;
  suggestion: string;
  feature: string;
}

// ── Helpers ──

function secToDisplay(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

function getEngagementStatus(activePercent: number, totalSeconds: number) {
  if (totalSeconds === 0) return { emoji: "🌱", label: "Not Started", color: "text-muted-foreground", desc: "Start studying to track your engagement." };
  if (activePercent >= 60 && totalSeconds >= 3600) return { emoji: "🔥", label: "Great Progress", color: "text-emerald-600", desc: "You're actively learning — excellent focus!" };
  if (activePercent >= 60) return { emoji: "💪", label: "Strong Start", color: "text-emerald-600", desc: "High engagement so far — build on it!" };
  if (activePercent >= 35) return { emoji: "📈", label: "Getting There", color: "text-amber-600", desc: "Decent activity — try interacting more with your study tools." };
  return { emoji: "💭", label: "Mostly Passive", color: "text-red-600", desc: "Your time is mostly passive. Engage more to boost learning!" };
}

const GOAL_SECONDS = 6 * 3600;

const FEATURE_ICONS: Record<string, string> = {
  quiz: "🧠",
  tutor: "🤖",
  notes: "📝",
  resources: "📁",
  planner: "📅",
  gamification: "🏆",
  leaderboard: "👥",
  forum: "💬",
  "explain-mistake": "🔍",
  wellbeing: "🛡️",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const;

// ── Sub-components ──

function StatusBanner({ activePercent, totalSeconds }: { activePercent: number; totalSeconds: number }) {
  const status = getEngagementStatus(activePercent, totalSeconds);

  const themeColor =
    activePercent >= 55 ? "emerald" :
    activePercent >= 25 ? "amber" : "red";

  const bgGrad =
    themeColor === "emerald" ? "linear-gradient(135deg, #0f172a, #1e293b, #064e3b)" :
    themeColor === "amber" ? "linear-gradient(135deg, #0f172a, #1e293b, #422006)" :
    "linear-gradient(135deg, #0f172a, #1e293b, #3b0a0a)";

  const orbColor =
    themeColor === "emerald" ? "rgba(16,185,129,0.15)" :
    themeColor === "amber" ? "rgba(245,158,11,0.15)" :
    "rgba(239,68,68,0.15)";

  const orbColor2 =
    themeColor === "emerald" ? "rgba(20,184,166,0.12)" :
    themeColor === "amber" ? "rgba(250,204,21,0.12)" :
    "rgba(248,113,113,0.12)";

  const accentColor =
    themeColor === "emerald" ? "#10b981" :
    themeColor === "amber" ? "#f59e0b" : "#ef4444";

  const particleColor =
    themeColor === "emerald" ? "bg-emerald-300/30" :
    themeColor === "amber" ? "bg-amber-300/30" :
    "bg-red-300/30";

  return (
    <motion.div variants={itemVariants}>
      <motion.div
        className="relative overflow-hidden rounded-2xl p-5 md:p-6 text-white shadow-lg"
        style={{ backgroundImage: bgGrad, backgroundSize: "200% 200%" }}
        animate={{ backgroundPosition: ["0% 0%", "50% 50%", "100% 100%", "50% 0%", "0% 0%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        {/* Animated orbs */}
        <motion.div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl"
          style={{ backgroundColor: orbColor }}
          animate={{ scale: [1, 1.5, 0.9, 1.3, 1], opacity: [0.3, 0.6, 0.2, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full blur-3xl"
          style={{ backgroundColor: orbColor2 }}
          animate={{ scale: [1, 1.4, 0.8, 1.2, 1], opacity: [0.2, 0.5, 0.1, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Floating shape */}
        <motion.div
          className="absolute top-4 right-12 w-14 h-14 bg-white/6 rounded-2xl border border-white/10"
          animate={{ rotate: [12, 30, 5, 20, 12], y: [0, -8, 4, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shimmer line */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accentColor}88, transparent)` }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1.5 h-1.5 ${particleColor} rounded-full`}
            animate={{
              x: [0, (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 12), 0],
              y: [0, -15 - (i % 4) * 8, 0],
              opacity: [0, 0.7, 0],
            }}
            transition={{ duration: 2 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            style={{ top: `${8 + i * 11}%`, left: `${5 + (i % 6) * 15}%` }}
          />
        ))}

        {/* Dot grid overlay */}
        <motion.div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
          animate={{ opacity: [0.02, 0.04, 0.02] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-md border border-white/10 shadow-sm shrink-0"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <span className="text-2xl">{status.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg font-bold">{status.label}</span>
              {totalSeconds > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10"
                  style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                >
                  {activePercent}% Active
                </span>
              )}
            </div>
            <p className="text-sm text-white/70 mt-0.5">{status.desc}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickStatsRow({
  todayTotal,
  dailyTotals,
  features,
}: {
  todayTotal: number;
  dailyTotals: DailyTotal[];
  features: FeatureTime[];
}) {
  const weekTotal = dailyTotals.reduce((s, d) => s + d.total, 0);
  const daysWithData = dailyTotals.filter((d) => d.total > 0).length;
  const avgDaily = daysWithData > 0 ? Math.round(weekTotal / daysWithData) : 0;
  const bestDay = dailyTotals.reduce((best, d) => (d.total > (best?.total ?? 0) ? d : best), dailyTotals[0]);
  const bestLabel = bestDay ? `${bestDay.label} ${secToDisplay(bestDay.total)}` : "--";

  const stats = [
    { icon: Clock, label: "Week Total", value: secToDisplay(weekTotal), color: "text-blue-600", bg: "from-blue-500/10" },
    { icon: Target, label: "Daily Avg", value: secToDisplay(avgDaily), color: "text-violet-600", bg: "from-violet-500/10" },
    { icon: Flame, label: "Best Day", value: bestLabel, color: "text-orange-600", bg: "from-orange-500/10" },
    { icon: BarChart3, label: "Features Used", value: `${features.length}`, color: "text-teal-600", bg: "from-teal-500/10" },
  ];

  return (
    <motion.div variants={itemVariants}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${stat.bg} to-transparent shrink-0`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              <p className="text-sm font-bold tabular-nums truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DailyGoal({ totalSeconds }: { totalSeconds: number }) {
  const pct = Math.min((totalSeconds / GOAL_SECONDS) * 100, 100);
  const [displayPct, setDisplayPct] = useState(0);
  const prevPctRef = useRef(0);
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference - (pct / 100) * circumference;

  useEffect(() => {
    const from = prevPctRef.current;
    const to = pct;
    prevPctRef.current = to;
    const duration = 1200;
    let startTime: number | null = null;
    let frame: number;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-2 py-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative">
        <svg width="112" height="112" viewBox="0 0 112 112">
          <defs>
            <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="goalGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle cx="56" cy="56" r={r} fill="none" stroke="oklch(0.92 0 0)" strokeWidth="8" />

          {/* Progress arc */}
          <motion.circle
            cx="56" cy="56" r={r}
            fill="none"
            stroke="url(#goalGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            transform="rotate(-90 56 56)"
          />

          {/* Pulsing glow ring behind the progress */}
          <motion.circle
            cx="56" cy="56" r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={targetOffset}
            transform="rotate(-90 56 56)"
            opacity="0.15"
            filter="url(#goalGlow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.1] }}
            transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Spinning dot at the end of the arc */}
          {pct > 3 && (
            <motion.circle
              cx="56" cy="56" r={r}
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="2 1000"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: targetOffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              transform="rotate(-90 56 56)"
            />
          )}
        </svg>

        {/* Percentage in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold tabular-nums"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {displayPct}%
          </motion.span>
          <motion.span
            className="text-[9px] text-muted-foreground mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            done
          </motion.span>
        </div>
      </div>
      <motion.p
        className="text-[11px] text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        of {secToDisplay(GOAL_SECONDS)} goal
      </motion.p>
    </motion.div>
  );
}

function MiniRing({ pct, size = 28 }: { pct: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.9 0 0)" strokeWidth="3" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={pct >= 55 ? "#10b981" : pct >= 25 ? "#f59e0b" : "#ef4444"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function FeatureBar({ feature, maxSeconds, index }: { feature: FeatureTime; maxSeconds: number; index: number }) {
  const width = maxSeconds > 0 ? (feature.totalSeconds / maxSeconds) * 100 : 0;
  const activeWidth = feature.totalSeconds > 0 ? (feature.activeSeconds / feature.totalSeconds) * 100 : 0;
  const delay = 0.1 * index;

  const barColor =
    feature.activePercent >= 55 ? "#10b981" :
    feature.activePercent >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group cursor-pointer">
          <div className="flex items-center gap-4">

            {/* Mini ring */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 w-10">
              <MiniRing pct={feature.activePercent} />
              <span className="text-[8px] font-semibold leading-none" style={{ color: barColor }}>
                {feature.activePercent}%
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{FEATURE_ICONS[feature.pageId] || "📌"}</span>
                <span className="text-sm font-medium truncate">{feature.label}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {secToDisplay(feature.activeSeconds)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  {secToDisplay(feature.passiveSeconds)}
                </span>
              </div>
            </div>

            {/* Tall bar */}
            <div className="w-28 sm:w-36 md:w-44 shrink-0">
              <div className="relative h-8 w-full rounded-lg overflow-hidden bg-gradient-to-r from-red-500/20 to-red-500/10 shadow-inner">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-l-lg"
                  initial={{ width: "0%" }}
                  animate={{ width: `${activeWidth}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay }}
                  style={{ background: `linear-gradient(to right, ${barColor}, ${barColor}dd)` }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-l-lg bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${activeWidth}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay }}
                />
                <div
                  className="absolute inset-y-0 right-0 rounded-r-lg bg-muted-foreground/[0.06]"
                  style={{ left: `${width}%` }}
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/[0.06] group-hover:ring-2 group-hover:ring-emerald-500/25 transition-all" />
                <div className="absolute inset-y-0 left-0 w-1/3 rounded-lg bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-[300%] transition-all duration-700 ease-in-out pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="w-[240px] p-0 overflow-hidden">
        <div className="relative">
          {/* Accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: barColor }} />

          <div className="py-3 pl-4 pr-3.5 space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <span>{FEATURE_ICONS[feature.pageId] || "📌"}</span>
                {feature.label}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: barColor }}
              >
                {feature.activePercent}%
              </span>
            </div>

            {/* Mini stacked bar */}
            <div className="relative h-2 w-full rounded-full overflow-hidden bg-red-500/20">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${activeWidth}%`,
                  background: `linear-gradient(to right, ${barColor}, ${barColor}dd)`,
                }}
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground">Active</span>
              </div>
              <span className="text-emerald-600 font-semibold text-right tabular-nums">
                {secToDisplay(feature.activeSeconds)}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0" />
                <span className="text-muted-foreground">Passive</span>
              </div>
              <span className="text-red-500 font-semibold text-right tabular-nums">
                {secToDisplay(feature.passiveSeconds)}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-muted-foreground">Total</span>
              </div>
              <span className="font-semibold text-right tabular-nums">
                {secToDisplay(feature.totalSeconds)}
              </span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function TrendChart({ dailyTotals }: { dailyTotals: DailyTotal[] }) {
  if (dailyTotals.length === 0) return null;

  const maxTotal = Math.max(...dailyTotals.map((d) => d.total), 1);
  const avgTotal = Math.round(dailyTotals.reduce((s, d) => s + d.total, 0) / dailyTotals.length);
  const activeDays = dailyTotals.filter((d) => d.total > 0).length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Daily Average", value: secToDisplay(avgTotal), color: "text-foreground" },
          { label: "Peak Day", value: secToDisplay(maxTotal), color: "text-emerald-600" },
          { label: "Active Days", value: `${activeDays}/7`, color: "text-foreground" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card py-2.5 px-3 text-center">
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-48">
        {dailyTotals.map((d, i) => {
          const isToday = i === dailyTotals.length - 1;
          const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
          const activePct = d.total > 0 ? (d.active / d.total) * 100 : 0;
          const passivePct = d.total > 0 ? (d.passive / d.total) * 100 : 0;

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full group cursor-pointer">
                  {/* Value label */}
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground group-hover:text-foreground transition-colors">
                    {secToDisplay(d.total)}
                  </span>

                  {/* Stacked bar */}
                  <div className="w-full flex-1 rounded-md relative overflow-hidden bg-muted-foreground/10">
                    {/* Passive top segment */}
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md bg-red-500/25 transition-all duration-300 group-hover:bg-red-500/35"
                      style={{ height: `${passivePct}%` }}
                    />
                    {/* Active bottom segment */}
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-b-md bg-emerald-500 transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${activePct}%` }}
                    />
                    {/* Today highlight ring */}
                    {isToday && (
                      <div className="absolute inset-0 rounded-md ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-background" />
                    )}
                  </div>

                  {/* Day label */}
                  <span className={`text-[9px] ${isToday ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                    {d.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{d.date}</p>
                <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">Active: {secToDisplay(d.active)}</p>
                <p className="text-red-500">Passive: {secToDisplay(d.passive)}</p>
                <p className="text-muted-foreground border-t pt-0.5 mt-0.5">Total: {secToDisplay(d.total)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500/40" /> Passive
        </span>
      </div>
    </div>
  );
}

function InsightCard({ insight, loading }: { insight: ScreenTimeData["insight"] | AiInsight; loading?: boolean }) {
  const isWarning = insight.type === "warning";
  const accent = isWarning ? "#ef4444" : "#10b981";

  // Check if this is an AI insight (has suggestion field)
  const isAi = "suggestion" in insight;

  return (
    <motion.div variants={itemVariants}>
      <motion.div
        className="relative overflow-hidden rounded-2xl border shadow-sm"
        style={{ boxShadow: `0 1px 6px ${accent}0a` }}
        whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      >
        {/* Shimmer loading overlay */}
        {loading && (
          <motion.div
            className="absolute inset-0 z-20"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}0d, transparent)` }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br"
          style={{ backgroundImage: `linear-gradient(135deg, ${accent}08, transparent 60%)` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top accent bar with glow */}
        <div className="relative h-1" style={{ backgroundColor: accent }}>
          <motion.div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to right, transparent, ${accent}88, transparent)` }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Content */}
        <div className="relative px-5 py-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {/* Animated icon */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md border"
                style={{
                  backgroundColor: `${accent}18`,
                  borderColor: `${accent}25`,
                }}
              >
                {isWarning ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <AlertTriangle className="h-4 w-4" style={{ color: accent }} />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Lightbulb className="h-4 w-4" style={{ color: accent }} />
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: accent }}>
                  {isWarning ? "Passive Sink" : "Tip"}
                </span>
                {insight.feature && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {insight.feature}
                  </span>
                )}
                {isAi && (
                  <Sparkles className="h-3 w-3 text-muted-foreground/40" />
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2.5">
            {/* Coach message */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: `${accent}08` }}>
              <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${accent}15` }}>
                <span className="text-xs" role="img" aria-label="coach">🎯</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.message}
              </p>
            </div>

            {/* AI suggestion (only shown if available) */}
            {isAi && (insight as AiInsight).suggestion && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: `${accent}08` }}>
                <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${accent}15` }}>
                  <span className="text-xs" role="img" aria-label="suggestion">💡</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {(insight as AiInsight).suggestion}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-xl bg-muted/60" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-40 rounded-xl bg-muted/60" />
        <div className="md:col-span-3 h-40 rounded-xl bg-muted/60" />
      </div>
      <div className="h-64 rounded-xl bg-muted/60" />
      <div className="h-64 rounded-xl bg-muted/60" />
    </div>
  );
}

// ── Main Component ──

export default function EngagementTracker() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<ScreenTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const tz = -new Date().getTimezoneOffset()
    fetch(`/api/engagement/screen-time?student_id=${user.id}&tz=${tz}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        setData(json);
        if (json) {
          setAiLoading(true);
          fetch('/api/engagement/ai-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              features: json.features,
              dailyTotals: json.dailyTotals,
              todayActivePercent: json.today.activePercent,
              todayTotal: json.today.totalSeconds,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((ai) => setAiInsight(ai))
            .catch(() => {})
            .finally(() => setAiLoading(false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Activity className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-base font-semibold">No screen time data yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Start using the app and your time breakdown will appear here.
        </p>
      </motion.div>
    );
  }

  const { today, features, dailyTotals, insight } = data;
  const maxFeatureSec = Math.max(...features.map((f) => f.totalSeconds), 1);

  return (
    <TooltipProvider>
      <motion.div
        className="space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Status Banner */}
        <StatusBanner activePercent={today.activePercent} totalSeconds={today.totalSeconds} />

        {/* Quick Stats Row */}
        <QuickStatsRow todayTotal={today.totalSeconds} dailyTotals={dailyTotals} features={features} />

        {/* Today's Summary */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-1">
              <CardContent className="pt-6 pb-4">
                <DailyGoal totalSeconds={today.totalSeconds} />
              </CardContent>
            </Card>

            <Card className="md:col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                      <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{today.display}</CardTitle>
                      <CardDescription>Total study time today</CardDescription>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className={`text-xs cursor-help ${
                          today.activePercent >= 55
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : today.activePercent >= 25
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        }`}
                      >
                        {today.activePercent}% Active
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                      <p>Percentage of study time spent actively engaging with content.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help space-y-0.5">
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{secToDisplay(today.activeSeconds)}</p>
                        <p className="text-[11px] text-muted-foreground">Active</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                      <p><strong>Active study time</strong> — time spent engaging with content: answering quizzes, writing notes, solving problems, or interacting with study tools (≥3 interactions with tab focused).</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help space-y-0.5">
                        <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{secToDisplay(today.passiveSeconds)}</p>
                        <p className="text-[11px] text-muted-foreground">Passive</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                      <p><strong>Passive study time</strong> — time spent browsing or idle on study pages without meaningful interaction (fewer than 3 interactions or tab not focused).</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold text-muted-foreground tabular-nums">{features.length}</p>
                    <p className="text-[11px] text-muted-foreground">Features Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Per-Feature Breakdown */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10">
                  <BrainCircuit className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <CardTitle>Study Time by Feature</CardTitle>
                  <CardDescription>Each ring shows your active % — hover bar for details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No feature usage recorded today.</p>
              ) : (
                features.map((feature, i) => (
                  <FeatureBar key={feature.pageId} feature={feature} maxSeconds={maxFeatureSec} index={i} />
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 7-Day Trend */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>7-Day Trend</CardTitle>
                  <CardDescription>Daily active vs passive time — green is active, red is passive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dailyTotals.some((d) => d.total > 0) ? (
                <TrendChart dailyTotals={dailyTotals} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Not enough data yet. Start studying!</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insight */}
        <InsightCard
          insight={aiInsight || insight}
          loading={aiLoading}
        />

      </motion.div>
    </TooltipProvider>
  );
}
