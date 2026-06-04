"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Edit3,
  Save,
  X,
  Clock,
  Target,
  Bell,
  Moon,
  Sun,
  Award,
  Star,
  Zap,
  Trophy,
  Lock,
  Download,
  Trash2,
  TrendingUp,
  CalendarDays,
  Flame,
  Brain,
  Code,
  Palette,
  Shield,
  CheckCircle2,
  Loader2,
  ChevronDown,
  FileText,
  Presentation as PresentationIcon,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ────────────────────────────────────────
// Badge Icon Map
// ────────────────────────────────────────

const BADGE_ICONS: Record<string, React.ReactNode> = {
  'First Steps': <Star className="h-5 w-5" />,
  'Dedicated Learner': <BookOpen className="h-5 w-5" />,
  'Knowledge Seeker': <Brain className="h-5 w-5" />,
  'Week Warrior': <Flame className="h-5 w-5" />,
  'Consistency King': <Trophy className="h-5 w-5" />,
  'Quiz Ace': <Target className="h-5 w-5" />,
  'Study Marathon': <Zap className="h-5 w-5" />,
}

const BADGE_COLORS: Record<string, string> = {
  'First Steps': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40',
  'Dedicated Learner': 'text-teal-600 bg-teal-100 dark:bg-teal-950/40',
  'Knowledge Seeker': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40',
  'Week Warrior': 'text-rose-600 bg-rose-100 dark:bg-rose-950/40',
  'Consistency King': 'text-amber-600 bg-amber-100 dark:bg-amber-950/40',
  'Quiz Ace': 'text-amber-600 bg-amber-100 dark:bg-amber-950/40',
  'Study Marathon': 'text-teal-600 bg-teal-100 dark:bg-teal-950/40',
}

const DEFAULT_PREFERENCES = {
  studyTime: "evening" as "morning" | "afternoon" | "evening",
  dailyGoal: 3,
  emailNotifications: true,
  pushNotifications: false,
  weeklyReport: true,
  darkMode: false,
};

// Generate 12 weeks of activity data (84 days)
function generateActivityData(): number[] {
  const data: number[] = [];
  const now = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    // Simulate realistic study patterns
    if (dayOfWeek === 0) {
      data.push(Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0);
    } else if (dayOfWeek === 5) {
      data.push(Math.floor(Math.random() * 3) + 1);
    } else if (dayOfWeek === 6) {
      data.push(Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 1 : 0);
    } else {
      data.push(Math.floor(Math.random() * 4) + 1);
    }
  }
  return data;
}

// ────────────────────────────────────────
// Activity Graph
// ────────────────────────────────────────

const ACTIVITY_COLORS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-900/60",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
  "bg-emerald-700 dark:bg-emerald-400",
];

