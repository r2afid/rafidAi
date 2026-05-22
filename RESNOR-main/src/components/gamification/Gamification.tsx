"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Zap, Crown, BookOpen, Gem, Target, ChevronLeft, ChevronRight, Info, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth";

// --- Mock Data ---

function xpForLevel(lv: number) {
  return 500 * lv * (lv - 1) / 2
}

interface BadgeData {
  name: string;
  icon: string;
  description: string;
  category: string;
  earned: boolean;
  earnedAt: string | null;
  progressDetail: string;
}

const LEVEL_COLORS = [
  { primary: '#14b8a6', dark: '#0d9488', light: '#5eead4', rgb: '20,184,166', grad: '135deg,#14b8a6,#0d9488' },   // 1 Teal
  { primary: '#0ea5e9', dark: '#0284c7', light: '#7dd3fc', rgb: '14,165,233', grad: '135deg,#0ea5e9,#1d4ed8' },    // 2 Sky
  { primary: '#f59e0b', dark: '#d97706', light: '#fcd34d', rgb: '245,158,11', grad: '135deg,#f59e0b,#ea580c' },     // 3 Amber
  { primary: '#10b981', dark: '#059669', light: '#6ee7b7', rgb: '16,185,129', grad: '135deg,#10b981,#059669' },     // 4 Emerald
  { primary: '#a855f7', dark: '#7c3aed', light: '#d8b4fe', rgb: '168,85,247', grad: '135deg,#a855f7,#6d28d9' },     // 5 Purple
  { primary: '#f43f5e', dark: '#e11d48', light: '#fda4af', rgb: '244,63,94', grad: '135deg,#f43f5e,#be123c' },      // 6 Rose
  { primary: '#6366f1', dark: '#4f46e5', light: '#a5b4fc', rgb: '99,102,241', grad: '135deg,#6366f1,#4338ca' },     // 7 Indigo
  { primary: '#ec4899', dark: '#db2777', light: '#f9a8d4', rgb: '236,72,153', grad: '135deg,#ec4899,#be185d' },     // 8 Pink
  { primary: '#8b5cf6', dark: '#6d28d9', light: '#c4b5fd', rgb: '139,92,246', grad: '135deg,#8b5cf6,#4c1d95' },     // 9 Violet
]

const LEVEL_MILESTONES = [
  { level: 5, label: "5" },
  { level: 10, label: "10" },
  { level: 15, label: "15" },
];

// --- Components ---

