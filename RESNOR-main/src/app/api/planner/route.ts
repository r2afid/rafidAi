import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveUserId } from '@/lib/api-utils';
import type { DeathWeekTaskType } from '@/types/planner';

interface DeadlineTask {
  id: string;
  title: string;
  courseName: string;
  taskType: DeathWeekTaskType;
  dueDate: string;
  estimatedHours: number;
  hoursSpent: number;
  progress: number;
  isAutoDetected: boolean;
  isCompleted: boolean;
}

interface RankedRecommendation {
  taskId: string;
  taskTitle: string;
  courseName: string;
  rank: number;
  minimumHours: number;
  hoursRemaining: number;
  minDailyHours: number;
  reasoning: string;
  actionVerb: string;
  urgency: 'overdue' | 'critical' | 'urgent' | 'moderate' | 'low';
  daysLeft: number;
}

interface DeathWeekState {
  id: string;
  isActive: boolean;
  trigger: 'auto' | 'manual';
  activatedAt: string;
  tasks: DeadlineTask[];
  recommendations: RankedRecommendation[];
  totalHoursRemaining: number;
  daysUntilLastDeadline: number;
  autoDetected: boolean;
}

function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try { return JSON.parse(jsonString) as T; }
  catch { return fallback; }
}

const TASK_TYPE_HOURS: Record<DeathWeekTaskType, number> = {
  exam: 12, project: 15, assignment: 6, quiz: 4, presentation: 8, lab_report: 6,
};

const TASK_TYPE_VERB: Record<DeathWeekTaskType, string> = {
  exam: 'Study for', project: 'Work on', assignment: 'Complete',
  quiz: 'Prepare for', presentation: 'Prepare', lab_report: 'Write',
};

function calculateUrgency(daysLeft: number, progress: number, hoursRemaining: number): {
  urgency: RankedRecommendation['urgency']; score: number;
} {
  if (daysLeft <= 0) return { urgency: 'overdue', score: 1000 };
  const timePressure = 1 / Math.max(daysLeft, 0.5);
  const workRemaining = (100 - progress) / 100;
  const effortFactor = hoursRemaining * timePressure;
  const score = (timePressure * 50) + (workRemaining * 30) + (effortFactor * 20);

  let urgency: RankedRecommendation['urgency'];
  if (daysLeft <= 1) urgency = 'critical';
  else if (daysLeft <= 3 && progress < 60) urgency = 'critical';
  else if (daysLeft <= 3) urgency = 'urgent';
  else if (daysLeft <= 5 && progress < 40) urgency = 'urgent';
  else if (daysLeft <= 7) urgency = 'moderate';
  else urgency = 'low';

  return { urgency, score };
}

function generateRecommendations(tasks: DeadlineTask[]): RankedRecommendation[] {
  const now = Date.now();
  const scored = tasks
    .filter(t => !t.isCompleted)
    .map(task => {
      const dueDate = new Date(task.dueDate).getTime();
      const daysLeft = Math.max(0, (dueDate - now) / 86400000);
      const hoursRemaining = Math.max(0, task.estimatedHours - task.hoursSpent);
      const { urgency, score } = calculateUrgency(daysLeft, task.progress, hoursRemaining);
      return { task, daysLeft, hoursRemaining, urgency, score };
    });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((item, index) => {
    const { task, daysLeft, hoursRemaining, urgency } = item;
    const minDailyHours = daysLeft > 0 ? Math.ceil((hoursRemaining / daysLeft) * 10) / 10 : hoursRemaining;

    let reasoning = '';
    if (daysLeft <= 0) reasoning = `OVERDUE! "${task.title}" was due already. ${hoursRemaining}h of work still remaining at ${task.progress}% progress. Drop everything and finish this now.`;
    else if (daysLeft <= 1) reasoning = `"${task.title}" is due tomorrow with only ${task.progress}% done. You need ${minDailyHours}h minimum today to have a chance. This is your #1 priority.`;
    else if (daysLeft <= 3 && task.progress < 50) reasoning = `"${task.title}" is due in ${Math.ceil(daysLeft)} day${Math.ceil(daysLeft) > 1 ? 's' : ''} but you're only ${task.progress}% done. Dedicate at least ${minDailyHours}h daily to catch up before it's too late.`;
    else if (task.progress < 30) reasoning = `"${task.title}" barely started at ${task.progress}%. With ${Math.ceil(daysLeft)} days left and ${hoursRemaining}h needed, start putting in ${minDailyHours}h per day now to avoid a last-minute panic.`;
    else if (task.progress >= 70) reasoning = `"${task.title}" is ${task.progress}% done — you're on track! Just ${hoursRemaining}h remaining over ${Math.ceil(daysLeft)} days. Keep the momentum with ${minDailyHours}h daily.`;
    else reasoning = `"${task.title}" at ${task.progress}% with ${Math.ceil(daysLeft)} days left. Spend ${minDailyHours}h daily to stay on schedule and avoid falling behind.`;

    return {
      taskId: task.id, taskTitle: task.title, courseName: task.courseName,
      rank: index + 1, minimumHours: Math.max(1, Math.ceil(hoursRemaining)),
      hoursRemaining: Math.ceil(hoursRemaining * 10) / 10, minDailyHours, reasoning,
      actionVerb: TASK_TYPE_VERB[task.taskType], urgency, daysLeft: Math.ceil(daysLeft),
    };
  });
}

