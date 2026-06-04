"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, BookOpen, FolderOpen, FileText, Users, UserPlus, X, TrendingUp, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth";

interface Material {
  title: string;
  contentType: string;
  contentUrl: string;
  estimatedTime: string;
}

interface Topic {
  name: string;
  materials: Material[];
}

interface EnrolledStudent {
  id: string;
  student: { id: string; name: string; email: string };
  progress: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  enrollmentKey: string | null;
  instructor: string | null;
  category: string;
  difficulty: string;
  thumbnail: string | null;
  prerequisites: string | null;
  topics: { name: string; materials: Material[] }[];
  _count: { enrollments: number };
}

const emptyMaterial = (): Material => ({
  title: "",
  contentType: "document",
  contentUrl: "",
  estimatedTime: "",
});

const emptyTopic = (): Topic => ({
  name: "",
  materials: [emptyMaterial()],
});

export default function CourseManager() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [instructor, setInstructor] = useState(user?.name || "");
  const [category, setCategory] = useState("General");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [thumbnail, setThumbnail] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [topics, setTopics] = useState<Topic[]>([emptyTopic()]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDeleteCourse = useCallback(async (courseId: string) => {
    if (!confirm('Delete this course permanently? This cannot be undone.')) return;
    setDeletingCourseId(courseId);
    try {
      const res = await fetch(`/api/teacher/courses?id=${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setEnrollments(prev => { const next = { ...prev }; delete next[courseId]; return next; });
      }
    } catch {
      alert('Failed to delete course');
    } finally {
      setDeletingCourseId(null);
    }
  }, []);

  const handleEditCourse = useCallback((course: Course) => {
    setName(course.name);
    setCode(course.code);
    setDescription(course.description || '');
    setEnrollmentKey(course.enrollmentKey || '');
    setInstructor(course.instructor || '');
    setCategory(course.category || 'General');
    setDifficulty(course.difficulty || 'Beginner');
    setThumbnail(course.thumbnail || '');
    setPrerequisites(course.prerequisites || '');
    setTopics(course.topics?.length
      ? course.topics.map(t => ({
          name: t.name,
          materials: t.materials?.length
            ? t.materials.map(m => ({
                title: m.title,
                contentType: m.contentType || 'document',
                contentUrl: m.contentUrl || '',
                estimatedTime: String(m.estimatedTime || 30),
              }))
            : [emptyMaterial()],
        }))
      : [emptyTopic()]
    );
    setEditingCourse(course);
    setError(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCourse(null);
    setName('');
    setCode('');
    setDescription('');
    setEnrollmentKey('');
    setInstructor('');
    setCategory('General');
    setDifficulty('Beginner');
    setThumbnail('');
    setPrerequisites('');
    setTopics([emptyTopic()]);
    setError(null);
  }, []);

  // ── Enrollment state ──
  const [enrollments, setEnrollments] = useState<Record<string, EnrolledStudent[]>>({});
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [addEmailInput, setAddEmailInput] = useState<string>('');
  const [addEmailCourseId, setAddEmailCourseId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (courseId: string) => {
    try {
      const res = await fetch(`/api/teacher/enrollments?courseId=${courseId}`);
      const data = await res.json();
      if (!data.error) {
        setEnrollments(prev => ({ ...prev, [courseId]: data.enrollments ?? [] }));
      }
    } catch {}
  }, []);

  const handleToggleEnrollments = useCallback((courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      setExpandedCourseId(courseId);
      setEnrollError(null);
      setAddEmailCourseId(null);
      setAddEmailInput('');
      if (!enrollments[courseId]) fetchEnrollments(courseId);
    }
  }, [expandedCourseId, enrollments, fetchEnrollments]);

  const handleAddStudent = useCallback(async (courseId: string) => {
    if (!addEmailInput.trim()) return;
    setEnrolling(true);
    setEnrollError(null);
    try {
      const res = await fetch('/api/teacher/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, studentEmail: addEmailInput.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setEnrollError(data.error);
      } else {
        setEnrollments(prev => ({
          ...prev,
          [courseId]: [...(prev[courseId] ?? []), data.enrollment],
        }));
        setAddEmailInput('');
        setAddEmailCourseId(null);
      }
    } catch {
      setEnrollError('Network error');
    } finally {
      setEnrolling(false);
    }
  }, [addEmailInput]);

  const handleRemoveStudent = useCallback(async (courseId: string, studentId: string) => {
    if (!confirm('Remove this student from the course?')) return;
    try {
      const res = await fetch('/api/teacher/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, studentId }),
      });
      const data = await res.json();
      if (!data.error) {
        setEnrollments(prev => ({
          ...prev,
          [courseId]: (prev[courseId] ?? []).filter(e => e.student.id !== studentId),
        }));
      }
    } catch {}
  }, []);

  const addTopic = useCallback(() => {
    setTopics((prev) => [...prev, emptyTopic()]);
  }, []);

  const removeTopic = useCallback((index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTopic = useCallback(
    (index: number, field: keyof Topic, value: string) => {
      setTopics((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const addMaterial = useCallback((topicIndex: number) => {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === topicIndex ? { ...t, materials: [...t.materials, emptyMaterial()] } : t
      )
    );
  }, []);

  const removeMaterial = useCallback((topicIndex: number, materialIndex: number) => {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === topicIndex
          ? { ...t, materials: t.materials.filter((_, mi) => mi !== materialIndex) }
          : t
      )
    );
  }, []);

  const updateMaterial = useCallback(
    (topicIndex: number, materialIndex: number, field: keyof Material, value: string) => {
      setTopics((prev) =>
        prev.map((t, i) =>
          i === topicIndex
            ? {
                ...t,
                materials: t.materials.map((m, mi) =>
                  mi === materialIndex ? { ...m, [field]: value } : m
                ),
              }
            : t
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const payload = {
          name,
          code,
          description,
          enrollmentKey: enrollmentKey || null,
          instructor: instructor || null,
          category,
          difficulty,
          thumbnail: thumbnail || null,
          prerequisites: prerequisites || null,
          topics: topics.map((t) => ({
            name: t.name,
            materials: t.materials.map((m) => ({
              title: m.title,
              contentType: m.contentType,
              contentUrl: m.contentUrl,
              estimatedTime: Number(m.estimatedTime),
            })),
          })),
        };
        const isEdit = editingCourse !== null;
        const res = await fetch(isEdit ? `/api/teacher/courses?id=${editingCourse!.id}` : "/api/teacher/courses", {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(isEdit ? "Failed to update course" : "Failed to create course");
        setName("");
        setCode("");
        setDescription("");
        setEnrollmentKey("");
        setInstructor("");
        setCategory("General");
        setDifficulty("Beginner");
        setThumbnail("");
        setPrerequisites("");
        setTopics([emptyTopic()]);
        setEditingCourse(null);
        await fetchCourses();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save course");
      } finally {
        setSubmitting(false);
      }
    },
    [name, code, description, topics, editingCourse, fetchCourses]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Manager</h1>
        <p className="text-muted-foreground">
          Create and manage your courses, topics, and learning materials.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Create / Edit Course Form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            {editingCourse ? 'Edit Course' : 'Create New Course'}
            {editingCourse && (
              <span className="text-xs font-mono text-muted-foreground font-normal ml-1">
                {editingCourse.code}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {editingCourse ? 'Modify the course details below.' : 'Fill in the course details and add topics with materials.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Course Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g. Introduction to Computer Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Course Code
                </label>
                <Input
                  id="code"
                  placeholder="e.g. CS101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructor</label>
                <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                  <BookOpen className="size-3.5 mr-2 text-muted-foreground/60" />
                  {instructor || 'Loading...'}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Specialization">Specialization</SelectItem>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium">
                  Difficulty
                </label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="enrollmentKey" className="text-sm font-medium">
                  Enrollment Key
                </label>
                <Input
                  id="enrollmentKey"
                  placeholder="e.g. CS101-2026"
                  value={enrollmentKey}
                  onChange={(e) => setEnrollmentKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Students need this key to enroll
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="thumbnail" className="text-sm font-medium">
                Thumbnail URL
              </label>
              <Input
                id="thumbnail"
                placeholder="https://example.com/course-image.jpg"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of the course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prerequisites" className="text-sm font-medium">
                Prerequisites
              </label>
              <Textarea
                id="prerequisites"
                placeholder="e.g. Basic programming knowledge, Algebra..."
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>

            {/* ── Topics Builder ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Topics &amp; Materials</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTopic}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Add Topic
                </Button>
              </div>

              {topics.map((topic, ti) => (
                <Card key={ti} className="border-dashed">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Topic {ti + 1}</span>
                    </div>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(ti)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Topic Name</label>
                      <Input
                        placeholder="e.g. Variables & Data Types"
                        value={topic.name}
                        onChange={(e) => updateTopic(ti, "name", e.target.value)}
                        required
                      />
                    </div>

                    {/* Materials */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Materials</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addMaterial(ti)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Plus className="size-3" />
                          Add Material
                        </Button>
                      </div>

                      {topic.materials.map((material, mi) => (
                        <div
                          key={mi}
                          className="rounded-lg border bg-muted/30 p-3 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="size-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                Material {mi + 1}
                              </span>
                            </div>
                            {topic.materials.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMaterial(ti, mi)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">Title</label>
                              <Input
                                placeholder="e.g. Variables Explained"
                                value={material.title}
                                onChange={(e) =>
                                  updateMaterial(ti, mi, "title", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">Content Type</label>
                              <Select
                                value={material.contentType}
                                onValueChange={(v) =>
                                  updateMaterial(ti, mi, "contentType", v)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="document">Document</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="slide">Slide</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">Content URL</label>
                              <Input
                                placeholder="https://..."
                                value={material.contentUrl}
                                onChange={(e) =>
                                  updateMaterial(ti, mi, "contentUrl", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">
                                Est. Time (min)
                              </label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 15"
                                value={material.estimatedTime}
                                onChange={(e) =>
                                  updateMaterial(ti, mi, "estimatedTime", e.target.value)
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : editingCourse ? (
                  <Pencil className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                {submitting ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
              </Button>
              {editingCourse && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="gap-1.5">
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Existing Courses ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Existing Courses
          </CardTitle>
          <CardDescription>
            {courses.length} course{courses.length !== 1 && "s"} total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No courses yet. Create one above.
            </p>
          )}
          {courses.map((course) => (
            <div key={course.id} className="rounded-lg border">
              <div
                className="flex items-start justify-between gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => handleToggleEnrollments(course.id)}
              >
                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{course.name}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {course.code}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500">
                      {course.difficulty}
                    </span>
                  </div>
                  {course.instructor && (
                    <p className="text-sm text-muted-foreground">{course.instructor}</p>
                  )}
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{course.category}</span>
                    <span>{course.topics?.length ?? 0} topics</span>
                    <span>{course._count?.enrollments ?? 0} enrolled</span>
                    {course.enrollmentKey && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-amber-500 cursor-pointer hover:bg-amber-500/20 transition-colors"
                        title="Click to copy"
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(course.enrollmentKey!); }}
                      >
                        Key: {course.enrollmentKey}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }}
                  className="shrink-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleToggleEnrollments(course.id); }}
                  className="shrink-0 text-muted-foreground"
                >
                  <Users className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                  disabled={deletingCourseId === course.id}
                  className="shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  {deletingCourseId === course.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>

              {expandedCourseId === course.id && (
                <div className="border-t px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Users className="size-3.5 text-muted-foreground" />
                      Enrolled Students
                      <Badge variant="outline" className="text-xs ml-1">
                        {(enrollments[course.id]?.length ?? course._count?.enrollments ?? 0)}
                      </Badge>
                    </h4>
                  </div>

                  {addEmailCourseId === course.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter student email..."
                        value={addEmailInput}
                        onChange={(e) => setAddEmailInput(e.target.value)}
                        className="h-8 text-sm flex-1"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddStudent(course.id); }}
                      />
                      <Button size="sm" variant="ghost" onClick={() => { setAddEmailCourseId(null); setAddEmailInput(''); setEnrollError(null); }} className="h-8 w-8 p-0">
                        <X className="size-3.5" />
                      </Button>
                      <Button size="sm" onClick={() => handleAddStudent(course.id)} disabled={enrolling || !addEmailInput.trim()} className="h-8 gap-1">
                        {enrolling ? <Loader2 className="size-3 animate-spin" /> : <UserPlus className="size-3" />}
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAddEmailCourseId(course.id)} className="h-8 gap-1 text-xs">
                      <UserPlus className="size-3" />
                      Add Student
                    </Button>
                  )}

                  {enrollError && (
                    <p className="text-xs text-rose-500 bg-rose-500/10 rounded px-2 py-1">{enrollError}</p>
                  )}

                  {!enrollments[course.id] ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="size-3 animate-spin" />
                      Loading enrollments...
                    </div>
                  ) : enrollments[course.id].length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No students enrolled yet.</p>
                  ) : (
                  <div className="divide-y divide-border/40 rounded-lg border">
                    {enrollments[course.id].map((enr) => (
                      <div key={enr.id} className="flex items-center justify-between px-3 py-2 text-sm gap-3">
                        <div className="min-w-0 flex-[2]">
                          <p className="text-foreground truncate">{enr.student.name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground truncate">{enr.student.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Progress value={enr.progress} className="h-2 flex-1 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                          <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0 w-8 text-right">
                            {enr.progress}%
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStudent(course.id, enr.student.id)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 w-7 p-0 shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
