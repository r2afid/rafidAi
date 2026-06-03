export type DeathWeekTaskType = 'exam' | 'project' | 'assignment' | 'quiz' | 'presentation' | 'lab_report';

export interface DeadlineTask {
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

export interface RankedRecommendation {
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

export interface DeathWeekState {
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

export interface PlannerMeta {
  autoDetected: boolean;
  deadlinesThisWeek: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PlannerMeta;
}