function getMockDeadlines(): DeadlineTask[] {
  const now = new Date();
  return [
    { id: 'dl-1', title: 'Algorithm Assignment #5', courseName: 'Data Structures & Algorithms', taskType: 'assignment' as const, dueDate: new Date(now.getTime() + 1.5 * 86400000).toISOString(), estimatedHours: 6, hoursSpent: 1, progress: 15, isAutoDetected: true, isCompleted: false },
    { id: 'dl-2', title: 'Database Design Project', courseName: 'Database Systems', taskType: 'project' as const, dueDate: new Date(now.getTime() + 3 * 86400000).toISOString(), estimatedHours: 15, hoursSpent: 4, progress: 25, isAutoDetected: true, isCompleted: false },
    { id: 'dl-3', title: 'OS Midterm Exam', courseName: 'Operating Systems', taskType: 'exam' as const, dueDate: new Date(now.getTime() + 4 * 86400000).toISOString(), estimatedHours: 12, hoursSpent: 2, progress: 15, isAutoDetected: true, isCompleted: false },
    { id: 'dl-4', title: 'Linear Algebra Quiz #4', courseName: 'Linear Algebra', taskType: 'quiz' as const, dueDate: new Date(now.getTime() + 2 * 86400000).toISOString(), estimatedHours: 4, hoursSpent: 2.5, progress: 60, isAutoDetected: true, isCompleted: false },
    { id: 'dl-5', title: 'Network Protocol Presentation', courseName: 'Computer Networks', taskType: 'presentation' as const, dueDate: new Date(now.getTime() + 6 * 86400000).toISOString(), estimatedHours: 8, hoursSpent: 1, progress: 10, isAutoDetected: true, isCompleted: false },
    { id: 'dl-6', title: 'OOP Lab Report', courseName: 'Object-Oriented Programming', taskType: 'lab_report' as const, dueDate: new Date(now.getTime() + 5 * 86400000).toISOString(), estimatedHours: 6, hoursSpent: 3, progress: 50, isAutoDetected: true, isCompleted: false },
  ];
}

