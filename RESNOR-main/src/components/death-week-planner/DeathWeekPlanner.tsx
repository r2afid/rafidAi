'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Plus, Sparkles, Loader2, RefreshCw, CheckCircle2,
  AlertTriangle, Flame, Zap, ChevronDown, ChevronUp,
  Timer, BookOpen, FileText, Brain, Presentation, FlaskConical, Target,
  Power, PowerOff, TrendingUp,
} from 'lucide-react';
import { GlassCard, MetricCard, LoadingSkeleton, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { plannerApi } from '@/lib/planner-api';
import type { DeathWeekTaskType, DeathWeekState, RankedRecommendation, DeadlineTask, PlannerMeta, ApiResponse } from '@/types/planner';

interface NewTaskForm {
  title: string;
  courseName: string;
  taskType: DeathWeekTaskType;
  dueDate: string;
  estimatedHours: number;
}

const TASK_TYPE_CONFIG: Record<string, { icon: typeof BookOpen; color: string; bgColor: string; label: string }> = {
  exam: { icon: Brain, color: 'text-rose-400', bgColor: 'bg-rose-400/10', label: 'Exam' },
  project: { icon: FileText, color: 'text-amber-400', bgColor: 'bg-amber-400/10', label: 'Project' },
  assignment: { icon: FileText, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Assignment' },
  quiz: { icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Quiz' },
  presentation: { icon: Presentation, color: 'text-violet-400', bgColor: 'bg-violet-400/10', label: 'Presentation' },
  lab_report: { icon: FlaskConical, color: 'text-sky-400', bgColor: 'bg-sky-400/10', label: 'Lab Report' },
};

const URGENCY_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; label: string; pulse: boolean }> = {
  overdue: { color: 'text-rose-400', bgColor: 'bg-rose-400/10', borderColor: 'border-rose-400/30', label: 'OVERDUE', pulse: true },
  critical: { color: 'text-rose-400', bgColor: 'bg-rose-400/8', borderColor: 'border-rose-400/20', label: 'Critical', pulse: true },
  urgent: { color: 'text-amber-400', bgColor: 'bg-amber-400/8', borderColor: 'border-amber-400/20', label: 'Urgent', pulse: false },
  moderate: { color: 'text-cyan-500', bgColor: 'bg-cyan-500/8', borderColor: 'border-cyan-500/20', label: 'Moderate', pulse: false },
  low: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/8', borderColor: 'border-emerald-500/20', label: 'Low', pulse: false },
};

const containerVariants: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: any = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } } };

const EMPTY_TASK_FORM: NewTaskForm = { title: '', courseName: '', taskType: 'assignment', dueDate: '', estimatedHours: 6 };

