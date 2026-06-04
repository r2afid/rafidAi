import { type PageKey } from '@/stores/app'
import type React from 'react'

import GrowthDashboard from '@/components/dashboard/GrowthDashboard'
import AITutor from '@/components/tutor/AITutor'
import QuizPage from '@/components/quiz/QuizPage'
import DigitalTwin from '@/components/digital-twin/DigitalTwin'
import ExplainMistake from '@/components/explain-mistake/ExplainMistake'
import EngagementTracker from '@/components/engagement/EngagementTracker'
import Gamification from '@/components/gamification/Gamification'
import Notifications from '@/components/notifications/Notifications'
import TeacherNotifications from '@/components/notifications/TeacherNotifications'
import TeacherDashboard from '@/components/teacher/TeacherDashboard'
import CourseManager from '@/components/teacher/CourseManager'
import QuizManager from '@/components/teacher/QuizManager'
import Wellbeing from '@/components/wellbeing/Wellbeing'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer'
import ExamRoutine from '@/components/tools/ExamRoutine'
import PeerLeaderboard from '@/components/leaderboard/PeerLeaderboard'
import StudyNotes from '@/components/notes/StudyNotes'
import CourseCatalog from '@/components/courses/CourseCatalog'
import StudyPlanner from '@/components/planner/StudyPlanner'
import DeathWeekPlanner from '@/components/death-week-planner/DeathWeekPlanner'
import ProfileSettings from '@/components/profile/ProfileSettings'
import TeacherProfileSettings from '@/components/profile/TeacherProfileSettings'
import DiscussionForum from '@/components/forum/DiscussionForum'
import ResourceLibrary from '@/components/resources/ResourceLibrary'
import GradeTracker from '@/components/grades/GradeTracker'
import PeerComparison from '@/components/peer-comparison/PeerComparison'

import {
  BarChart3, Bot, Brain, Flame, Bell, GraduationCap,
  LineChart, Search, Shield, Sun, Moon, Menu, AlertTriangle,
  Activity, Trophy, Sparkles,
  BookOpen, Target, Zap, LayoutDashboard,
  CheckCheck, CheckCircle2, MessageSquare, Award, Star,
  Timer, Users, StickyNote, Clock,
  Library, CalendarDays, UserCircle, Settings,
  FolderOpen, LogOut, ChevronDown,
} from 'lucide-react'

export const aiToolGroups = ['AI Tools', 'Wellbeing', 'Analytics']