const ACTIVITY_LABELS = ["No activity", "1-30 min", "31-60 min", "1-2 hrs", "2+ hrs"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function ActivityGraph({ data }: { data: number[] }) {
  const weeks: number[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex gap-[3px] pl-8">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
          (month) => (
            <div
              key={month}
              className="flex-1 text-[10px] text-muted-foreground text-center"
            >
              {month}
            </div>
          )
        )}
      </div>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pt-0">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-[13px] w-7 flex items-center justify-end pr-1 text-[10px] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px] flex-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((level, di) => (
                <Tooltip key={`${wi}-${di}`}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: (wi * 7 + di) * 0.003,
                        duration: 0.2,
                      }}
                      className={cn(
                        "h-[13px] w-[13px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
                        ACTIVITY_COLORS[level]
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {ACTIVITY_LABELS[level]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {ACTIVITY_COLORS.map((color, i) => (
          <div
            key={i}
            className={cn("h-[13px] w-[13px] rounded-sm", color)}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

export default function ProfileSettings() {
  const authUser = useAuthStore((s) => s.user)
  const [user, setUser] = useState({ name: authUser?.name || "", email: authUser?.email || "", studentId: authUser?.studentId || "", university: authUser?.institution || "", phone: "", semester: "" });
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", studentId: "", university: "", phone: "", semester: "" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [openPrefSection, setOpenPrefSection] = useState<string | null>("schedule");
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUser?.id) return
    setLoading(true)
    fetch(`/api/profile?student_id=${authUser.id}`)
      .then(r => r.json())
      .then(data => {
        setProfileData(data)
        setUser(prev => ({
          ...prev,
          name: authUser?.name || data.user.name || prev.name,
          email: authUser?.email || data.user.email || prev.email,
          studentId: authUser?.studentId || data.user.studentId || prev.studentId,
          university: authUser?.institution || data.user.institution || prev.university,
          phone: data.user.phone || '',
          semester: data.user.semester || '',
        }))
      })
      .catch(() => toast.error("Failed to load profile data"))
      .finally(() => setLoading(false))
  }, [authUser?.id])

  const activityData = useMemo(() => {
    if (profileData?.activity) return profileData.activity
    return Array(84).fill(0)
  }, [profileData])

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const xpData = profileData?.progress || { xp: 0, level: 1, levelTitle: 'Beginner', currentLevelXP: 0, nextLevelXP: 500, prevLevelXP: 0, xpProgress: 0 }
  const xpProgress = xpData.xpProgress
  const earnedBadges = (profileData?.badges || []).filter((b: any) => b.earned)
  const totalBadges = profileData?.badges?.length || 0
  const creditsCompleted = profileData?.academic?.creditsCompleted || 0
  const creditsTotal = profileData?.academic?.creditsTotal || 160
  const creditsProgress = creditsTotal > 0 ? Math.round((creditsCompleted / creditsTotal) * 100) : 0

  const handleSaveProfile = () => {
    setUser(editForm);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  const handleExportData = () => {
    toast.success("Your data export has been started. You'll receive a download link via email.");
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmOpen(false);
    toast.success("Account deletion requested. You'll receive a confirmation email.");
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.newPass.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPasswordOpen(false);
    setPasswords({ current: "", newPass: "", confirm: "" });
    toast.success("Password changed successfully!");
  };

  // ────────────────────────────────────────
  // Animation variants
  // ────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── 1. Profile Header ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden relative">
          {/* Gradient banner */}
          <div className="h-28 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          </div>
          <CardContent className="pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 shadow-lg">
                  <div className="bg-background rounded-full p-[3px]">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
              </div>

              {/* Name + info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 w-fit mx-auto sm:mx-0">
                    {user.studentId}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.university || authUser?.institution}
                </p>
              </div>

              {/* Edit button */}
              <Button
                onClick={() => {
                  setEditForm(user);
                  setIsEditing(true);
                }}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 2. Personal Information ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Personal Information
              </CardTitle>
              <CardDescription>
                Manage your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sid">Student ID</Label>
                      <Input
                        id="edit-sid"
                        value={editForm.studentId}
                        onChange={(e) =>
                          setEditForm({ ...editForm, studentId: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-uni">University</Label>
                      <Input
                        id="edit-uni"
                        value={editForm.university}
                        onChange={(e) =>
                          setEditForm({ ...editForm, university: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sem">Semester</Label>
                      <Input
                        id="edit-sem"
                        value={editForm.semester}
                        onChange={(e) =>
                          setEditForm({ ...editForm, semester: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: "Full Name", value: user.name },
                    { icon: Mail, label: "Email", value: user.email },
                    { icon: Phone, label: "Phone", value: user.phone || 'N/A' },
                    { icon: GraduationCap, label: "Student ID", value: user.studentId },
                    { icon: Building2, label: "University", value: user.university },
                    { icon: CalendarDays, label: "Semester", value: user.semester || 'N/A' },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <field.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {field.label}
                        </p>
                        <p className="text-sm font-medium truncate">
                          {field.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 3. Study Preferences ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
                  <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                Study Preferences
              </CardTitle>
              <CardDescription>
                Customize your study experience and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {[
                {
                  id: 'schedule',
                  icon: Clock,
                  label: 'Schedule',
                  summary: `${preferences.studyTime}, ${preferences.dailyGoal}h/day`,
                  color: 'text-teal-600 dark:text-teal-400',
                  bgColor: 'bg-teal-100 dark:bg-teal-950/40',
                },
                {
                  id: 'notifications',
                  icon: Bell,
                  label: 'Notifications',
                  summary: `${[preferences.emailNotifications && 'Email', preferences.pushNotifications && 'Push', preferences.weeklyReport && 'Weekly'].filter(Boolean).join(', ') || 'None'}`,
                  color: 'text-amber-600 dark:text-amber-400',
                  bgColor: 'bg-amber-100 dark:bg-amber-950/40',
                },
                {
                  id: 'appearance',
                  icon: Moon,
                  label: 'Appearance',
                  summary: preferences.darkMode ? 'Dark' : 'Light',
                  color: 'text-purple-600 dark:text-purple-400',
                  bgColor: 'bg-purple-100 dark:bg-purple-950/40',
                },
              ].map((section) => {
                const isOpen = openPrefSection === section.id
                return (
                  <div key={section.id} className="border-b border-border/50 last:border-b-0">
                    <button
                      onClick={() => setOpenPrefSection(isOpen ? null : section.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', section.bgColor)}>
                        <section.icon className={cn('h-4 w-4', section.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{section.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{section.summary}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-1 space-y-4">
                            {section.id === 'schedule' && (
                              <>
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    Preferred Study Time
                                  </Label>
                                  <Select
                                    value={preferences.studyTime}
                                    onValueChange={(val) =>
                                      setPreferences({ ...preferences, studyTime: val as "morning" | "afternoon" | "evening" })
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="morning">
                                        <span className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-amber-500" /> Morning (6AM-12PM)</span>
                                      </SelectItem>
                                      <SelectItem value="afternoon">
                                        <span className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-orange-500" /> Afternoon (12PM-6PM)</span>
                                      </SelectItem>
                                      <SelectItem value="evening">
                                        <span className="flex items-center gap-2"><Moon className="h-3.5 w-3.5 text-teal-500" /> Evening (6PM-12AM)</span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <TrendingUp className="h-3.5 w-3.5" />
                                      Daily Study Goal
                                    </Label>
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{preferences.dailyGoal}h</span>
                                  </div>
                                  <Slider
                                    value={[preferences.dailyGoal]}
                                    onValueChange={([val]) => setPreferences({ ...preferences, dailyGoal: val })}
                                    min={1} max={8} step={1}
                                    className="[&>[data-slot=slider-track]]:bg-emerald-100 dark:[&>[data-slot=slider-track]]:bg-emerald-950/40 [&>[data-slot=slider-range]]:bg-emerald-500 [&>[data-slot=slider-thumb]]:border-emerald-500"
                                  />
                                  <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                                    <span>1 hr</span>
                                    <span>8 hrs</span>
                                  </div>
                                </div>
                              </>
                            )}
                            {section.id === 'notifications' && (
                              <>
                                {[
                                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive study reminders via email', cls: 'data-[state=checked]:bg-emerald-500' },
                                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get real-time browser notifications', cls: 'data-[state=checked]:bg-teal-500' },
                                  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive a weekly progress summary', cls: 'data-[state=checked]:bg-amber-500' },
                                ].map((n) => (
                                  <div key={n.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium">{n.label}</p>
                                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                                      </div>
                                    </div>
                                    <Switch
                                      checked={(preferences as any)[n.key]}
                                      onCheckedChange={(checked) => setPreferences({ ...preferences, [n.key]: checked })}
                                      className={n.cls}
                                    />
                                  </div>
                                ))}
                              </>
                            )}
                            {section.id === 'appearance' && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium">Dark Mode</p>
                                    <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={preferences.darkMode}
                                  onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
                                  className="data-[state=checked]:bg-purple-500"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 4. Academic Overview ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Academic Overview
              </CardTitle>
              <CardDescription>
                {profileData?.academic?.totalQuizzes ?? 0} quizzes taken &middot;{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {profileData?.academic?.avgScore ?? 0}% avg score
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {profileData?.academic?.avgScore ?? 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Avg Quiz</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-3 text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {profileData?.academic?.totalQuizzes ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Quizzes</p>
                </div>
              </div>

              <Separator />

              {/* Enrolled Courses with Attendance */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Current Courses
                </p>
                <div className="space-y-3">
                  {(profileData?.academic?.enrollments?.length > 0 ? profileData.academic.enrollments : [{ id: 'fallback', code: 'N/A', name: 'No courses', attendance: 0 }]).map((course: any, i: number) => (
                    <div key={course.id || `${course.code}-${i}`} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
                            {course.code}
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted transition-colors group">
                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                  {course.name}
                                </span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="bottom" align="start" className="w-72 p-0 overflow-hidden rounded-2xl shadow-xl border-foreground/10">
                              <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-5 py-4">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                                      <ClipboardList className="h-4 w-4 text-white" />
                                    </div>
                                    <p className="text-sm font-semibold text-white">{course.code}</p>
                                  </div>
                                  <div className="rounded-full bg-white/20 backdrop-blur px-2.5 py-0.5">
                                    <p className="text-[10px] font-medium text-white/90 uppercase tracking-wider">Grade Report</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 space-y-1.5">
                                {(() => {
                                  const quizAvg = profileData?.academic?.avgScore ?? 0
                                  const attendancePct = course.attendance ?? 0
                                  const items = [
                                    { label: 'Attendance', raw: attendancePct, weighted: (attendancePct / 100) * 10, max: 10, icon: CalendarDays, bar: 'bg-emerald-500', accent: 'border-l-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
                                    { label: 'Quiz', raw: quizAvg, weighted: (quizAvg / 100) * 15, max: 15, icon: Brain, bar: 'bg-cyan-500', accent: 'border-l-cyan-500', badge: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400' },
                                    { label: 'Presentation', raw: course.marks?.presentation ?? 0, weighted: ((course.marks?.presentation ?? 0) / 100) * 5, max: 5, icon: PresentationIcon, bar: 'bg-teal-500', accent: 'border-l-teal-500', badge: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' },
                                    { label: 'Mid Exam', raw: course.marks?.mid ?? 0, weighted: ((course.marks?.mid ?? 0) / 100) * 35, max: 35, icon: ClipboardList, bar: 'bg-amber-500', accent: 'border-l-amber-500', badge: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
                                    { label: 'Final', raw: course.marks?.final ?? 0, weighted: ((course.marks?.final ?? 0) / 100) * 60, max: 60, icon: Award, bar: 'bg-rose-500', accent: 'border-l-rose-500', badge: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' },
                                  ]
                                  const total = items.reduce((s, i) => s + i.weighted, 0)
                                  const letter = total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F'
                                  return (
                                    <>
                                      {items.map((item) => {
                                        const pct = item.max > 0 ? (item.weighted / item.max) * 100 : 0
                                        return (
                                          <div key={item.label} className={cn('flex items-center gap-3 rounded-xl border-l-[3px] pl-3 pr-3 py-2 bg-muted/30 hover:bg-muted/60 transition-all group', item.accent)}>
                                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', item.badge)}>
                                              <item.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                                                <div className={cn('rounded-md px-2 py-0.5 text-xs font-bold tabular-nums', item.badge)}>{item.weighted.toFixed(1)}</div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 rounded-full bg-muted-foreground/10 overflow-hidden">
                                                  <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(pct, 100)}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className={cn('h-full rounded-full', item.bar)}
                                                  />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">/ {item.max}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                      <div className="flex items-center justify-between rounded-xl border border-foreground/5 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-2.5 mt-2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                          <span className="text-xs font-semibold text-muted-foreground">Total (Weighted)</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tabular-nums">{total.toFixed(1)}</span>
                                          <span className="text-xs text-muted-foreground/60">/ 100</span>
                                          <div className={cn('rounded-md px-2 py-0.5 text-xs font-bold text-white', total >= 80 ? 'bg-emerald-500' : total >= 70 ? 'bg-teal-500' : total >= 60 ? 'bg-amber-500' : 'bg-rose-500')}>{letter}</div>
                                        </div>
                                      </div>
                                    </>
                                  )
                                })()}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn('text-xs font-semibold cursor-help', course.attendance >= 75 ? 'text-emerald-600 dark:text-emerald-400' : course.attendance >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
                                {course.attendance}%
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Attendance</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden cursor-pointer">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${course.attendance}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={cn(
                                'h-full rounded-full',
                                course.attendance >= 75 ? 'bg-emerald-500' : course.attendance >= 60 ? 'bg-amber-500' : 'bg-rose-500',
                              )}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Attendance</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 5. Achievement Showcase ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                      <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Achievements
                  </CardTitle>
                  <CardDescription>
                    {earnedBadges.length} of {totalBadges} badges earned
                  </CardDescription>
                </div>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Level {xpData.level}
                  </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* XP and Level */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {xpData.xp.toLocaleString()} XP Total
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {xpData.levelTitle} &middot; {xpProgress}% to Level{" "}
                      {xpData.level + 1}
                    </p>
                  </div>
                </div>
              </div>
              <Progress
                value={xpProgress}
                className="h-2.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-amber-400 [&>[data-slot=progress-indicator]]:to-orange-400"
              />

              <Separator />

              {/* Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(profileData?.badges || []).map((badge: any, i: number) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all cursor-pointer",
                            badge.earned
                              ? "border-foreground/10 bg-background hover:border-foreground/20 hover:shadow-sm"
                              : "opacity-40 grayscale border-dashed"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full",
                              badge.earned
                                ? BADGE_COLORS[badge.name] || "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {BADGE_ICONS[badge.name] || <Star className="h-5 w-5" />}
                          </div>
                          <p className="text-[11px] font-medium leading-tight">
                            {badge.name}
                          </p>
                          {badge.earned && badge.earnedAt && (
                            <p className="text-[9px] text-muted-foreground">
                              {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[180px] text-center">
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-[10px] opacity-80">{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── 6. Account Actions ── */}
      <motion.div variants={itemVariants}>
        <Card className="hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
                <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              Account Actions
            </CardTitle>
            <CardDescription>
              Manage your account security and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Change Password */}
              <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-pw">Current Password</Label>
                      <Input
                        id="current-pw"
                        type="password"
                        placeholder="Enter current password"
                        value={passwords.current}
                        onChange={(e) =>
                          setPasswords({ ...passwords, current: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pw">New Password</Label>
                      <Input
                        id="new-pw"
                        type="password"
                        placeholder="Enter new password"
                        value={passwords.newPass}
                        onChange={(e) =>
                          setPasswords({ ...passwords, newPass: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pw">Confirm New Password</Label>
                      <Input
                        id="confirm-pw"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirm: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPasswordOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Update Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Export Data */}
              <Button
                variant="outline"
                onClick={handleExportData}
                className="gap-2 flex-1"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>

              {/* Delete Account */}
              <AlertDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete your account?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data, including
                      study progress, quiz results, and achievements, will be
                      permanently deleted from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 7. Activity Graph ── */}
      <motion.div variants={itemVariants}>
        <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Study Activity
            </CardTitle>
            <CardDescription>
                {profileData?.streak?.current ?? 0} day streak &middot; Last active: {profileData?.streak?.lastActive ? new Date(profileData.streak.lastActive).toLocaleDateString() : 'N/A'}
              </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityGraph data={activityData} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