export default function DeathWeekPlanner() {
  const [state, setState] = useState<DeathWeekState | null>(null);
  const [meta, setMeta] = useState<PlannerMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>(EMPTY_TASK_FORM);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await plannerApi.get<ApiResponse<DeathWeekState>>('/planner');
      setState(response.data ?? null);
      if (response.meta) setMeta(response.meta);
    } catch (err) {
      setError('Unable to load Death Week data.');
      console.error('Planner fetch error:', err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const handleActivate = useCallback(async () => {
    try {
      setIsActivating(true);
      const response = await plannerApi.post<{ success: boolean; data: DeathWeekState }>('/planner', { action: 'activate', data: { trigger: 'manual' } });
      if (response.data) {
        await new Promise(resolve => setTimeout(resolve, 2500));
        setState(response.data);
      }
    } catch (err) { console.error('Activate error:', err); }
    finally { setIsActivating(false); setLoading(false); }
  }, []);

  const handleDeactivate = useCallback(async () => {
    try {
      setIsDeactivating(true);
      await plannerApi.post('/planner', { action: 'deactivate' });
      await new Promise(resolve => setTimeout(resolve, 2500));
      setState(null);
    } catch (err) { console.error('Deactivate error:', err); }
    finally { setIsDeactivating(false); }
  }, []);

  const pendingProgressRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleProgressChange = useCallback((taskId: string, progress: number) => {
    setState(prev => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const hoursSpent = (progress / 100) * t.estimatedHours;
        return { ...t, progress, hoursSpent: Math.round(hoursSpent * 10) / 10, isCompleted: progress >= 100 };
      });
      const activeTasks = updatedTasks.filter(t => !t.isCompleted);
      const now = Date.now();
      const scored = activeTasks.map(t => {
        const dueDate = new Date(t.dueDate).getTime();
        const daysLeft = Math.max(0, (dueDate - now) / 86400000);
        const hoursRemaining = Math.max(0, t.estimatedHours - t.hoursSpent);
        const timePressure = 1 / Math.max(daysLeft, 0.5);
        const workRemaining = (100 - t.progress) / 100;
        const effortFactor = hoursRemaining * timePressure;
        const score = (timePressure * 50) + (workRemaining * 30) + (effortFactor * 20);
        let urgency: 'overdue' | 'critical' | 'urgent' | 'moderate' | 'low';
        if (daysLeft <= 0) urgency = 'overdue';
        else if (daysLeft <= 1) urgency = 'critical';
        else if (daysLeft <= 3 && t.progress < 60) urgency = 'critical';
        else if (daysLeft <= 3) urgency = 'urgent';
        else if (daysLeft <= 5 && t.progress < 40) urgency = 'urgent';
        else if (daysLeft <= 7) urgency = 'moderate';
        else urgency = 'low';
        return { task: t, daysLeft, hoursRemaining, urgency, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const TASK_TYPE_VERB: Record<string, string> = { exam: 'Study for', project: 'Work on', assignment: 'Complete', quiz: 'Prepare for', presentation: 'Prepare', lab_report: 'Write' };
      const recommendations = scored.map((item, index) => ({
        taskId: item.task.id, taskTitle: item.task.title, courseName: item.task.courseName,
        rank: index + 1, minimumHours: Math.max(1, Math.ceil(item.hoursRemaining)),
        hoursRemaining: Math.ceil(item.hoursRemaining * 10) / 10,
        minDailyHours: item.daysLeft > 0 ? Math.ceil((item.hoursRemaining / item.daysLeft) * 10) / 10 : item.hoursRemaining,
        reasoning: '', actionVerb: TASK_TYPE_VERB[item.task.taskType] ?? 'Work on',
        urgency: item.urgency, daysLeft: Math.ceil(item.daysLeft),
      }));
      return { ...prev, tasks: updatedTasks, recommendations };
    });

    const existing = pendingProgressRef.current.get(taskId);
    if (existing) clearTimeout(existing);
    pendingProgressRef.current.set(taskId, setTimeout(async () => {
      pendingProgressRef.current.delete(taskId);
      try {
        setUpdatingTaskId(taskId);
        const response = await plannerApi.post<{ success: boolean; data: DeathWeekState }>('/planner', { action: 'update_progress', data: { taskId, progress } });
        if (!pendingProgressRef.current.has(taskId) && response.data) setState(response.data);
      } catch (err) { console.error('Progress update error:', err); }
      finally { setUpdatingTaskId(null); }
    }, 400));
  }, []);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      const response = await plannerApi.post<{ success: boolean; data: DeathWeekState }>('/planner', { action: 'complete_task', data: { taskId } });
      if (response.data) { setState(response.data.isActive ? response.data : null); }
    } catch (err) { console.error('Complete task error:', err); }
    finally { setUpdatingTaskId(null); }
  }, []);

  const handleAddTask = useCallback(async () => {
    if (!newTask.title || !newTask.courseName || !newTask.dueDate) return;
    try {
      const response = await plannerApi.post<{ success: boolean; data: DeathWeekState }>('/planner', {
        action: 'add_task', data: { title: newTask.title, courseName: newTask.courseName, taskType: newTask.taskType, dueDate: new Date(newTask.dueDate).toISOString(), estimatedHours: newTask.estimatedHours },
      });
      if (response.data) setState(response.data);
      setShowAddForm(false);
      setNewTask(EMPTY_TASK_FORM);
    } catch (err) { console.error('Add task error:', err); }
  }, [newTask]);

  const activeTasks = state?.tasks.filter(t => !t.isCompleted) ?? [];
  const completedTasks = state?.tasks.filter(t => t.isCompleted) ?? [];
  const overallProgress = state && state.tasks.length > 0 ? Math.round(state.tasks.reduce((sum, t) => sum + t.progress, 0) / state.tasks.length) : 0;

  if (loading && !state && !isActivating) {
    return (
      <div className="space-y-6">
        <PageHeader title="Death Week Planner" subtitle="Your survival guide for deadline season" icon={<Calendar className="h-5 w-5" />} />
        <LoadingSkeleton type="card" count={3} />
        <LoadingSkeleton type="list" count={2} />
      </div>
    );
  }

  if (isActivating) {
    const activationOverlay = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ position: 'fixed' }}>
        <motion.div initial={{ opacity: 1, backgroundColor: 'rgba(244, 63, 94, 0.3)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }} transition={{ duration: 0.6, ease: 'easeOut' }} className="absolute inset-0" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} transition={{ delay: 0.2, duration: 0.3 }} className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)', backgroundSize: '100% 4px' }} />
        {[0, 1, 2].map(i => (
          <motion.div key={i} initial={{ scaleX: 0, opacity: 0.6 }} animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 0.6, 0.4, 0], x: [0, i % 2 === 0 ? 10 : -10, 0] }} transition={{ duration: 0.15, delay: 0.1 + i * 0.08, ease: 'linear' }} className="absolute h-[2px] bg-rose-400/60" style={{ top: `${25 + i * 20}%`, left: '10%', right: '10%', transformOrigin: 'left' }} />
        ))}
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1.2] }} transition={{ duration: 1.8, times: [0, 0.3, 1], ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, oklch(0.63 0.2 25 / 12%) 0%, oklch(0.63 0.2 25 / 4%) 25%, transparent 55%)' }} />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3], opacity: [0, 0.8] }} transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }} className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, oklch(0.72 0.19 163 / 10%) 0%, oklch(0.72 0.19 163 / 3%) 35%, transparent 60%)' }} />
        <motion.div initial={{ scale: 0, opacity: 0.7 }} animate={{ scale: [0, 4], opacity: [0.7, 0] }} transition={{ duration: 1.8, ease: 'easeOut' }} className="absolute w-20 h-20 rounded-full border-2 border-rose-400/40" />
        <motion.div initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: [0, 5], opacity: [0.5, 0] }} transition={{ duration: 2, delay: 0.3, ease: 'easeOut' }} className="absolute w-20 h-20 rounded-full border border-emerald-500/30" />
        <motion.div initial={{ scale: 0, opacity: 0.3 }} animate={{ scale: [0, 6], opacity: [0.3, 0] }} transition={{ duration: 2.2, delay: 0.5, ease: 'easeOut' }} className="absolute w-20 h-20 rounded-full border border-cyan-500/20" />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 250, damping: 12, delay: 0.15 }} className="relative">
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0, 0.6, 0] }} transition={{ duration: 0.6, delay: 0.3 }} className="absolute inset-0 -m-6 rounded-full bg-rose-400/20 blur-xl" />
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0, 0.4, 0] }} transition={{ duration: 0.8, delay: 0.5 }} className="absolute inset-0 -m-8 rounded-full bg-emerald-500/15 blur-2xl" />
            {[
              { angle: -60, dist: 50, delay: 0.4, size: 3 }, { angle: -30, dist: 60, delay: 0.5, size: 2 }, { angle: 0, dist: 55, delay: 0.45, size: 2.5 },
              { angle: 30, dist: 65, delay: 0.55, size: 2 }, { angle: 60, dist: 50, delay: 0.4, size: 3 }, { angle: -90, dist: 45, delay: 0.5, size: 2 },
              { angle: 90, dist: 48, delay: 0.5, size: 2 }, { angle: -120, dist: 40, delay: 0.55, size: 1.5 }, { angle: 120, dist: 42, delay: 0.55, size: 1.5 },
              { angle: 150, dist: 55, delay: 0.45, size: 2 }, { angle: -150, dist: 52, delay: 0.45, size: 2 }, { angle: 180, dist: 38, delay: 0.5, size: 1.5 },
            ].map((spark, i) => {
              const rad = (spark.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * spark.dist;
              const ty = Math.sin(rad) * spark.dist;
              return (
                <motion.div key={i} initial={{ x: 0, y: 0, opacity: 0, scale: 0 }} animate={{ x: tx, y: ty, opacity: [0, 1, 0], scale: [0, 1, 0.3] }} transition={{ duration: 0.7, delay: spark.delay, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 rounded-full bg-emerald-500" style={{ width: spark.size, height: spark.size, marginLeft: -spark.size / 2, marginTop: -spark.size / 2, boxShadow: '0 0 6px oklch(0.72 0.19 163 / 60%)' }} />
              );
            })}
            <motion.div animate={{ scale: [1, 1.12, 1], filter: ['drop-shadow(0 0 15px oklch(0.63 0.2 25 / 50%))', 'drop-shadow(0 0 35px oklch(0.72 0.19 163 / 70%))', 'drop-shadow(0 0 20px oklch(0.72 0.19 163 / 50%))'] }}
              transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, ease: 'easeInOut' }} className="relative flex h-28 w-28 items-center justify-center rounded-3xl border">
              <motion.div animate={{ backgroundColor: ['oklch(0.63 0.2 25 / 15%)', 'oklch(0.63 0.15 30 / 10%)', 'oklch(0.72 0.19 163 / 15%)'], borderColor: ['oklch(0.63 0.2 25 / 25%)', 'oklch(0.63 0.15 30 / 15%)', 'oklch(0.72 0.19 163 / 25%)'] }}
                transition={{ duration: 1.2, delay: 0.2, ease: 'easeInOut' }} className="absolute inset-0 rounded-3xl" />
              <motion.div animate={{ color: ['oklch(0.63 0.2 25)', 'oklch(0.65 0.18 35)', 'oklch(0.72 0.19 163)'] }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeInOut' }}>
                <Flame className="h-14 w-14" />
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="mt-8 text-center">
            <div className="flex items-center justify-center gap-0.5">
              {'DEATH WEEK'.split('').map((char, i) => (
                <motion.span key={i} initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.6 + i * 0.06, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-3xl font-black tracking-widest" style={{ color: i < 5 ? 'oklch(0.63 0.2 25 / 90%)' : 'oklch(0.72 0.19 163 / 90%)', textShadow: i < 5 ? '0 0 20px oklch(0.63 0.2 25 / 40%)' : '0 0 20px oklch(0.72 0.19 163 / 40%)' }}>
                  {char}
                </motion.span>
              ))}
            </div>
            <motion.div className="mt-3 h-5 overflow-hidden">
              <motion.p initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 1.3, duration: 0.6, ease: 'linear' }} className="text-sm text-muted-foreground whitespace-nowrap inline-block">
                Prioritizing your survival plan...
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="w-48 mt-6">
            <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ delay: 1.4, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }} className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500" />
            </div>
          </motion.div>
        </div>
      </div>
    );
    return createPortal(activationOverlay, document.body);
  }

  if (isDeactivating) {
    const deactivationOverlay = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ position: 'fixed' }}>
        <motion.div initial={{ opacity: 0, backgroundColor: 'rgba(0, 0, 0, 0)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)' }} transition={{ duration: 0.5, ease: 'easeOut' }} className="absolute inset-0" />
        <motion.div initial={{ opacity: 0.15 }} animate={{ opacity: 0.04 }} transition={{ delay: 1.2, duration: 0.8 }} className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)', backgroundSize: '100% 4px' }} />
        <motion.div initial={{ scale: 5, opacity: 0.5 }} animate={{ scale: 0, opacity: 0 }} transition={{ duration: 1.5, ease: 'easeIn' }} className="absolute w-20 h-20 rounded-full border border-emerald-500/30" />
        <motion.div initial={{ scale: 4, opacity: 0.4 }} animate={{ scale: 0, opacity: 0 }} transition={{ duration: 1.3, delay: 0.15, ease: 'easeIn' }} className="absolute w-20 h-20 rounded-full border border-cyan-500/20" />
        <motion.div initial={{ scale: 3, opacity: 0.3 }} animate={{ scale: 0, opacity: 0 }} transition={{ duration: 1.1, delay: 0.3, ease: 'easeIn' }} className="absolute w-20 h-20 rounded-full border-2 border-rose-400/20" />
        <motion.div initial={{ scale: 1.2, opacity: 0.8 }} animate={{ scale: 0.3, opacity: 0 }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, oklch(0.72 0.19 163 / 12%) 0%, oklch(0.72 0.19 163 / 4%) 30%, transparent 55%)' }} />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div initial={{ scale: 1, rotate: 0 }} animate={{ scale: 0, rotate: 45 }} transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }} className="relative">
            <motion.div animate={{ scale: [1, 0.8, 0], opacity: [0.4, 0.2, 0] }} transition={{ duration: 1.2, delay: 0.2 }} className="absolute inset-0 -m-8 rounded-full bg-emerald-500/10 blur-2xl" />
            <motion.div animate={{ scale: [1, 0.6, 0], opacity: [0.3, 0.15, 0] }} transition={{ duration: 1, delay: 0.4 }} className="absolute inset-0 -m-6 rounded-full bg-cyan-500/10 blur-xl" />
            {[
              { angle: -50, dist: 45, delay: 0.3, size: 2.5 }, { angle: -25, dist: 55, delay: 0.35, size: 2 }, { angle: 10, dist: 50, delay: 0.4, size: 2 },
              { angle: 35, dist: 60, delay: 0.3, size: 2.5 }, { angle: 55, dist: 45, delay: 0.35, size: 2 }, { angle: -80, dist: 40, delay: 0.4, size: 1.5 },
              { angle: 80, dist: 42, delay: 0.4, size: 1.5 }, { angle: 140, dist: 50, delay: 0.35, size: 2 }, { angle: -140, dist: 48, delay: 0.35, size: 2 },
              { angle: 170, dist: 35, delay: 0.4, size: 1.5 },
            ].map((ember, i) => {
              const rad = (ember.angle * Math.PI) / 180;
              const startX = Math.cos(rad) * ember.dist;
              const startY = Math.sin(rad) * ember.dist;
              return (
                <motion.div key={i} initial={{ x: startX, y: startY, opacity: 0.8, scale: 1 }} animate={{ x: 0, y: 0, opacity: [0.8, 0.5, 0], scale: [1, 0.6, 0] }}
                  transition={{ duration: 0.8, delay: ember.delay, ease: 'easeIn' }} className="absolute left-1/2 top-1/2 rounded-full"
                  style={{ width: ember.size, height: ember.size, marginLeft: -ember.size / 2, marginTop: -ember.size / 2, backgroundColor: 'oklch(0.72 0.19 163 / 60%)', boxShadow: '0 0 6px oklch(0.72 0.19 163 / 40%)' }} />
              );
            })}
            <motion.div animate={{ scale: [1, 0.9, 0], filter: ['drop-shadow(0 0 20px oklch(0.72 0.19 163 / 50%))', 'drop-shadow(0 0 8px oklch(0.5 0.02 260 / 30%))', 'drop-shadow(0 0 0px transparent)'] }}
              transition={{ duration: 1.5, delay: 0.2, ease: 'easeInOut' }} className="relative flex h-28 w-28 items-center justify-center rounded-3xl border">
              <motion.div animate={{ backgroundColor: ['oklch(0.72 0.19 163 / 15%)', 'oklch(0.5 0.02 260 / 8%)', 'oklch(0.3 0.01 260 / 0%)'], borderColor: ['oklch(0.72 0.19 163 / 25%)', 'oklch(0.5 0.02 260 / 12%)', 'oklch(0.3 0.01 260 / 0%)'] }}
                transition={{ duration: 1.2, delay: 0.2, ease: 'easeInOut' }} className="absolute inset-0 rounded-3xl" />
              <motion.div animate={{ color: ['oklch(0.72 0.19 163)', 'oklch(0.55 0.06 260)', 'oklch(0.4 0.02 260)'] }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeInOut' }}>
                <Flame className="h-14 w-14" />
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-8 text-center">
            <div className="flex items-center justify-center gap-0.5">
              {'POWERING DOWN'.split('').map((char, i) => (
                <motion.span key={i} initial={{ opacity: 0, y: -8, filter: 'blur(0px)' }} animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6], filter: ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(4px)'] }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-3xl font-black tracking-widest" style={{ color: i < 8 ? 'oklch(0.55 0.06 260 / 80%)' : 'oklch(0.5 0.02 260 / 60%)', textShadow: i < 8 ? '0 0 15px oklch(0.55 0.06 260 / 30%)' : '0 0 10px oklch(0.5 0.02 260 / 20%)' }}>
                  {char}
                </motion.span>
              ))}
            </div>
            <motion.div className="mt-3 h-5 overflow-hidden">
              <motion.p initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 1.1, duration: 0.6, ease: 'linear' }} className="text-sm text-muted-foreground whitespace-nowrap inline-block">
                Shutting down Death Week...
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="w-48 mt-6">
            <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ delay: 1.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-slate-500" />
            </div>
          </motion.div>
        </div>
      </div>
    );
    return createPortal(deactivationOverlay, document.body);
  }

  if (!state || !state.isActive) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-full max-w-2xl space-y-6">
          <motion.div variants={itemVariants}>
            <PageHeader title="Death Week Planner" subtitle="Your survival guide for deadline season" icon={<Calendar className="h-5 w-5" />} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} glow="none" variant="liquid" className="relative overflow-hidden flex flex-col !p-0">
              <div className="!absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />
              <div className="!absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />
              <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center min-h-[320px] px-6 py-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                  <Calendar className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">No Active Death Week</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Death Week activates when you have more than 3 deadlines in a week, or you can manually activate it whenever you need structured prioritization.
                </p>
                {meta && meta.deadlinesThisWeek > 0 && (
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 ${meta.autoDetected ? 'bg-amber-400/10 border border-amber-400/20' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                    {meta.autoDetected && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                    <span className={`text-sm font-medium ${meta.autoDetected ? 'text-amber-400' : 'text-muted-foreground'}`}>
                      {meta.autoDetected ? `${meta.deadlinesThisWeek} deadlines detected this week — consider activating!` : `${meta.deadlinesThisWeek} deadline${meta.deadlinesThisWeek !== 1 ? 's' : ''} this week`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button onClick={handleActivate} disabled={isActivating} className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20 font-semibold">
                    <Power className="mr-2 h-4 w-4" />Activate Death Week
                  </Button>
                  <Button onClick={fetchState} variant="outline" size="sm" disabled={loading} className="border-white/10 text-muted-foreground hover:bg-white/5">
                    <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard hover={false} glow="none" className="p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />How Death Week Works
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: <Zap className="h-5 w-5 text-amber-400" />, iconBg: 'bg-amber-400/10', title: 'Auto-Detect', desc: 'Activates automatically when 3+ deadlines land in the same week.' },
                  { icon: <Target className="h-5 w-5 text-emerald-500" />, iconBg: 'bg-emerald-500/10', title: 'Smart Priority', desc: 'AI ranks your tasks by urgency, progress, and time remaining.' },
                  { icon: <Timer className="h-5 w-5 text-cyan-500" />, iconBg: 'bg-cyan-500/10', title: 'Time Estimates', desc: 'Shows minimum daily hours needed to finish each task on time.' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-all duration-200 hover:bg-white/[0.05] hover:border-white/[0.08]">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>{item.icon}</div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full space-y-6 md:space-y-8">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Death Week Planner"
          subtitle={state.autoDetected ? 'Auto-activated — high deadline density detected' : 'Manual activation — you turned this on'}
          icon={<Flame className="h-5 w-5" />}
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={fetchState} variant="outline" size="sm" className="border-white/10 text-muted-foreground hover:bg-white/5">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />Refresh
              </Button>
              <Button onClick={handleDeactivate} disabled={isDeactivating} variant="outline" size="sm" className="border-rose-400/20 text-rose-400 hover:bg-rose-400/10">
                <PowerOff className="mr-2 h-3.5 w-3.5" />Turn Off
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Active Tasks" value={activeTasks.length} color="emerald" icon={<BookOpen className="h-5 w-5" />} />
          <MetricCard label="Hours Remaining" value={state.totalHoursRemaining} color="cyan" icon={<Clock className="h-5 w-5" />} />
          <MetricCard label="Days Until Last" value={state.daysUntilLastDeadline} color="amber" icon={<Timer className="h-5 w-5" />} />
          <MetricCard label="Overall Progress" value={`${overallProgress}%`} color="emerald" icon={<TrendingUp className="h-5 w-5" />} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard hover={false} glow="emerald" variant="liquid" className="overflow-hidden">
          <div className="p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-emerald-500">{overallProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{completedTasks.length}/{state.tasks.length} tasks completed</span>
              <span>~{state.totalHoursRemaining}h of work left</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard hover={false} glow="none" className="overflow-hidden !p-0">
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
                <Flame className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Priority List</h3>
                <p className="text-[11px] text-muted-foreground">Do these in order — AI-ranked by urgency & progress</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20">
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Task
            </Button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden border-b border-white/[0.06]">
                <div className="p-4 space-y-3 bg-white/[0.02]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Task Title</Label>
                      <Input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Final Report" className="h-9 bg-white/[0.04] border-white/[0.08] text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Course Name</Label>
                      <Input value={newTask.courseName} onChange={e => setNewTask(p => ({ ...p, courseName: e.target.value }))} placeholder="e.g., Database Systems" className="h-9 bg-white/[0.04] border-white/[0.08] text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <select value={newTask.taskType} onChange={e => setNewTask(p => ({ ...p, taskType: e.target.value as DeathWeekTaskType }))} className="w-full h-9 rounded-md bg-white/[0.04] border border-white/[0.08] px-2 text-xs text-foreground">
                        <option value="exam">Exam</option><option value="project">Project</option><option value="assignment">Assignment</option><option value="quiz">Quiz</option><option value="presentation">Presentation</option><option value="lab_report">Lab Report</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Due Date</Label>
                      <Input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} className="h-9 bg-white/[0.04] border-white/[0.08] text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Est. Hours</Label>
                      <Input type="number" min={1} max={50} value={newTask.estimatedHours} onChange={e => setNewTask(p => ({ ...p, estimatedHours: parseInt(e.target.value) || 6 }))} className="h-9 bg-white/[0.04] border-white/[0.08] text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewTask(EMPTY_TASK_FORM); }} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                    <Button size="sm" onClick={handleAddTask} disabled={!newTask.title || !newTask.courseName || !newTask.dueDate} className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />Add Task
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {state.recommendations.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </motion.div>
              <p className="text-base font-semibold text-foreground mb-1">All Tasks Completed</p>
              <p className="text-sm text-muted-foreground">Great work! You crushed it. 🎉</p>
            </motion.div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              <AnimatePresence mode="popLayout">
                {state.recommendations.map((rec, i) => {
                  const task = state.tasks.find(t => t.id === rec.taskId);
                  if (!task) return null;
                  const taskConfig = TASK_TYPE_CONFIG[task.taskType] ?? TASK_TYPE_CONFIG.assignment;
                  const urgencyConfig = URGENCY_CONFIG[rec.urgency] ?? URGENCY_CONFIG.moderate;
                  const isExpanded = expandedRecId === rec.taskId;
                  const isUpdating = updatingTaskId === rec.taskId;
                  const TaskIcon = taskConfig.icon;

                  return (
                    <motion.div key={rec.taskId} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                      transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 }, opacity: { duration: 0.25 }, y: { duration: 0.25 } }} className="relative group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${rec.urgency === 'overdue' || rec.urgency === 'critical' ? 'bg-rose-400' : rec.urgency === 'urgent' ? 'bg-amber-400' : 'bg-cyan-500'} ${urgencyConfig.pulse ? 'animate-pulse' : ''}`} />
                      <div className="px-5 py-4 pl-5 transition-colors duration-200 group-hover:bg-white/[0.015]">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0 pt-0.5">
                            <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold ${
                                i === 0 ? 'bg-rose-400/15 text-rose-400 shadow-sm shadow-rose-400/20' :
                                i === 1 ? 'bg-amber-400/15 text-amber-400' :
                                i === 2 ? 'bg-cyan-500/15 text-cyan-500' :
                                'bg-white/[0.04] text-muted-foreground'
                              }`}>
                              {rec.rank}
                            </motion.div>
                            <AnimatePresence>
                              {i === 0 && <motion.span layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-[8px] font-bold text-rose-400 uppercase tracking-wider mt-1">Do First</motion.span>}
                            </AnimatePresence>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">{rec.actionVerb} {rec.taskTitle}</span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${urgencyConfig.bgColor} ${urgencyConfig.color} ${urgencyConfig.pulse ? 'animate-pulse' : ''}`}>{urgencyConfig.label}</span>
                              {!task.isAutoDetected && <span className="text-[10px] text-muted-foreground/50 border border-white/[0.08] rounded px-1.5 py-0.5">Manual</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{rec.courseName}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{rec.hoursRemaining}h left</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Timer className="h-3 w-3" />{rec.minDailyHours}h/day minimum</span>
                              <span className={`flex items-center gap-1 text-xs font-medium ${rec.daysLeft <= 1 ? 'text-rose-400' : rec.daysLeft <= 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                                <Calendar className="h-3 w-3" />{rec.daysLeft <= 0 ? 'OVERDUE' : `${rec.daysLeft}d left`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setExpandedRecId(isExpanded ? null : rec.taskId)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleCompleteTask(rec.taskId)} disabled={isUpdating} className="text-emerald-500 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-emerald-500/10">
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            </motion.button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Slider value={[task.progress]} onValueChange={([val]) => handleProgressChange(rec.taskId, val)} max={100} step={1} disabled={isUpdating} className="w-full" />
                            </div>
                            <span className="text-xs text-muted-foreground/60 shrink-0">
                              {task.progress >= 100 ? '✅' : task.progress >= 75 ? '🔥' : task.progress >= 50 ? '💪' : task.progress >= 25 ? '⏳' : '🌅'}
                            </span>
                            <span className={`text-sm font-bold shrink-0 w-12 text-right ${task.progress >= 80 ? 'text-emerald-500' : task.progress >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{task.progress}%</span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-cyan-500 mb-1">AI Recommendation</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.reasoning}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/[0.04] text-[11px] text-muted-foreground">
                                  <span>Type: <span className={taskConfig.color}>{taskConfig.label}</span></span>
                                  <span>Est: {rec.minimumHours}h total</span>
                                  <span>Spent: {task.hoursSpent}h</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {completedTasks.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassCard hover={false} glow="none" className="overflow-hidden">
            <div className="p-4 md:p-5">
              <button className="w-full flex items-center justify-between" onClick={() => setShowCompleted(!showCompleted)}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-foreground">Completed ({completedTasks.length})</h3>
                </div>
                <motion.div animate={{ rotate: showCompleted ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>
            </div>
            <AnimatePresence>
              {showCompleted && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-2">
              {completedTasks.map(task => {
                const taskConfig = TASK_TYPE_CONFIG[task.taskType] ?? TASK_TYPE_CONFIG.assignment;
                const CompletedIcon = taskConfig.icon;
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-lg p-3 bg-emerald-500/[0.04] border-l-2 border-emerald-500/30">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${taskConfig.bgColor}`}>
                      <CompletedIcon className={`h-3.5 w-3.5 ${taskConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground line-through">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground/50">{task.courseName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-500 font-medium">100%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
