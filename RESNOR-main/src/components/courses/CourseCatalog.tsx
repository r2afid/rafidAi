"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Circle,
  ListChecks,
  Filter,
  X,
  Lock,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  category: string;
  difficulty: Difficulty;
  duration: string;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  description: string;
  syllabus: string[];
  topicIds: string[];
  prerequisites: string[];
  thumbnail: string;
  isEnrolled: boolean;
  progress: number; // 0-100
  reviews: { author: string; rating: number; comment: string; date: string }[];
  relatedCourseIds: string[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const FEATURED_COURSE_ID = "";

const CATEGORIES = ["All", "Core", "Specialization", "Foundation"];
const DIFFICULTIES: ("All" | Difficulty)[] = ["All", "Beginner", "Intermediate", "Advanced"];
const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "title", label: "Title A-Z" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<Difficulty, { border: string; badge: string; text: string; dot: string }> = {
  Beginner: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  Intermediate: {
    border: "border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Advanced: {
    border: "border-l-rose-500",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Core: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  Specialization: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  Foundation: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            "transition-colors",
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function RatingInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="focus:outline-none disabled:opacity-50"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-all",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30 hover:text-amber-400/60"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CourseCard({
  course,
  onOpenDetail,
  onToggleEnroll,
}: {
  course: Course;
  onOpenDetail: (course: Course) => void;
  onToggleEnroll: (courseId: string) => void;
}) {
  const diffColors = DIFFICULTY_COLORS[course.difficulty];
  const catColor = CATEGORY_COLORS[course.category] ?? "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-l-4 cursor-pointer",
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
          diffColors.border
        )}
        onClick={() => onOpenDetail(course)}
      >
        {/* Thumbnail placeholder */}
        <div className="relative h-36 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          {/* Difficulty badge on thumbnail */}
          <Badge
            variant="outline"
            className={cn("absolute top-3 right-3 text-[10px] font-semibold", diffColors.badge)}
          >
            {course.difficulty}
          </Badge>
          {/* Category badge */}
          <Badge variant="outline" className={cn("absolute top-3 left-3 text-[10px]", catColor)}>
            {course.category}
          </Badge>
          {/* Enrolled overlay */}
          {course.isEnrolled && (
            <div className="absolute bottom-3 right-3">
              <div className="flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 shadow-sm">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  Enrolled
                </span>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Code & Title */}
          <div className="space-y-1">
            <p className="text-xs font-mono text-muted-foreground">{course.code}</p>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {course.title}
            </h3>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {getInitials(course.instructor)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{course.instructor}</span>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{course.enrolledCount}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <RatingStars rating={course.rating} />
            <span className="text-xs font-semibold tabular-nums">{course.rating}</span>
            <span className="text-[10px] text-muted-foreground">({course.reviewCount})</span>
          </div>

          {/* Progress bar for enrolled courses */}
          {course.isEnrolled && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Progress</span>
                <span className="text-[11px] font-semibold tabular-nums">{course.progress}%</span>
              </div>
              <Progress
                value={course.progress}
                className="h-1.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {course.isEnrolled ? (
              <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Enrolled
              </span>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEnroll(course.id);
                }}
              >
                <CheckCircle2 className="h-3 w-3" />
                Enroll Now
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(course);
              }}
            >
              Details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeaturedBanner({
  course,
  onEnroll,
}: {
  course: Course;
  onEnroll: (courseId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-white/20 dark:border-white/10"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-900" />
      <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5" />

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Left content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Course of the Week
            </div>
          </div>
          <div>
            <p className="text-sm text-emerald-100 font-mono">{course.code}</p>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5">
              {course.title}
            </h2>
          </div>
          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-xl line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-emerald-100/80">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{course.enrolledCount} enrolled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>{course.rating}</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            className={cn(
              "bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg shadow-black/10",
              course.isEnrolled && "bg-emerald-100 text-emerald-800"
            )}
            onClick={() => onEnroll(course.id)}
          >
            {course.isEnrolled ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Continue Learning
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Enroll Now
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CourseDetailSheet({
  course,
  open,
  onOpenChange,
  onToggleEnroll,
  allCourses,
}: {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleEnroll: (courseId: string) => void;
  allCourses: Course[];
}) {
  const [topicProgress, setTopicProgress] = useState<Record<string, boolean>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [reviews, setReviews] = useState<Course['reviews']>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);

  const completedTopics = Object.values(topicProgress).filter(Boolean).length;
  const totalTopics = course?.topicIds.length || 0;
  const topicProgressPercent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  useEffect(() => {
    if (!course || !course?.isEnrolled) {
      setTopicProgress({});
      return;
    }
    setLoadingProgress(true);
    fetch(`/api/courses/progress?courseId=${course.id}&student_id=`)
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) setTopicProgress(data.progress);
      })
      .catch(console.error)
      .finally(() => setLoadingProgress(false));
  }, [open, course?.id, course?.isEnrolled]);

  useEffect(() => {
    if (!course) return;
    fetch(`/api/courses/reviews?courseId=${course.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.reviews) setReviews(data.reviews);
        setCanReview(data.canReview ?? false);
        setHasReviewed(data.hasReviewed ?? false);
        setReviewProgress(data.reviewProgress ?? 0);
      })
      .catch(console.error);
  }, [course?.id, open]);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewRating || !course) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/courses/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, rating: reviewRating, comment: reviewComment }),
      })
      const data = await res.json()
      if (data.error) {
        setReviewError(data.error)
      } else if (data.review) {
        setReviews(prev => [data.review, ...prev])
        setHasReviewed(true)
        setCanReview(false)
        setReviewRating(0)
        setReviewComment('')
      }
    } catch {
      setReviewError('Network error')
    } finally {
      setSubmittingReview(false)
    }
  }, [reviewRating, reviewComment, course]);

  const toggleTopic = useCallback(async (topicId: string, current: boolean) => {
    const optimistic = !current;
    setTopicProgress((prev) => ({ ...prev, [topicId]: optimistic }));
    try {
      await fetch('/api/courses/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          courseId: course!.id,
          completed: optimistic,
        }),
      });
    } catch {
      setTopicProgress((prev) => ({ ...prev, [topicId]: current }));
    }
  }, [course]);

  if (!course) return null;

  const diffColors = DIFFICULTY_COLORS[course.difficulty];
  const catColor = CATEGORY_COLORS[course.category] ?? "";
  const relatedCourses = allCourses.filter((c) => course.relatedCourseIds.includes(c.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Header gradient */}
          <div className="relative">
            <div className="h-40 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent" />
            <SheetHeader className="absolute bottom-0 left-0 right-0 px-6 pb-2 pt-10 bg-gradient-to-t from-background via-background/80 to-transparent">
              <SheetTitle className="text-xl font-bold">{course.title}</SheetTitle>
              <SheetDescription>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{course.code}</span> — {course.instructor}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("text-xs", diffColors.badge)}>
                {course.difficulty}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", catColor)}>
                {course.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {course.duration}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {course.enrolledCount} students
              </Badge>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <RatingStars rating={course.rating} size="lg" />
              <span className="text-lg font-bold tabular-nums">{course.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({course.reviewCount} reviews)
              </span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                About This Course
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            <Separator />

            {/* Progress for enrolled */}
            {course.isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Your Progress
                  </h4>
                  <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {Math.round(topicProgressPercent)}%
                  </span>
                </div>
                <Progress
                  value={topicProgressPercent}
                  className="h-2.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                />
                {topicProgressPercent >= 80 && !hasReviewed && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    You can now leave a review!
                  </p>
                )}
              </div>
            )}

            {/* Syllabus */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-teal-500" />
                Course Syllabus
              </h4>
              {course.isEnrolled && loadingProgress ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading progress...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {course.syllabus.map((item, i) => {
                    const topicId = course.topicIds[i];
                    const completed = topicProgress[topicId] ?? false;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-2 text-sm",
                          completed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )}
                      >
                        {course.isEnrolled && topicId ? (
                          <button
                            onClick={() => toggleTopic(topicId, completed)}
                            className="mt-0.5 shrink-0 focus:outline-none"
                          >
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                              course.progress > (i / course.syllabus.length) * 100
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/30"
                            )}
                          />
                        )}
                        <span className={cn(completed && "line-through")}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Prerequisites</h4>
                <ul className="space-y-1">
                  {course.prerequisites.map((prereq, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-amber-500" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Reviews */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Student Reviews
              </h4>

              {/* Review submission */}
              {course.isEnrolled && canReview && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-3">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    You've completed {Math.round(topicProgressPercent)}% — leave a review!
                  </p>
                  <div>
                    <RatingInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <textarea
                    placeholder="Share your thoughts about this course..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full min-h-[60px] rounded-md border border-border bg-background p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    rows={3}
                  />
                  {reviewError && (
                    <p className="text-xs text-rose-500">{reviewError}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmitReview}
                      disabled={!reviewRating || submittingReview}
                      className="gap-1 h-7 text-xs"
                    >
                      {submittingReview ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Star className="size-3" />
                      )}
                      Submit Review
                    </Button>
                  </div>
                </div>
              )}

              {course.isEnrolled && hasReviewed && (
                <p className="text-xs text-muted-foreground italic">You have reviewed this course.</p>
              )}

              {course.isEnrolled && !canReview && !hasReviewed && topicProgressPercent > 0 && (
                <p className="text-xs text-muted-foreground">
                  Complete {80 - Math.round(topicProgressPercent)}% more to leave a review.
                </p>
              )}

              <div className="space-y-3">
                {reviews.length === 0 && (
                  <p className="text-xs text-muted-foreground">No reviews yet.</p>
                )}
                {reviews.map((review, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] bg-muted">
                            {getInitials(review.author)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{review.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RatingStars rating={review.rating} />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(review.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Related Courses</h4>
                  <div className="space-y-2">
                    {relatedCourses.map((related) => (
                      <div
                        key={related.id}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onOpenChange(false)}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            DIFFICULTY_COLORS[related.difficulty].dot
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{related.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {related.code} · {related.difficulty} · ★ {related.rating}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Enroll CTA */}
            <div className="pt-2 pb-6">
              {course.isEnrolled ? (
                <motion.div whileHover={{ scale: 1.02 }}>
                  <div className="w-full rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-2 text-emerald-500 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Enrolled
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="w-full font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      onToggleEnroll(course.id);
                      onOpenChange(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Enroll in This Course
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function StatsSummary({ courses }: { courses: Course[] }) {
  const totalCourses = courses.length;
  const enrolledCount = courses.filter((c) => c.isEnrolled).length;
  const completedCount = courses.filter((c) => c.isEnrolled && c.progress === 100).length;

  const stats = [
    {
      label: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Enrolled",
      value: enrolledCount,
      icon: GraduationCap,
      color: "text-teal-500 bg-teal-500/10",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: Trophy,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="text-center">
            <CardContent className="pt-4 pb-3 px-3">
              <div className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-xl", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="mt-1.5 text-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No courses found</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {searchQuery
          ? `No courses match "${searchQuery}". Try a different search term or adjust your filters.`
          : "No courses match your current filters. Try removing some constraints."}
      </p>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showEnrollKeyDialog, setShowEnrollKeyDialog] = useState<string | null>(null);
  const [enrollKeyInput, setEnrollKeyInput] = useState("");
  const [enrollingWithKey, setEnrollingWithKey] = useState(false);
  const [enrollKeyError, setEnrollKeyError] = useState<string | null>(null);

  // Fetch real course data from API
  useEffect(() => {
    const studentId = new URLSearchParams(window.location.search).get('student_id') || ''
    fetch(`/api/courses${studentId ? `?student_id=${studentId}` : ''}`)
      .then(r => r.json())
      .then(res => {
        if (res.error || !res.courses?.length) return
        const apiCourses: Course[] = res.courses.map((c: any) => {
          const totalMaterials = c.topics?.reduce((s: number, t: any) => s + (t._count?.materials || t.materials?.length || 0), 0) || 0
          return {
            id: c.id,
            code: c.code,
            title: c.name,
            instructor: c.instructor || 'Instructor',
            category: c.category || 'General',
            difficulty: (c.difficulty || 'Beginner') as Difficulty,
            duration: `${totalMaterials * 30} min`,
            enrolledCount: c._count?.enrollments || 0,
            rating: c.rating || 0,
            reviewCount: c.reviewCount || 0,
            description: c.description || '',
            syllabus: c.topics?.map((t: any) => t.name) || [],
            topicIds: c.topics?.map((t: any) => t.id) || [],
            prerequisites: c.prerequisites ? [c.prerequisites] : [],
            thumbnail: c.thumbnail || '',
            isEnrolled: c.isEnrolled || false,
            progress: c.progress || 0,
            reviews: c.reviews || [],
            relatedCourseIds: c.relatedCourseIds || [],
          }
        })
        setCourses(apiCourses)
      })
      .catch(() => {})
  }, [])

  const featuredCourse = useMemo(
    () => courses.find((c) => c.id === FEATURED_COURSE_ID) ?? courses[0],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.instructor.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "All") {
      result = result.filter((c) => c.difficulty === selectedDifficulty);
    }

    // Enrolled-only filter
    if (showEnrolledOnly) {
      result = result.filter((c) => c.isEnrolled);
    }

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.enrolledCount - a.enrolledCount);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => b.code.localeCompare(a.code));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, sortBy, showEnrolledOnly]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedCategory !== "All" || selectedDifficulty !== "All" || showEnrolledOnly;

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDifficulty("All");
    setShowEnrolledOnly(false);
  }, []);

  const handleOpenDetail = useCallback((course: Course) => {
    setDetailCourse(course);
    setSheetOpen(true);
  }, []);

  const handleToggleEnroll = useCallback((courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Already enrolled — no unenroll allowed
    if (course.isEnrolled) return;

    // Show enrollment key dialog
    setShowEnrollKeyDialog(courseId);
    setEnrollKeyInput("");
    setEnrollKeyError(null);
  }, [courses]);

  const handleEnrollWithKey = useCallback(async () => {
    const courseId = showEnrollKeyDialog;
    if (!courseId || !enrollKeyInput.trim()) return;
    setEnrollingWithKey(true);
    setEnrollKeyError(null);

    try {
      const { token } = useAuthStore.getState();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const studentId = new URLSearchParams(window.location.search).get('student_id') || '';
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers,
        body: JSON.stringify({ courseId, studentId, enrollmentKey: enrollKeyInput.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setEnrollKeyError(data.error);
      } else {
        const res2 = await fetch('/api/courses');
        const data2 = await res2.json();
        if (data2.courses) {
          const apiCourses: Course[] = data2.courses.map((c: any) => {
            const totalMaterials = c.topics?.reduce((s: number, t: any) => s + (t._count?.materials || t.materials?.length || 0), 0) || 0
            return {
              id: c.id,
              code: c.code,
              title: c.name,
              instructor: c.instructor || 'Instructor',
              category: c.category || 'General',
              difficulty: (c.difficulty || 'Beginner') as Difficulty,
              duration: `${totalMaterials * 30} min`,
              enrolledCount: c._count?.enrollments || 0,
              rating: c.rating || 0,
              reviewCount: c.reviewCount || 0,
              description: c.description || '',
              syllabus: c.topics?.map((t: any) => t.name) || [],
              topicIds: c.topics?.map((t: any) => t.id) || [],
              prerequisites: c.prerequisites ? [c.prerequisites] : [],
              thumbnail: c.thumbnail || '',
              isEnrolled: c.isEnrolled || false,
              progress: c.progress || 0,
              reviews: c.reviews || [],
              relatedCourseIds: c.relatedCourseIds || [],
            }
          })
          setCourses(apiCourses)
        }
        setShowEnrollKeyDialog(null);
        setEnrollKeyInput("");
      }
    } catch {
      setEnrollKeyError('Network error. Please try again.');
    } finally {
      setEnrollingWithKey(false);
    }
  }, [showEnrollKeyDialog, enrollKeyInput]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-500" />
          Course Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore and enroll in courses to advance your learning journey
        </p>
      </motion.div>

      {/* Stats Summary */}
      <StatsSummary courses={courses} />

      {/* Featured Course Banner */}
      {featuredCourse && <FeaturedBanner course={featuredCourse} onEnroll={handleToggleEnroll} />}

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, instructors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category + Difficulty pills */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">
              Level:
            </span>
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5",
                  selectedDifficulty === diff
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {diff !== "All" && (
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      selectedDifficulty === diff
                        ? "bg-white"
                        : DIFFICULTY_COLORS[diff as Difficulty].dot
                    )}
                  />
                )}
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Enrolled-only toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEnrolledOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              showEnrolledOnly
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            Enrolled
          </button>
        </div>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Showing {filteredCourses.length} of {courses.length} courses
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Course Grid */}
      <div>
        {filteredCourses.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                >
                  <CourseCard
                    course={course}
                    onOpenDetail={handleOpenDetail}
                    onToggleEnroll={handleToggleEnroll}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Course Detail Sheet */}
      <CourseDetailSheet
        course={detailCourse}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onToggleEnroll={handleToggleEnroll}
        allCourses={courses}
      />

      {/* Enrollment Key Dialog */}
      {showEnrollKeyDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowEnrollKeyDialog(null)}>
          <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Enrollment Key Required</h3>
                <p className="text-xs text-muted-foreground">Enter the key provided by your instructor</p>
              </div>
            </div>
            <Input
              placeholder="e.g. CS101-2026"
              value={enrollKeyInput}
              onChange={(e) => setEnrollKeyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEnrollWithKey(); }}
              className="mb-3"
              autoFocus
            />
            {enrollKeyError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 rounded px-2 py-1.5 mb-3">{enrollKeyError}</p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowEnrollKeyDialog(null)}>Cancel</Button>
              <Button size="sm" onClick={handleEnrollWithKey} disabled={enrollingWithKey || !enrollKeyInput.trim()} className="gap-1">
                {enrollingWithKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Enroll
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