export interface NavItem {
  key: PageKey
  label: string
  icon: React.ElementType
  group: string
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Growth Dashboard', icon: BarChart3, group: 'Analytics' },
  { key: 'tutor', label: 'AI Tutor', icon: Bot, group: 'AI Tools' },
  { key: 'quiz', label: 'Quiz Generator', icon: Brain, group: 'AI Tools' },
  { key: 'digital-twin', label: 'Digital Twin', icon: Sparkles, group: 'Simulation' },
  { key: 'explain-mistake', label: 'Explain My Mistake', icon: Search, group: 'AI Tools' },
  { key: 'engagement', label: 'Engagement Tracker', icon: Activity, group: 'Analytics' },
  { key: 'peer-comparison', label: 'CGPA Predictor', icon: Users, group: 'Analytics' },
  { key: 'gamification', label: 'Gamification', icon: Trophy, group: 'Progress' },
  { key: 'notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { key: 'teacher', label: 'Teacher Dashboard', icon: GraduationCap, group: 'Admin' },
  { key: 'course-manager', label: 'Course Manager', icon: BookOpen, group: 'Admin' },
  { key: 'quiz-manager', label: 'Quiz Manager', icon: Brain, group: 'Admin' },
  { key: 'wellbeing', label: 'Wellbeing Support', icon: Shield, group: 'Wellbeing' },
  { key: 'pomodoro', label: 'Pomodoro Timer', icon: Timer, group: 'Tools' },
  { key: 'exam-routine', label: 'Exam Routine', icon: CalendarDays, group: 'Tools' },
  { key: 'leaderboard', label: 'Leaderboard', icon: Users, group: 'Progress' },
  { key: 'notes', label: 'Study Notes', icon: StickyNote, group: 'Tools' },
  { key: 'courses', label: 'Course Catalog', icon: Library, group: 'Learning' },
  { key: 'planner', label: 'Study Planner', icon: CalendarDays, group: 'Tools' },
  { key: 'death-week-planner', label: 'Death Week Planner', icon: Flame, group: 'Tools' },
  { key: 'profile', label: 'Profile & Settings', icon: UserCircle, group: 'Account' },
  { key: 'forum', label: 'Discussion Forum', icon: MessageSquare, group: 'Community' },
  { key: 'resources', label: 'Resource Library', icon: FolderOpen, group: 'Learning' },
  { key: 'grades', label: 'Grade Tracker', icon: GraduationCap, group: 'Analytics' },
]

export const pageLabels = (isTeacher: boolean): Record<PageKey, string> => ({
  'dashboard': 'Student Growth Dashboard',
  'tutor': 'AI Tutor',
  'quiz': 'AI Quiz Generator',
  'digital-twin': 'Digital Twin Simulation',
  'explain-mistake': 'Explain My Mistake',
  'peer-comparison': 'CGPA Predictor',
  'engagement': 'Passive Learning Detection',
  'gamification': 'Gamified Progress',
  'notifications': isTeacher ? 'Teacher Notifications' : 'Smart Notifications',
  'teacher': 'Teacher Dashboard',
  'course-manager': 'Course Manager',
  'quiz-manager': 'Quiz Manager',
  'wellbeing': 'AI Wellbeing Support',
  'pomodoro': 'Pomodoro Timer',
  'exam-routine': 'Exam Routine',
  'leaderboard': 'Peer Leaderboard',
  'notes': 'Study Notes',
  'courses': 'Course Catalog',
  'planner': 'Study Planner',
  'death-week-planner': 'Death Week Planner',
  'profile': isTeacher ? 'Teacher Profile' : 'Profile & Settings',
  'forum': 'Discussion Forum',
  'resources': 'Resource Library',
  'grades': 'Grade Tracker',
})

export const pageComponents: Record<PageKey, React.ComponentType> = {
  'dashboard': GrowthDashboard,
  'tutor': AITutor,
  'quiz': QuizPage,
  'digital-twin': DigitalTwin,
  'explain-mistake': ExplainMistake,
  'peer-comparison': PeerComparison,
  'engagement': EngagementTracker,
  'gamification': Gamification,
  'notifications': Notifications,
  'teacher': TeacherDashboard,
  'course-manager': CourseManager,
  'quiz-manager': QuizManager,
  'wellbeing': Wellbeing,
  'pomodoro': PomodoroTimer,
  'exam-routine': ExamRoutine,
  'leaderboard': PeerLeaderboard,
  'notes': StudyNotes,
  'courses': CourseCatalog,
  'planner': StudyPlanner,
  'death-week-planner': DeathWeekPlanner,
  'profile': ProfileSettings,
  'forum': DiscussionForum,
  'resources': ResourceLibrary,
  'grades': GradeTracker,
}

export const teacherPageComponents: Record<string, React.ComponentType> = {
  'notifications': TeacherNotifications,
  'profile': TeacherProfileSettings,
}

// Mobile tab bar priority items (first 4 shown directly, rest in "More")
export const mobileTabKeys: PageKey[] = [
  'dashboard', 'tutor', 'quiz', 'planner', 'courses',
]

export const mobileMoreKeys: PageKey[] = [
  'pomodoro', 'notes', 'leaderboard', 'gamification', 'forum',
  'resources', 'grades', 'death-week-planner', 'profile',
  'notifications', 'peer-comparison', 'digital-twin', 'wellbeing',
]