async function fetchStudentDeadlines(userId: string): Promise<{ tasks: DeadlineTask[]; autoDetected: boolean; deadlinesThisWeek: number }> {
  const now = Date.now();
  const oneWeekFromNow = now + 7 * 86400000;

  const enrollments = await db.enrollment.findMany({
    where: { studentId: userId },
    select: { courseId: true, course: { select: { name: true } } },
  });

  const courseIds = enrollments.map(e => e.courseId);
  const courseNames = new Map(enrollments.map(e => [e.courseId, e.course.name]));

  const hasEnrollments = courseIds.length > 0;

  const [assignments, quizzes] = await Promise.all([
    hasEnrollments
      ? db.assignment.findMany({
          where: { courseId: { in: courseIds }, dueDate: { gte: new Date(now), lte: new Date(oneWeekFromNow) } },
        })
      : Promise.resolve([]),
    db.quiz.findMany({
      where: {
        teacherId: { not: null },
        dueDate: { not: null, gte: new Date(now), lte: new Date(oneWeekFromNow) },
        ...(hasEnrollments ? { topic: { courseId: { in: courseIds } } } : {}),
      },
      include: { topic: { select: { courseId: true, name: true } } },
    }),
  ]);

  const tasks: DeadlineTask[] = [
    ...assignments.map(a => ({
      id: `assign-${a.id}`,
      title: a.title,
      courseName: courseNames.get(a.courseId) ?? 'Unknown Course',
      taskType: a.taskType as DeathWeekTaskType,
      dueDate: a.dueDate.toISOString(),
      estimatedHours: a.estimatedHours ?? TASK_TYPE_HOURS[a.taskType as DeathWeekTaskType] ?? 6,
      hoursSpent: 0,
      progress: 0,
      isAutoDetected: true,
      isCompleted: false,
    })),
    ...quizzes.map(q => ({
      id: `quiz-${q.id}`,
      title: q.title,
      courseName: courseNames.get(q.topic.courseId) ?? q.topic.name,
      taskType: 'quiz' as DeathWeekTaskType,
      dueDate: q.dueDate!.toISOString(),
      estimatedHours: TASK_TYPE_HOURS.quiz,
      hoursSpent: 0,
      progress: 0,
      isAutoDetected: true,
      isCompleted: false,
    })),
  ];

  const activeTasks = tasks.filter(t => {
    const due = new Date(t.dueDate).getTime();
    return due >= now && due <= oneWeekFromNow && !t.isCompleted;
  });

  return {
    tasks,
    autoDetected: activeTasks.length >= 3,
    deadlinesThisWeek: activeTasks.length,
  };
}

