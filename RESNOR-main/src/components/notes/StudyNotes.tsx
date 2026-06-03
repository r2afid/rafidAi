"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  PenLine,
  X,
  Save,
  Trash2,
  Check,
  Tag,
  FolderOpen,
  Bold,
  Italic,
  List,
  Code,
  Heading1,
  Heading2,
  Quote,
  Eye,
  Edit3,
  StickyNote,
  Sparkles,
  MoreHorizontal,
  Clock,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";

// --- Types ---

interface StudyNote {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  deletedAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Category Config ---

const CATEGORY_COLORS = [
  { dotClass: 'bg-emerald-500', hex: '#10b981', glowClass: 'shadow-emerald-500/20', borderClass: 'border-emerald-500/30', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  { dotClass: 'bg-sky-500', hex: '#0ea5e9', glowClass: 'shadow-sky-500/20', borderClass: 'border-sky-500/30', badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800', pillClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800' },
  { dotClass: 'bg-violet-500', hex: '#8b5cf6', glowClass: 'shadow-violet-500/20', borderClass: 'border-violet-500/30', badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800', pillClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800' },
  { dotClass: 'bg-amber-500', hex: '#f59e0b', glowClass: 'shadow-amber-500/20', borderClass: 'border-amber-500/30', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800', pillClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  { dotClass: 'bg-rose-500', hex: '#f43f5e', glowClass: 'shadow-rose-500/20', borderClass: 'border-rose-500/30', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800', pillClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
  { dotClass: 'bg-teal-500', hex: '#14b8a6', glowClass: 'shadow-teal-500/20', borderClass: 'border-teal-500/30', badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800', pillClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' },
  { dotClass: 'bg-orange-500', hex: '#f97316', glowClass: 'shadow-orange-500/20', borderClass: 'border-orange-500/30', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800', pillClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
  { dotClass: 'bg-pink-500', hex: '#ec4899', glowClass: 'shadow-pink-500/20', borderClass: 'border-pink-500/30', badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800', pillClass: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800' },
]

function getCategoryConfig(category: string, index?: number) {
  const idx = index ?? hashString(category) % CATEGORY_COLORS.length
  return CATEGORY_COLORS[idx]
}

function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// --- Helpers ---

function toNote(data: any): StudyNote {
  return { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt), deletedAt: data.deletedAt ? new Date(data.deletedAt) : null };
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function generateId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Sub-components ---

function CategoryBadge({ category, size = 'sm' }: { category: string; size?: 'sm' | 'xs' }) {
  const config = getCategoryConfig(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${
        size === 'xs' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'
      } ${config.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass} ring-1 ring-offset-1 ring-offset-background ring-current/20`} />
      {category}
    </span>
  );
}

function NoteCard({
  note,
  isActive,
  onClick,
  onDelete,
  index,
}: {
  note: StudyNote;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  index: number;
}) {
  const config = getCategoryConfig(note.category);
  const preview = truncate(note.content.replace(/\n/g, " "), 80);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.035, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden group ${
        isActive
          ? 'bg-gradient-to-r from-white via-white dark:from-zinc-900 dark:via-zinc-900 shadow-md border-current/30'
          : 'bg-card/40 hover:bg-card/80 border-border/50 hover:border-border/80 hover:shadow-sm'
      }`}
      style={isActive ? { '--tw-gradient-to': `${config.hex}0d`, borderColor: `${config.hex}4d` } as React.CSSProperties : undefined}
    >
      <div className={`relative p-3 ${isActive ? 'border-l-[3px] border-current/30' : ''}`} style={isActive ? { borderLeftColor: `${config.hex}4d` } as React.CSSProperties : undefined}>
        {/* Category color dot indicator */}
        <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${config.dotClass} ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'} transition-opacity`} />

        {/* Delete button on hover */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-2 right-8 flex items-center justify-center size-6 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-all z-10 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}

        <div className="flex items-start gap-2.5">
          <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border ${config.borderClass} bg-background/80 shadow-sm`}>
            <StickyNote className="h-3.5 w-3.5" style={{ color: config.hex }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-sm font-semibold leading-snug line-clamp-1 ${isActive ? 'text-foreground' : 'text-foreground/90'}`}>
              {note.title || <span className="italic text-muted-foreground/50">Untitled Note</span>}
            </h3>
            {preview && (
              <p className="mt-1 text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2">
                {preview}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 pl-9">
          <CategoryBadge category={note.category} size="xs" />
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
            <Clock className="h-2.5 w-2.5" />
            {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function NotesListSidebar({
  notes,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onNewNote,
  categories,
  loading,
  onDelete,
  onTrashToggle,
}: {
  notes: StudyNote[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryChange: (c: string) => void;
  onNewNote: () => void;
  categories: string[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onTrashToggle?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const displayedNotes = showAll ? notes : notes.slice(0, 10);
  const hasMore = notes.length > 10;
  const allCategories = ['All', ...categories];
  const displayedCategories = showAllCats ? allCategories : allCategories.slice(0, 11);
  const hasMoreCats = allCategories.length > 11;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-3 sm:space-y-4 px-3 sm:px-4 pt-4 sm:pt-5 pb-3"
      >
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
              <StickyNote className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Study Notes</h2>
              <p className="text-[9px] text-muted-foreground/60">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 text-xs"
              onClick={onTrashToggle}
              title="Trash"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bin</span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 rounded-lg"
              onClick={onNewNote}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Note</span>
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-focus-within:from-emerald-500/10 group-focus-within:via-emerald-500/5 group-focus-within:to-teal-500/10 transition-all duration-500 blur-sm" />
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-emerald-500 transition-colors z-10" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes..."
              className="h-9 pl-9 pr-9 text-xs bg-muted/30 border-border/40 rounded-xl transition-all duration-200 focus:bg-background focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 focus-visible:ring-emerald-500/10 placeholder:text-muted-foreground/40 relative z-10"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 rounded-full p-0.5 transition-all z-10"
                >
                  <X className="h-3 w-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-wrap gap-1.5"
        >
          {displayedCategories.map((cat) => {
            const isActive = categoryFilter === cat;
            const isNoteCat = cat !== 'All';
            const ccfg = isNoteCat ? getCategoryConfig(cat) : null;

            return (
              <motion.button
                key={cat}
                layout
                onClick={() => onCategoryChange(cat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all border cursor-pointer ${
                  isActive
                    ? isNoteCat
                      ? `${ccfg!.pillClass} shadow-sm border-current/30`
                      : "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground/70 border-border/30 hover:bg-muted/70 hover:text-foreground/80"
                }`}
                style={isActive && isNoteCat ? { boxShadow: `0 1px 3px 0 ${ccfg!.hex}1a` } as React.CSSProperties : undefined}
              >
                {isNoteCat && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${ccfg!.dotClass} ${
                      isActive ? "" : "opacity-40"
                    }`}
                  />
                )}
                {cat}
              </motion.button>
            );
          })}
          {hasMoreCats && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAllCats((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground/50 hover:text-foreground bg-muted/20 hover:bg-muted/40 border border-border/20 transition-all cursor-pointer"
            >
              {showAllCats ? "Less" : `+${allCategories.length - 11} more`}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
      <ScrollArea className="flex-1 px-3 pb-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/30 p-3 animate-pulse">
                <div className="flex items-start gap-2.5">
                  <div className="size-7 rounded-lg bg-muted/60" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted/60" />
                    <div className="h-2 w-full rounded bg-muted/30" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2 pl-9">
                  <div className="h-4 w-16 rounded-full bg-muted/40" />
                  <div className="h-3 w-12 rounded bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayedNotes.map((note, index) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isActive={note.id === selectedId}
                  onClick={() => onSelect(note.id)}
                  onDelete={onDelete ? () => onDelete(note.id) : undefined}
                  index={index}
                />
              ))}
            </AnimatePresence>
            {hasMore && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowAll((prev) => !prev)}
                className="w-full mt-2 py-2 text-xs font-medium text-muted-foreground/60 hover:text-foreground bg-muted/20 hover:bg-muted/40 rounded-xl border border-border/20 transition-all cursor-pointer"
              >
                {showAll ? "Show less" : `Show ${notes.length - 10} more`}
              </motion.button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TagPill({
  tag,
  onRemove,
}: {
  tag: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-1 rounded-full bg-muted/70 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/50 shadow-sm"
    >
      <Tag className="h-2.5 w-2.5" />
      {tag}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors cursor-pointer"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </motion.span>
  );
}

function NoteEditor({
  note,
  onUpdate,
  onSave,
  onDelete,
  isNew,
  categories,
}: {
  note: StudyNote;
  onUpdate: (updates: Partial<StudyNote>) => void;
  onSave: () => void;
  onDelete: () => void;
  isNew: boolean;
  categories: string[];
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = getCategoryConfig(note.category);

  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isNew]);

  const charCount = note.content.length;

  const handleSave = useCallback(() => {
    setSaveState("saving");
    onSave();
    setTimeout(() => setSaveState("saved"), 300);
    setTimeout(() => setSaveState("idle"), 2000);
  }, [onSave]);

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !note.tags.includes(tag)) {
      onUpdate({ tags: [...note.tags, tag] });
    }
    setTagInput("");
  }, [tagInput, note.tags, onUpdate]);

  const removeTag = useCallback(
    (tag: string) => {
      onUpdate({ tags: note.tags.filter((t) => t !== tag) });
    },
    [note.tags, onUpdate]
  );

  const insertFormat = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = note.content.substring(start, end);
    const newText = note.content.substring(0, start) + before + selected + after + note.content.substring(end);
    onUpdate({ content: newText });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const renderInline = (text: string) => {
    const parts: { type: string; content: string }[] = [];
    const regex = /(\*\*(.+?)\*\*|_(.+?)_|`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      if (match[1]?.startsWith('**')) parts.push({ type: 'bold', content: match[2] });
      else if (match[1]?.startsWith('_')) parts.push({ type: 'italic', content: match[3] });
      else if (match[1]?.startsWith('`')) parts.push({ type: 'code', content: match[4] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });
    if (parts.length === 0) return text;
    return parts.map((p, i) => {
      switch (p.type) {
        case 'bold': return <strong key={i} className="font-semibold">{p.content}</strong>;
        case 'italic': return <em key={i}>{p.content}</em>;
        case 'code': return <code key={i} className="rounded bg-muted/60 px-1 py-0.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">{p.content}</code>;
        default: return <span key={i}>{p.content}</span>;
      }
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeKey = 0;

    const flushCodeBlock = () => {
      if (codeLines.length === 0) return;
      elements.push(
        <div key={`code-${codeKey++}`} className="my-3 rounded-xl border border-border/30 bg-[#0d1117] overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#161b22] border-b border-border/20">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500/80" />
              <span className="size-2.5 rounded-full bg-yellow-500/80" />
              <span className="size-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 ml-2">code</span>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-[13px] leading-relaxed font-mono text-zinc-200">
              {codeLines.map((cl, ci) => <span key={ci}>{cl}{ci < codeLines.length - 1 ? '\n' : ''}</span>)}
            </code>
          </pre>
        </div>
      );
      codeLines = [];
    };

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) { flushCodeBlock(); inCodeBlock = false; }
        else { flushCodeBlock(); inCodeBlock = true; }
        return;
      }
      if (inCodeBlock) { codeLines.push(line); return; }

      let el: React.ReactNode = null;
      if (line.startsWith('# ')) el = <h1 key={i} className="text-xl font-bold mt-4 mb-2">{renderInline(line.slice(2))}</h1>;
      else if (line.startsWith('## ')) el = <h2 key={i} className="text-lg font-semibold mt-3 mb-1.5">{renderInline(line.slice(3))}</h2>;
      else if (line.startsWith('- ')) el = <li key={i} className="text-sm ml-4 list-disc text-foreground/80">{renderInline(line.slice(2))}</li>;
      else if (line.startsWith('> ')) el = <blockquote key={i} className="border-l-2 border-emerald-400/50 pl-3 italic text-sm text-foreground/70 my-1">{renderInline(line.slice(2))}</blockquote>;
      else if (line.match(/^\d+\.\s/)) el = <li key={i} className="text-sm ml-4 list-decimal text-foreground/80">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>;
      else el = <p key={i} className="text-sm leading-relaxed text-foreground/80">{renderInline(line) || <br/>}</p>;
      elements.push(el);
    });

    if (inCodeBlock) flushCodeBlock();
    return elements;
  };

  const formatTools = [
    { icon: Heading1, label: 'Heading 1', action: () => insertFormat('# ', '') },
    { icon: Heading2, label: 'Heading 2', action: () => insertFormat('## ', '') },
    { icon: Bold, label: 'Bold', action: () => insertFormat('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertFormat('_', '_') },
    { icon: List, label: 'Bullet List', action: () => insertFormat('\n- ', '') },
    { icon: Code, label: 'Code Block', action: () => insertFormat('\n```\n', '\n```\n') },
    { icon: Quote, label: 'Quote', action: () => insertFormat('\n> ', '') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col bg-gradient-to-b from-background to-muted/20"
    >
      {/* Editor Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 border-b border-border/40 bg-background/80 backdrop-blur-sm px-3 sm:px-5 py-2 sm:py-2.5"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 border bg-muted/30 ${config.borderClass}`}>
            <FileText className="h-3 w-3" />
            <span className="font-medium">{charCount}</span>
            <span className="text-muted-foreground/60">chars</span>
          </div>
          <span className="text-muted-foreground/30 hidden sm:inline">|</span>
          <span className="hidden sm:flex items-center gap-1 text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            Updated {formatDate(note.updatedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Category Selector */}
          <div className="flex items-center gap-1">
            {categories.slice(0, 3).map((cat) => {
              const ccfg = getCategoryConfig(cat);
              const isActive = note.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onUpdate({ category: cat })}
                  className={`hidden sm:inline-flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium transition-all border cursor-pointer ${
                    isActive
                      ? `${ccfg.pillClass} shadow-sm`
                      : "text-muted-foreground/40 border-transparent hover:text-muted-foreground"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${ccfg.dotClass}`} />
                  <span className="hidden sm:inline">{cat}</span>
                </button>
              );
            })}
            <select
              value={note.category}
              onChange={(e) => onUpdate({ category: e.target.value })}
              className="sm:hidden text-[10px] bg-muted/50 rounded-lg px-2 py-1.5 border border-border/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Preview Toggle */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 ${preview ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground'}`}
              onClick={() => setPreview(!preview)}
            >
              {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </motion.div>

          {/* Delete Button */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant={showDeleteConfirm ? "destructive" : "ghost"}
              size="sm"
              className={`h-7 w-7 p-0 ${showDeleteConfirm ? '' : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'}`}
              onClick={handleDelete}
            >
              {showDeleteConfirm ? <Trash2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </motion.div>

          {/* Save Button */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              className={`h-7 gap-1.5 text-xs rounded-lg shadow-sm transition-all px-3 ${
                saveState === "saved"
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/20 hover:shadow-emerald-500/30"
              }`}
              onClick={handleSave}
              disabled={saveState === "saving"}
            >
              <AnimatePresence mode="wait">
                {saveState === "saved" ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Saved
                  </motion.span>
                ) : saveState === "saving" ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      <Save className="h-3 w-3" />
                    </motion.div>
                    Saving
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-2xl px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="relative group"
          >
            <input
              ref={titleRef}
              value={note.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Untitled Note"
              className="w-full bg-transparent text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight placeholder:text-muted-foreground/30 outline-none border-none text-foreground transition-all duration-200 group-focus-within:tracking-normal"
            />
            {note.title && (
              <motion.div
                layoutId="titleBar"
                className="absolute -left-2 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-60"
              />
            )}
            <div className="absolute -inset-x-4 -inset-y-2 rounded-xl bg-emerald-500/[0.02] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-2.5"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <AnimatePresence>
                {note.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30 group focus-within:border-emerald-500/30 focus-within:bg-background/50 transition-all">
              <Tag className="h-3 w-3 text-muted-foreground/50 group-focus-within:text-emerald-500 transition-colors" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
                placeholder={note.tags.length === 0 ? "Add tags (press Enter)..." : ""}
                className="flex-1 bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/40 outline-none border-none"
              />
            </div>
          </motion.div>
          {!preview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-1 py-1.5 px-2 -mx-2 rounded-xl bg-muted/30 border border-border/30 sticky top-0 backdrop-blur-sm z-10 overflow-x-auto scrollbar-thin"
            >
              {formatTools.map((tool) => (
                <motion.button
                  key={tool.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={tool.action}
                  className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground transition-all"
                  title={tool.label}
                >
                  <tool.icon className="h-3.5 w-3.5" />
                </motion.button>
              ))}
              <div className="mx-1 h-4 w-px bg-border/30" />
              <span className="text-[9px] text-muted-foreground/40 font-mono">Markdown</span>
            </motion.div>
          )}

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent origin-left"
          />

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="min-h-[200px] sm:min-h-[280px] md:min-h-[320px] rounded-xl bg-muted/20 border border-border/20 p-3 sm:p-5 space-y-1"
              >
                {note.content.trim() ? renderMarkdown(note.content) : (
                  <p className="text-sm text-muted-foreground/40 italic">Nothing to preview</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="textarea"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <Textarea
                  ref={textareaRef}
                  value={note.content}
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  placeholder="Start writing your notes here... Use **bold**, _italic_, # headings, - lists, > quotes, `code`"
                  className="min-h-[200px] sm:min-h-[280px] md:min-h-[360px] resize-none border-none bg-transparent shadow-none text-xs sm:text-sm leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:border-0 p-0"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        className="border-t border-border/30 px-3 sm:px-5 py-2 flex items-center justify-between bg-background/60 backdrop-blur-sm"
        style={{ borderTopColor: `${config.hex}4d` } as React.CSSProperties}
      >
        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-2">
          <span>{charCount} character{charCount !== 1 ? 's' : ''}</span>
          <span className="text-muted-foreground/20">|</span>
          <span>{note.content.split(/\s+/).filter(Boolean).length} word{note.content.split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}</span>
        </span>
        <CategoryBadge category={note.category} />
      </motion.div>
    </motion.div>
  );
}

function EmptySearchState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-20 text-center px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 border border-border/40 shadow-lg">
          <Search className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="mt-5 text-base font-semibold">No notes found</h3>
        <p className="mt-1.5 text-xs text-muted-foreground/60 max-w-[240px] mx-auto leading-relaxed">
          Try adjusting your search terms or changing the category filter.
        </p>
      </motion.div>
    </motion.div>
  );
}

function EmptySelectState() {
  const [writingPhase, setWritingPhase] = useState(0)

  useEffect(() => {
    if (writingPhase >= 4) {
      const reset = setTimeout(() => setWritingPhase(0), 1200)
      return () => clearTimeout(reset)
    }
    const advance = setTimeout(() => setWritingPhase(p => p + 1), 800)
    return () => clearTimeout(advance)
  }, [writingPhase])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex flex-col items-center justify-center w-full h-full text-center px-3 sm:px-6"
    >
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient orbs */}
      <motion.div
        className="absolute -top-20 -right-20 size-60 sm:size-80 rounded-full bg-emerald-500/5 blur-3xl"
        animate={{ scale: [1, 1.4, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 size-60 sm:size-80 rounded-full bg-teal-500/5 blur-3xl"
        animate={{ scale: [1.3, 0.8, 1.3], rotate: [0, -90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 sm:size-96 rounded-full bg-emerald-500/[0.02] blur-3xl"
        animate={{ scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating sticky notes */}
      {[
        { top: 15, left: 10, delay: 0, rotate: -12, color: 'bg-amber-500' },
        { top: 25, right: 12, delay: 1, rotate: 8, color: 'bg-sky-500' },
        { top: 60, left: 8, delay: 2, rotate: -6, color: 'bg-violet-500' },
        { top: 55, right: 10, delay: 0.5, rotate: 15, color: 'bg-rose-500' },
        { top: 70, left: 18, delay: 1.5, rotate: -18, color: 'bg-emerald-500' },
      ].map((note, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: `${note.top}%`, left: note.left !== undefined ? `${note.left}%` : undefined, right: note.right !== undefined ? `${note.right}%` : undefined }}
          initial={{ opacity: 0, y: 20, rotate: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            y: [0, -40 - Math.random() * 30],
            rotate: note.rotate,
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: note.delay,
            ease: "easeInOut",
          }}
        >
          <div className={`size-5 rounded-sm ${note.color}/20 border ${note.color}/30 shadow-sm flex items-center justify-center`}>
            <div className={`size-2 rounded-sm ${note.color}/40`} />
          </div>
        </motion.div>
      ))}

      {/* Sparkle particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${15 + Math.random() * 70}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.2, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88Z" fill="#10b981" opacity="0.5" />
          </svg>
        </motion.div>
      ))}

      {/* Beam behind notepad */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full bg-gradient-to-b from-emerald-500/8 via-transparent to-transparent blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '38%' }}
      />

      {/* Notepad scene */}
      <motion.div
        initial={{ y: 80, opacity: 0, rotateX: 15 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative perspective-[800px] z-10"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Orbiting ring */}
        <motion.div
          className="absolute -inset-8 rounded-full border border-emerald-500/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -inset-10 rounded-full border border-dashed border-teal-500/8"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* Shadow beneath notepad */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[120px] sm:w-[160px] h-3 sm:h-4 rounded-full bg-emerald-500/10 blur-md"
          animate={{ width: [120, 100, 120], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Notepad body */}
          <motion.div
            className="relative w-[120px] h-[86px] sm:w-[150px] sm:h-[108px] rounded-[10px] overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Paper texture overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]" />
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            />
            {/* Subtle ruled line pattern bg */}
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 17px, currentColor 17px, currentColor 18px)",
                backgroundSize: "100% 18px",
              }}
            />

            {/* Top shadow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />

            {/* Spiral binding holes */}
            {[25, 50, 75, 120].map((x, i) => (
              <motion.div
                key={i}
                className="absolute top-[6px] size-[6px] rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800"
                style={{ left: x }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
              />
            ))}

            {/* Animated writing lines on notepad */}
            {/* Line 1 */}
            <motion.div
              className="absolute top-[20px] sm:top-[26px] left-[12px] sm:left-[14px] h-[2px] rounded-full bg-emerald-500/30 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: writingPhase >= 1 ? 1 : 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ width: 50 }}
            />
            {/* Line 2 */}
            <motion.div
              className="absolute top-[34px] sm:top-[44px] left-[12px] sm:left-[14px] h-[2px] rounded-full bg-emerald-500/30 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: writingPhase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ width: 38 }}
            />
            {/* Line 3 */}
            <motion.div
              className="absolute top-[48px] sm:top-[62px] left-[12px] sm:left-[14px] h-[2px] rounded-full bg-emerald-500/30 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: writingPhase >= 3 ? 1 : 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ width: 44 }}
            />
            {/* Line 4 */}
            <motion.div
              className="absolute top-[62px] sm:top-[80px] left-[12px] sm:left-[14px] h-[2px] rounded-full bg-emerald-500/25 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: writingPhase >= 4 ? 1 : 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ width: 26 }}
            />

            {/* Page curl animation */}
            <motion.div
              className="absolute bottom-0 right-0"
              animate={{ rotate: writingPhase >= 4 ? [0, -3, 0] : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="w-0 h-0 border-b-[14px] border-r-[14px] border-b-transparent border-r-zinc-200 dark:border-r-zinc-700 rounded-br-[10px]" />
            </motion.div>
          </motion.div>

          {/* Pen */}
          <motion.div
            className="absolute -right-[16px] sm:-right-[20px] z-10"
            initial={{ rotate: 0 }}
            animate={{
              rotate: writingPhase === 0 ? 15 : [15, 12, 15],
              y: writingPhase === 0 ? -16 : (
                writingPhase === 1 ? -14 :
                writingPhase === 2 ? -29 :
                writingPhase === 3 ? -44 :
                writingPhase === 4 ? -58 : -16
              ),
              x: writingPhase === 0 ? 10 : (
                writingPhase === 1 ? 8 :
                writingPhase === 2 ? 10 :
                writingPhase === 3 ? 9 :
                writingPhase === 4 ? 11 : 10
              ),
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ top: 22 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="sm:w-[24px] sm:h-[24px] drop-shadow-lg">
              <motion.g
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <rect x="8" y="3" width="8" height="16" rx="1.5" fill="#10b981" />
                <rect x="8" y="3" width="8" height="16" rx="1.5" fill="url(#penGrad2)" />
                <path d="M11 19 L13 19 L12 23 Z" fill="#059669" />
                <rect x="7" y="2" width="10" height="3" rx="1" fill="#059669" />
                <path d="M11.5 19 L12.5 19 L12 21 Z" fill="#047857" />
                {/* Pen clip */}
                <rect x="15" y="4" width="2" height="6" rx="0.5" fill="#047857" opacity="0.6" />
              </motion.g>
              {/* Pen glint */}
              <motion.circle
                cx="14" cy="7" r="1.5"
                fill="white" opacity="0.4"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="penGrad2" x1="8" y1="0" x2="16" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Writing tip glow */}
          <motion.div
            className="absolute size-2 rounded-full bg-emerald-400 blur-sm z-20"
            style={{ left: 14 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.3, 0.5],
              top: writingPhase === 0 ? 24 : (
                writingPhase === 1 ? 24 :
                writingPhase === 2 ? 42 :
                writingPhase === 3 ? 60 :
                writingPhase === 4 ? 78 : 24
              ),
            }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <motion.h3
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mt-6 text-lg font-bold relative"
        >
          <span
            className="bg-gradient-to-r from-emerald-600 via-teal-500 via-emerald-400 to-emerald-600 bg-clip-text text-transparent"
            style={{
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
            }}
          >
            <motion.span
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: 'linear-gradient(90deg, #059669, #14b8a6, #34d399, #059669)',
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Select a note
            </motion.span>
          </span>
          {/* Underline glow */}
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
            initial={{ scaleX: 0, width: 0 }}
            animate={{ scaleX: 1, width: 80 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ originX: 0.5 }}
          />
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mt-2 text-xs text-muted-foreground/50 max-w-[240px] mx-auto leading-relaxed"
        >
          Choose a note from the sidebar or create a new one to start writing.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mt-8 flex items-center justify-center gap-2.5 text-[10px] text-muted-foreground/40"
        >
          <motion.kbd
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0)",
                "0 0 0 6px rgba(16, 185, 129, 0.12)",
                "0 0 0 10px rgba(16, 185, 129, 0.03)",
                "0 0 0 0 rgba(16, 185, 129, 0)",
              ],
              scale: [1, 1.06, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400"
          >
            Ctrl+N
          </motion.kbd>
          <motion.span
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="text-[11px]"
          >
            to create a new note
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Component ---

export default function StudyNotes() {
  const user = useAuthStore((s) => s.user);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [mobileTab, setMobileTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const [editBuffer, setEditBuffer] = useState<StudyNote | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [trashNotes, setTrashNotes] = useState<StudyNote[]>([]);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doAutosave = useCallback((data: { id: string; title: string; content: string; category: string; tags: string[] }) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      fetch(`/api/notes/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title, content: data.content, category: data.category, tags: data.tags }),
      }).catch((err) => console.error("Autosave failed", err));
    }, 2000);
  }, []);

  // Fetch notes from API
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/notes?student_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => { setNotes((data.notes || []).map(toNote)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  // Fetch categories from API
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/notes/categories?student_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const names = (data.categories || []).map((c: any) => c.name);
        const unique = Array.from(new Set<string>(['General', ...names]));
        setCategories(unique);
      })
      .catch(() => setCategories(['General']));
  }, [user?.id]);

  // Handle pending note data from other features (e.g. Explain My Mistake)
  useEffect(() => {
    const pending = useAppStore.getState().pendingNoteData
    if (!pending || !user?.id) return
    useAppStore.getState().setPendingNoteData(null)
    const tempId = generateId()
    const defaultCat = categoryFilter !== 'All' ? categoryFilter : (categories.includes('General') ? 'General' : (categories[0] || 'General'))
    const newNote: StudyNote = { id: tempId, title: pending.title, content: pending.content, category: defaultCat, tags: [], createdAt: new Date(), updatedAt: new Date() }
    setNotes((prev) => [newNote, ...prev])
    setSelectedId(tempId)
    setEditBuffer({ ...newNote })
    setIsNewNote(true)
    setPendingTempId(tempId)
    setMobileTab("editor")
    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user.id, title: pending.title, content: pending.content, category: defaultCat, tags: [] }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.note) {
          setNotes((prev) => prev.map((n) => (n.id === tempId ? toNote(data.note) : n)))
          setSelectedId(data.note.id)
          setEditBuffer((prev) => prev && prev.id === tempId ? { ...prev, id: data.note.id } : prev)
        }
      })
      .catch(() => {})
  }, [user?.id, categoryFilter, categories])

  // Update edit buffer — init from notes if null
  const handleUpdate = useCallback((updates: Partial<StudyNote>) => {
    setEditBuffer((prev) => {
      let next: StudyNote;
      if (!prev) {
        const note = notes.find((n) => n.id === selectedId);
        if (!note) return null;
        next = { ...note, ...updates, updatedAt: new Date() };
      } else {
        next = { ...prev, ...updates, updatedAt: new Date() };
      }
      if (!next.id.startsWith("temp_") && !isNewNote) {
        doAutosave(next);
      }
      return next;
    });
  }, [notes, selectedId, isNewNote, doAutosave]);

  // Save note — POST for new, PUT for existing
  const handleSave = useCallback(() => {
    if (!editBuffer || !selectedId) return;
    const buffer = { ...editBuffer, updatedAt: new Date() };
    const isTemp = selectedId.startsWith("temp_");

    if (isTemp) {
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user!.id, title: buffer.title, content: buffer.content, category: buffer.category, tags: buffer.tags }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.note) {
            setNotes((prev) => prev.map((n) => (n.id === selectedId ? toNote(data.note) : n)));
            setSelectedId(data.note.id);
          }
        })
        .catch(() => {});
    } else {
      setNotes((prev) => prev.map((n) => (n.id === selectedId ? buffer : n)));
      fetch(`/api/notes/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: buffer.title, content: buffer.content, category: buffer.category, tags: buffer.tags }),
      }).catch(() => {});
    }

    setEditBuffer(null);
    setIsNewNote(false);
    setPendingTempId(null);
  }, [editBuffer, selectedId, user]);

  // Delete note by id
  const handleDeleteNote = useCallback((id: string) => {
    const isTemp = id.startsWith("temp_");
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditBuffer(null);
      setIsNewNote(false);
      setPendingTempId(null);
      setMobileTab("list");
    }
    if (!isTemp) {
      fetch(`/api/notes/${id}`, { method: "DELETE" }).catch(() => {});
    }
  }, [selectedId]);

  // Delete selected note
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    handleDeleteNote(selectedId);
  }, [selectedId, handleDeleteNote]);

  // Fetch trash
  const fetchTrash = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/notes/trash?student_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => setTrashNotes((data.notes || []).map(toNote)))
      .catch(() => {});
  }, [user?.id]);

  // Restore note
  const handleRestore = useCallback((id: string) => {
    fetch(`/api/notes/${id}/restore`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.note) {
          setTrashNotes((prev) => prev.filter((n) => n.id !== id));
          setNotes((prev) => [toNote(data.note), ...prev]);
        }
      })
      .catch(() => {});
  }, []);

  // Permanent delete
  const handlePermanentDelete = useCallback((id: string) => {
    fetch(`/api/notes/${id}?permanent=true`, { method: "DELETE" })
      .then(() => setTrashNotes((prev) => prev.filter((n) => n.id !== id)))
      .catch(() => {});
  }, []);

  // Toggle trash view
  const toggleTrash = useCallback(() => {
    setShowTrash((prev) => {
      if (!prev) fetchTrash();
      return !prev;
    });
  }, [fetchTrash]);

  // Select a note — discard unsaved temp note if empty
  const handleSelect = useCallback((id: string) => {
    if (isNewNote && editBuffer && editBuffer.id.startsWith('temp_') && !editBuffer.title && !editBuffer.content && editBuffer.tags.length === 0) {
      setNotes((prev) => prev.filter((n) => n.id !== editBuffer.id));
    }
    setSelectedId(id);
    setEditBuffer(null);
    setIsNewNote(false);
    setPendingTempId(null);
    setMobileTab("editor");
  }, [isNewNote, editBuffer]);

  // Create new note — local only, no API call until save
  const handleNewNote = useCallback(() => {
    if (!user?.id) return;
    const defaultCat = categoryFilter !== 'All' ? categoryFilter : (categories.includes('General') ? 'General' : (categories[0] || 'General'));
    const tempId = generateId();
    const newNote: StudyNote = { id: tempId, title: "", content: "", category: defaultCat, tags: [], createdAt: new Date(), updatedAt: new Date() };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(tempId);
    setEditBuffer({ ...newNote });
    setIsNewNote(true);
    setPendingTempId(tempId);
    setMobileTab("editor");
  }, [categoryFilter, user?.id, categories]);

  // Keyboard shortcut: Ctrl+N to create new note
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewNote]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (categoryFilter !== "All") result = result.filter((n) => n.category === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return result;
  }, [notes, categoryFilter, searchQuery]);

  // Selected note (from edit buffer or notes)
  const activeNote = useMemo(() => {
    if (!selectedId) return null;
    if (editBuffer && editBuffer.id === selectedId) return editBuffer;
    return notes.find((n) => n.id === selectedId) ?? null;
  }, [selectedId, editBuffer, notes]);

  const editorNote = activeNote ?? { id: "", title: "", content: "", category: "General", tags: [], createdAt: new Date(), updatedAt: new Date() };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex h-full min-h-0 md:min-h-[500px] md:rounded-2xl md:border md:border-border/40 bg-gradient-to-br from-card via-card/95 to-muted/30 md:overflow-hidden md:shadow-xl md:shadow-black/5"
    >
      {/* Page-level ambient orbs */}
      <motion.div
        className="absolute -top-32 -right-32 size-96 rounded-full bg-emerald-500/[0.03] blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 size-96 rounded-full bg-teal-500/[0.03] blur-3xl pointer-events-none"
        animate={{ scale: [1.1, 0.95, 1.1], rotate: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full">
        {/* Sidebar - only on large screens */}
        <div className="hidden lg:flex w-[260px] lg:w-[300px] xl:w-[35%] xl:min-w-[280px] xl:max-w-[400px] border-r border-border/30 flex-col bg-gradient-to-b from-background via-muted/10 to-background">
          {showTrash ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-600 shadow-md shadow-rose-500/20">
                    <Trash2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">Trash</h2>
                    <p className="text-[9px] text-muted-foreground/60">{trashNotes.length} note{trashNotes.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={toggleTrash}>
                  <PenLine className="h-3.5 w-3.5" />
                  Back
                </Button>
              </div>
              <ScrollArea className="flex-1 px-3 pb-3">
                {trashNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 text-xs gap-2">
                    <Trash2 className="h-8 w-8 opacity-30" />
                    <p>Trash is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {trashNotes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, scale: 0.95 }}
                          transition={{ duration: 0.25, delay: index * 0.035 }}
                          className="group rounded-xl border border-border/40 bg-card/40 p-3"
                        >
                          <h3 className="text-sm font-semibold leading-snug line-clamp-1 text-muted-foreground/80">
                            {note.title || <span className="italic text-muted-foreground/40">Untitled Note</span>}
                          </h3>
                          <p className="mt-1 text-[11px] text-muted-foreground/50 line-clamp-2">
                            {note.content || 'No content'}
                          </p>
                          <div className="mt-2.5 flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => handleRestore(note.id)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restore
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => handlePermanentDelete(note.id)}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Delete forever
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <NotesListSidebar
              notes={filteredNotes}
              selectedId={selectedId}
              onSelect={handleSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              onNewNote={handleNewNote}
              categories={categories}
              loading={loading}
              onDelete={handleDeleteNote}
              onTrashToggle={toggleTrash}
            />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-background to-muted/10">
          {selectedId && activeNote ? (
            <NoteEditor
              key={selectedId}
              note={editorNote}
              onUpdate={handleUpdate}
              onSave={handleSave}
              onDelete={handleDelete}
              isNew={isNewNote}
              categories={categories}
            />
          ) : (
            <EmptySelectState />
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col h-full lg:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex h-full flex-col gap-0">
          <TabsList className="w-full rounded-none bg-muted/40 backdrop-blur-sm border-b border-border/20 p-0">
            <TabsTrigger value="list" className="flex-1 text-[11px] sm:text-xs gap-1 sm:gap-1.5 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 py-2.5">
              <FolderOpen className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex-1 text-[11px] sm:text-xs gap-1 sm:gap-1.5 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 py-2.5">
              <PenLine className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 mt-2 overflow-hidden data-[state=inactive]:hidden">
            {showTrash ? (
              <div className="flex h-full flex-col px-3">
                <div className="flex items-center justify-between px-1 pt-2 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-600 shadow-md shadow-rose-500/20">
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h2 className="text-sm font-bold tracking-tight">Trash</h2>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={toggleTrash}>
                    <PenLine className="h-3 w-3" />
                    Back
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  {trashNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 text-xs gap-2">
                      <Trash2 className="h-8 w-8 opacity-30" />
                      <p>Trash is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4">
                      {trashNotes.map((note) => (
                        <div key={note.id} className="rounded-xl border border-border/40 bg-card/40 p-3">
                          <h3 className="text-sm font-semibold leading-snug line-clamp-1 text-muted-foreground/80">
                            {note.title || <span className="italic text-muted-foreground/40">Untitled Note</span>}
                          </h3>
                          <div className="mt-2.5 flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-emerald-600" onClick={() => handleRestore(note.id)}>
                              <RotateCcw className="h-3 w-3" /> Restore
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-rose-500" onClick={() => handlePermanentDelete(note.id)}>
                              <AlertTriangle className="h-3 w-3" /> Delete forever
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : filteredNotes.length === 0 && !loading ? (
              <EmptySearchState />
            ) : (
              <NotesListSidebar
                notes={filteredNotes}
                selectedId={selectedId}
                onSelect={handleSelect}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                onNewNote={handleNewNote}
                categories={categories}
                loading={loading}
                onDelete={handleDeleteNote}
                onTrashToggle={toggleTrash}
              />
            )}
          </TabsContent>

          <TabsContent value="editor" className="flex-1 mt-0 overflow-hidden flex flex-col data-[state=inactive]:hidden">
            {selectedId && activeNote ? (
              <NoteEditor
                key={selectedId}
                note={editorNote}
                onUpdate={handleUpdate}
                onSave={handleSave}
                onDelete={handleDelete}
                isNew={isNewNote}
                categories={categories}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <EmptySelectState />
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </motion.div>
  );
}