function StreakCalendar({ days, year, month }: { days: { date: string; active: boolean }[]; year: number; month: number }) {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const dayMap = new Map(days.map((d) => [d.date, d.active]));

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-0.5">
        {dayLabels.map((label, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const active = dayMap.get(dateStr) ?? false;
          const isToday = new Date().toISOString().split("T")[0] === dateStr;
          return (
            <Tooltip key={dateStr}>
              <TooltipTrigger asChild>
                <div className="h-8 flex items-center justify-center">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-medium transition-all ${
                      active ? "" : "bg-muted text-muted-foreground/60"
                    }`}
                    style={active ? {
                      backgroundColor: `rgba(var(--tc-rgb),0.8)`,
                      color: 'white',
                      boxShadow: isToday
                        ? `0 0 0 2px rgba(var(--tc-rgb),0.5), 0 0 6px rgba(var(--tc-rgb),0.3)`
                        : `0 0 6px rgba(var(--tc-rgb),0.3)`,
                    } : isToday ? {
                      boxShadow: `0 0 0 2px rgba(var(--tc-rgb),0.3)`,
                    } : undefined}
                  >
                    {day}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                <p className="text-[10px]">{active ? "Studied" : "No study"}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function LevelProgressBar({ level, levelName, xpInLevel, xpRange, percentage, nextLevel }: {
  level: number
  levelName: string
  xpInLevel: number
  xpRange: number
  percentage: number
  nextLevel: number
}) {

  const [showLevelList, setShowLevelList] = useState(false);

  // Animated XP counter
  const [displayXp, setDisplayXp] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(xpInLevel / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= xpInLevel) {
        setDisplayXp(xpInLevel);
        clearInterval(timer);
      } else {
        setDisplayXp(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [xpInLevel]);

  // Floating sparkle particles
  const sparkles = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: i * 0.4,
      size: 4 + Math.random() * 6,
    })),
  [],)

  return (
    <div className="space-y-5 relative">
      {/* Level list info icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setShowLevelList(true)}
            className="absolute top-0 right-0 text-muted-foreground/40 hover:text-[var(--tc-primary)] transition-colors"
          >
            <Info className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">View level tiers</TooltipContent>
      </Tooltip>

      {/* Level list modal */}
      <AnimatePresence>
        {showLevelList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowLevelList(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border rounded-2xl shadow-2xl max-w-xs w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold mb-3 text-center">Level Tiers</h3>
              <div className="space-y-1.5">
                {[
                  [1, "Beginner"], [2, "Learner"], [3, "Scholar"],
                  [4, "Expert"], [5, "Master"], [6, "Grandmaster"],
                  [7, "Legend"], [8, "Mythic"], [9, "Transcendent"],
                ].map(([lv, name]) => (
                  <div
                    key={lv}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                      lv === level
                        ? "font-semibold"
                        : "text-muted-foreground"
                    }`}
                    style={lv === level ? {
                      backgroundColor: `rgba(var(--tc-rgb),0.15)`,
                      color: `var(--tc-primary)`,
                    } : undefined}
                  >
                    <span style={lv === level ? { color: `var(--tc-primary)` } : undefined}>
                      Level {lv}
                    </span>
                    <span>{name as string}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Level Circle with glow */}
      <div className="flex flex-col items-center pt-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
          className="relative"
        >
          {/* Ripple waves */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid rgba(var(--tc-rgb),0.2)` }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.6, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            />
          ))}
          {/* Floating sparkle particles */}
          {sparkles.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full z-10"
              style={{
                width: s.size,
                height: s.size,
                left: `${s.x}%`,
                top: `${-10 + Math.random() * 120}%`,
                backgroundColor: `var(--tc-primary)`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -20 - Math.random() * 20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeOut",
              }}
            />
          ))}
          {/* Outer glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ backgroundColor: `rgba(var(--tc-rgb),0.2)` }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -inset-3 rounded-full"
            style={{ border: `1px solid rgba(var(--tc-rgb),0.15)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -inset-5 rounded-full border border-dashed"
            style={{ borderColor: `rgba(var(--tc-rgb),0.08)` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner circle */}
          <motion.div
            className="relative h-24 w-24 rounded-full flex items-center justify-center"
            style={{
              background: `var(--tc-gradient)`,
              boxShadow: `0 0 40px rgba(var(--tc-rgb),0.4)`,
            }}
            animate={{ boxShadow: [
              `0 0 30px rgba(var(--tc-rgb),0.3)`,
              `0 0 50px rgba(var(--tc-rgb),0.5)`,
              `0 0 30px rgba(var(--tc-rgb),0.3)`,
            ]}}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-1 rounded-full"
              style={{ background: `linear-gradient(135deg, rgba(var(--tc-rgb),0.3), transparent)` }}
            />
            <motion.span
              className="text-3xl font-black text-white drop-shadow-sm"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {level}
            </motion.span>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 140, damping: 10 }}
          className="mt-5 relative flex items-center justify-center"
        >
          {/* Decorative lines */}
          <svg className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full h-3" preserveAspectRatio="none">
            <motion.line
              x1="0" y1="6" x2="100" y2="6"
              stroke={`rgba(var(--tc-rgb),0.4)`}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            />
          </svg>
          {/* Left star */}
          <motion.svg
            className="w-4 h-4 mr-2 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: `rgba(var(--tc-rgb),0.4)` }}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <polygon points="12,2 15.5,8.5 22,9.5 17,14.5 18.5,21 12,17.5 5.5,21 7,14.5 2,9.5 8.5,8.5" />
          </motion.svg>
          {/* Name */}
          <motion.span
            className="relative text-base font-black tracking-widest uppercase"
            style={{
              background: `linear-gradient(135deg, var(--tc-primary), var(--tc-dark), var(--tc-primary), var(--tc-light))`,
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          >
            {/* Subtle text shadow layer */}
            <span
              className="absolute inset-0 blur-sm opacity-40"
              style={{
                background: `linear-gradient(135deg, var(--tc-primary), var(--tc-dark))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {levelName}
            </span>
            {levelName}
          </motion.span>
          {/* Right star */}
          <motion.svg
            className="w-4 h-4 ml-2 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: `rgba(var(--tc-rgb),0.4)` }}
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <polygon points="12,2 15.5,8.5 22,9.5 17,14.5 18.5,21 12,17.5 5.5,21 7,14.5 2,9.5 8.5,8.5" />
          </motion.svg>
          {/* Decorative lines */}
          <svg className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full h-3" preserveAspectRatio="none" style={{ transform: "scaleY(-1)" }}>
            <motion.line
              x1="0" y1="6" x2="100" y2="6"
              stroke={`rgba(var(--tc-rgb),0.4)`}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            />
          </svg>
        </motion.div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground"
          >
            <span className="font-semibold text-foreground tabular-nums">{displayXp.toLocaleString()}</span> / {xpRange.toLocaleString()} XP
          </motion.span>
          <motion.span
            key={percentage}
            initial={{ scale: 1.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.7 }}
            className="font-bold"
            style={{ color: `var(--tc-primary)` }}
          >
            Level {nextLevel}
          </motion.span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
            className="h-full rounded-full relative"
            style={{
              background: `var(--tc-gradient-bar)`,
              backgroundSize: "200% 100%",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                backgroundSize: "200% 100%",
              }}
            />
          </motion.div>
          {/* Milestone dots */}
          {LEVEL_MILESTONES.map((m) => {
            const pos = ((m.level * 500 - xpForLevel(level)) / xpRange) * 100;
            if (pos < 0 || pos > 100) return null;
            const reached = level >= m.level;
            return (
              <motion.div
                key={m.level}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${pos}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.8 + m.level * 0.1 }}
              >
                <div
                  className={`h-3 w-3 rounded-full border-2 ${
                    reached ? "" : "bg-muted border-border"
                  }`}
                  style={reached ? {
                    backgroundColor: `var(--tc-primary)`,
                    borderColor: `var(--tc-light)`,
                    boxShadow: `0 0 8px rgba(var(--tc-rgb),0.5)`,
                  } : undefined}
                />
              </motion.div>
            );
          })}
        </div>
        {/* Percentage pulse badge */}
        <motion.div
          className="flex justify-center pt-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <motion.span
            className="text-[10px] font-mono text-muted-foreground/60"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {percentage}% to next level
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function AchievementBadges({ badges }: { badges: BadgeData[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges.map((badge) => (
        <Tooltip key={badge.name}>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`relative overflow-hidden text-center transition-all`}
                style={badge.earned ? {
                  borderColor: `var(--tc-border)`,
                  background: `linear-gradient(135deg, rgba(var(--tc-rgb),0.08), rgba(var(--tc-rgb),0.03))`,
                } : {
                  opacity: 0.5,
                  filter: 'grayscale(1)',
                }}
              >
                <CardContent className="pt-5 pb-4 px-3">
                  <div className="relative inline-flex">
                    <span className={`text-3xl ${badge.earned ? "" : "grayscale"}`}>
                      {badge.icon}
                    </span>
                    {!badge.earned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                        <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-tight">{badge.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                    {badge.description}
                  </p>
                  {badge.earned && badge.earnedAt && (
                    <p className="mt-1.5 text-[9px] font-medium"
                      style={{ color: `var(--tc-primary)` }}
                    >
                      Earned {new Date(badge.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
            {badge.progressDetail}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function StatsGrid({ data }: {
  data: { quizzesTaken: number; materialsDone: number; activeDays: number; questionsAnswered: number }
}) {
  const items = [
    { label: "Quizzes Taken", value: data.quizzesTaken.toLocaleString(), icon: Target, desc: "Total number of quizzes you have completed" },
    { label: "Materials Done", value: data.materialsDone.toLocaleString(), icon: BookOpen, desc: "Study materials you have finished" },
    { label: "Active Days", value: data.activeDays.toLocaleString(), icon: Flame, desc: "Total unique days you studied — never resets" },
    { label: "Questions Answered", value: data.questionsAnswered.toLocaleString(), icon: HelpCircle, desc: "Total questions you have answered across all quizzes" },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((stat) => (
        <Tooltip key={stat.label}>
          <TooltipTrigger asChild>
            <Card className="text-center cursor-help">
              <CardContent className="pt-5 pb-4 px-3">
                <div
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `rgba(var(--tc-rgb),0.1)` }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: `var(--tc-primary)` }} />
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-48 text-center">
            <p className="text-xs">{stat.desc}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// --- Main Component ---

export default function Gamification() {
  const authUser = useAuthStore((s) => s.user)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [streakDays, setStreakDays] = useState<{ date: string; active: boolean }[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{
    xp: number; level: number; levelName: string;
    prevLevelXp: number; nextLevelXp: number;
    xpInLevel: number; xpNeeded: number; percentage: number;
  } | null>(null);
  const [stats, setStats] = useState<{
    quizzesTaken: number; materialsDone: number; activeDays: number; questionsAnswered: number;
  } | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    if (!authUser?.id) return
    const fetchAll = () => {
      fetch(`/api/gamification/streak-calendar?student_id=${authUser.id}&year=${year}&month=${month}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.days) setStreakDays(data.days)
          if (typeof data.currentStreak === 'number') setCurrentStreak(data.currentStreak)
          if (typeof data.bestStreak === 'number') setBestStreak(data.bestStreak)
        })
        .catch(() => {})
        .finally(() => setLoading(false))

      fetch(`/api/gamification/progress?student_id=${authUser.id}`)
        .then((r) => r.json())
        .then((data) => setProgress(data))
        .catch(() => {})

      fetch(`/api/gamification/stats?student_id=${authUser.id}`)
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(() => {})

      fetch(`/api/gamification/badges?student_id=${authUser.id}`)
        .then((r) => r.json())
        .then((data) => { if (data.badges) setBadges(data.badges) })
        .catch(() => {})
    }
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    const onXpUpdate = () => fetchAll()
    window.addEventListener('xp-updated', onXpUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('xp-updated', onXpUpdate)
    }
  }, [authUser?.id, year, month])

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long" })

  const goPrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const goNext = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  const lv = progress?.level ?? 1
  const tc = LEVEL_COLORS[Math.min(lv, LEVEL_COLORS.length) - 1] ?? LEVEL_COLORS[0]

  return (
    <div
      className="space-y-6"
      style={{
        ['--tc-primary' as string]: tc.primary,
        ['--tc-dark' as string]: tc.dark,
        ['--tc-light' as string]: tc.light,
        ['--tc-rgb' as string]: tc.rgb,
        ['--tc-gradient' as string]: `linear-gradient(${tc.grad})`,
        ['--tc-gradient-bar' as string]: `linear-gradient(90deg,${tc.primary},${tc.dark},${tc.primary})`,
        ['--tc-glow-sm' as string]: `0 0 6px rgba(${tc.rgb},0.3)`,
        ['--tc-glow-md' as string]: `0 0 20px rgba(${tc.rgb},0.3)`,
        ['--tc-glow-lg' as string]: `0 0 40px rgba(${tc.rgb},0.4)`,
        ['--tc-bg-subtle' as string]: `rgba(${tc.rgb},0.1)`,
        ['--tc-bg-earned' as string]: `rgba(${tc.rgb},0.08)`,
        ['--tc-border' as string]: `rgba(${tc.rgb},0.3)`,
        ['--tc-border-subtle' as string]: `rgba(${tc.rgb},0.15)`,
      }}
    >
      {/* Daily Study Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" style={{ color: `var(--tc-primary)` }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className="h-6 w-6" />
              </motion.div>
              <span className="text-2xl font-bold">{currentStreak}</span>
            </div>
            <span>Day Streak!</span>
          </CardTitle>
          <CardDescription>
            Best streak: <span className="font-medium text-foreground">{bestStreak} days</span> — Keep going!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{monthName} {year}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext} disabled={isCurrentMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {loading && streakDays.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">Loading streak data...</div>
          ) : (
            <StreakCalendar days={streakDays} year={year} month={month} />
          )}
        </CardContent>
      </Card>

      {/* Level Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          {progress ? (
            <LevelProgressBar
              level={progress.level}
              levelName={progress.levelName}
              xpInLevel={progress.xpInLevel}
              xpRange={progress.xpNeeded}
              percentage={progress.percentage}
              nextLevel={progress.level + 1}
            />
          ) : (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Loading progress...</div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <StatsGrid data={stats || { quizzesTaken: 0, materialsDone: 0, activeDays: 0, questionsAnswered: 0 }} />

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>{badges.filter((a) => a.earned).length} of {badges.length} earned</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Gem className="h-3 w-3" style={{ color: `var(--tc-primary)` }} />
              <span>{badges.filter((a) => a.earned).length}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AchievementBadges badges={badges} />
        </CardContent>
      </Card>
    </div>
  );
}