function buildDeathWeekState(tasks: DeadlineTask[], trigger: 'auto' | 'manual', existingId?: string): DeathWeekState {
  const now = Date.now();
  const recommendations = generateRecommendations(tasks);
  const totalHoursRemaining = tasks.filter(t => !t.isCompleted).reduce((sum, t) => sum + Math.max(0, t.estimatedHours - t.hoursSpent), 0);
  const activeDeadlines = tasks.filter(t => !t.isCompleted).map(t => new Date(t.dueDate).getTime());
  const daysUntilLastDeadline = activeDeadlines.length > 0 ? Math.max(0, Math.ceil((Math.max(...activeDeadlines) - now) / 86400000)) : 0;
  const isActive = tasks.some(t => !t.isCompleted);
  return {
    id: existingId ?? `dw-${Date.now()}`,
    isActive, trigger, activatedAt: new Date().toISOString(),
    tasks, recommendations,
    totalHoursRemaining: Math.ceil(totalHoursRemaining * 10) / 10,
    daysUntilLastDeadline, autoDetected: trigger === 'auto',
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ success: true, data: null, meta: { autoDetected: false, deadlinesThisWeek: 0 } });
    }

    const existingPlan = await db.deathWeekPlan.findFirst({
      where: { userId }, orderBy: { updatedAt: 'desc' },
    });

    if (existingPlan) {
      const storedTasks = safeJsonParse<DeadlineTask[]>(existingPlan.subjects, []);
      if (storedTasks && Array.isArray(storedTasks) && storedTasks.length > 0) {
        const hasActiveTasks = storedTasks.some(t => !t.isCompleted);
        if (hasActiveTasks) {
          const trigger = safeJsonParse<'auto' | 'manual'>(existingPlan.schedule, 'auto');
          const state = buildDeathWeekState(storedTasks, trigger, existingPlan.id);
          return NextResponse.json({ success: true, data: state, meta: { autoDetected: trigger === 'auto', deadlinesThisWeek: storedTasks.filter(t => !t.isCompleted).length } });
        } else {
          await db.deathWeekPlan.delete({ where: { id: existingPlan.id } }).catch(() => {});
        }
      } else {
        await db.deathWeekPlan.delete({ where: { id: existingPlan.id } }).catch(() => {});
      }
    }

    const { tasks, autoDetected, deadlinesThisWeek } = await fetchStudentDeadlines(userId);

    return NextResponse.json({ success: true, data: null, meta: { autoDetected, deadlinesThisWeek } });
  } catch (error) {
    console.error('Planner GET error:', error);
    return NextResponse.json({ success: true, data: null, meta: { autoDetected: false, deadlinesThisWeek: 0 } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body as {
      action: 'activate' | 'deactivate' | 'update_progress' | 'add_task' | 'complete_task';
      data?: Record<string, unknown>;
    };

    switch (action) {
      case 'activate': return handleActivate(data);
      case 'deactivate': return handleDeactivate();
      case 'update_progress': return handleUpdateProgress(data);
      case 'add_task': return handleAddTask(data);
      case 'complete_task': return handleCompleteTask(data);
      default:
        return NextResponse.json({ success: false, error: 'Invalid action. Use: activate, deactivate, update_progress, add_task, complete_task' }, { status: 400 });
    }
  } catch (error) {
    console.error('Planner POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}

async function handleActivate(data?: Record<string, unknown>) {
  const userId = await resolveUserId();
  const trigger = (data?.trigger as 'auto' | 'manual') ?? 'manual';

  if (!userId) {
    const { tasks } = await fetchStudentDeadlines('');
    const state = buildDeathWeekState(tasks.length > 0 ? tasks : getMockDeadlines(), trigger);
    return NextResponse.json({ success: true, data: state });
  }

  const existingPlan = await db.deathWeekPlan.findFirst({
    where: { userId }, orderBy: { updatedAt: 'desc' },
  });

  let tasks: DeadlineTask[];
  let planId: string | undefined;

  if (existingPlan) {
      const stored = safeJsonParse<DeadlineTask[] | null>(existingPlan.subjects, null);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        const hasActiveTasks = stored.some(t => !t.isCompleted);
        if (hasActiveTasks) { tasks = stored; planId = existingPlan.id; }
        else { await db.deathWeekPlan.delete({ where: { id: existingPlan.id } }).catch(() => {}); const r = await fetchStudentDeadlines(userId); tasks = r.tasks; }
      } else { await db.deathWeekPlan.delete({ where: { id: existingPlan.id } }).catch(() => {}); const r = await fetchStudentDeadlines(userId); tasks = r.tasks; }
    } else { const r = await fetchStudentDeadlines(userId); tasks = r.tasks; }

  const state = buildDeathWeekState(tasks, trigger, planId);

  if (planId) {
    await db.deathWeekPlan.update({
      where: { id: planId },
      data: { subjects: JSON.stringify(tasks), schedule: JSON.stringify(trigger), startDate: new Date(), endDate: new Date(Date.now() + state.daysUntilLastDeadline * 86400000), updatedAt: new Date() },
    });
  } else {
    await db.deathWeekPlan.create({
      data: { id: state.id, userId, weekName: 'Death Week', startDate: new Date(), endDate: new Date(Date.now() + state.daysUntilLastDeadline * 86400000), subjects: JSON.stringify(tasks), schedule: JSON.stringify(trigger), goals: JSON.stringify([]), progress: 0 },
    });
  }

  return NextResponse.json({ success: true, data: state });
}

async function handleDeactivate() {
  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ success: true, data: null });

  const existingPlan = await db.deathWeekPlan.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  if (existingPlan) await db.deathWeekPlan.delete({ where: { id: existingPlan.id } });
  return NextResponse.json({ success: true, data: null });
}

async function handleUpdateProgress(data?: Record<string, unknown>) {
  const userId = await resolveUserId();

  const { taskId, progress } = (data ?? {}) as { taskId: string; progress: number };
  if (!taskId || progress === undefined) {
    return NextResponse.json({ success: false, error: 'taskId and progress (0-100) are required' }, { status: 400 });
  }

  if (!userId) return NextResponse.json({ success: false, error: 'No active death week plan found' }, { status: 404 });

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const existingPlan = await db.deathWeekPlan.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  if (!existingPlan) return NextResponse.json({ success: false, error: 'No active death week plan found' }, { status: 404 });

  const tasks = safeJsonParse<DeadlineTask[]>(existingPlan.subjects, []);
  const updatedTasks = tasks.map(t => {
    if (t.id !== taskId) return t;
    const newHoursSpent = (clampedProgress / 100) * t.estimatedHours;
    return { ...t, progress: clampedProgress, hoursSpent: Math.round(newHoursSpent * 10) / 10, isCompleted: clampedProgress >= 100 };
  });

  const trigger = safeJsonParse<'auto' | 'manual'>(existingPlan.schedule, 'auto');
  const state = buildDeathWeekState(updatedTasks, trigger, existingPlan.id);

  await db.deathWeekPlan.update({ where: { id: existingPlan.id }, data: { subjects: JSON.stringify(updatedTasks), updatedAt: new Date() } });
  return NextResponse.json({ success: true, data: state });
}

async function handleAddTask(data?: Record<string, unknown>) {
  const userId = await resolveUserId();

  const { title, courseName, taskType, dueDate, estimatedHours } = (data ?? {}) as {
    title: string; courseName: string; taskType: DeathWeekTaskType; dueDate: string; estimatedHours?: number;
  };
  if (!title || !courseName || !taskType || !dueDate) {
    return NextResponse.json({ success: false, error: 'title, courseName, taskType, and dueDate are required' }, { status: 400 });
  }

  if (!userId) {
    const { tasks } = await fetchStudentDeadlines('');
    const newTask: DeadlineTask = {
      id: `manual-${Date.now()}`, title, courseName, taskType,
      dueDate, estimatedHours: estimatedHours ?? TASK_TYPE_HOURS[taskType] ?? 6,
      hoursSpent: 0, progress: 0, isAutoDetected: false, isCompleted: false,
    };
    const state = buildDeathWeekState([...tasks, newTask], 'manual');
    return NextResponse.json({ success: true, data: state });
  }

  const existingPlan = await db.deathWeekPlan.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  const tasks = existingPlan ? safeJsonParse<DeadlineTask[]>(existingPlan.subjects, []) : (await fetchStudentDeadlines(userId)).tasks;

  const newTask: DeadlineTask = {
    id: `manual-${Date.now()}`, title, courseName, taskType,
    dueDate, estimatedHours: estimatedHours ?? TASK_TYPE_HOURS[taskType] ?? 6,
    hoursSpent: 0, progress: 0, isAutoDetected: false, isCompleted: false,
  };

  const updatedTasks = [...tasks, newTask];
  const trigger = existingPlan ? safeJsonParse<'auto' | 'manual'>(existingPlan.schedule, 'manual') : 'manual';
  const state = buildDeathWeekState(updatedTasks, trigger, existingPlan?.id);

  if (existingPlan) {
    await db.deathWeekPlan.update({ where: { id: existingPlan.id }, data: { subjects: JSON.stringify(updatedTasks), schedule: JSON.stringify(trigger), updatedAt: new Date() } });
  } else {
    await db.deathWeekPlan.create({ data: { userId, weekName: 'Death Week', startDate: new Date(), endDate: new Date(Date.now() + 14 * 86400000), subjects: JSON.stringify(updatedTasks), schedule: JSON.stringify(trigger), goals: JSON.stringify([]), progress: 0 } });
  }

  return NextResponse.json({ success: true, data: state });
}

async function handleCompleteTask(data?: Record<string, unknown>) {
  const userId = await resolveUserId();

  const { taskId } = (data ?? {}) as { taskId: string };
  if (!taskId) return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });

  if (!userId) return NextResponse.json({ success: false, error: 'No active death week plan found' }, { status: 404 });

  const existingPlan = await db.deathWeekPlan.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  if (!existingPlan) return NextResponse.json({ success: false, error: 'No active death week plan found' }, { status: 404 });

  const tasks = safeJsonParse<DeadlineTask[]>(existingPlan.subjects, []);
  const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isCompleted: true, progress: 100, hoursSpent: t.estimatedHours } : t);

  const trigger = safeJsonParse<'auto' | 'manual'>(existingPlan.schedule, 'auto');
  const state = buildDeathWeekState(updatedTasks, trigger, existingPlan.id);

  await db.deathWeekPlan.update({ where: { id: existingPlan.id }, data: { subjects: JSON.stringify(updatedTasks), updatedAt: new Date() } });
  return NextResponse.json({ success: true, data: state });
}
