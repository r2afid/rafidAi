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
  Clock,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.035, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
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
    </motion.div>
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
          <h2 className="text-sm font-bold tracking-tight">Study Notes</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onTrashToggle}
              title="Trash"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <Button
              size="sm"
              className="h-7 gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 rounded-lg px-2.5"
              onClick={onNewNote}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
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
      className="inline-flex items-center gap-1 rounded-full bg-slate-800/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-slate-400 border border-white/5 shadow-sm"
    >
      <Tag className="h-2.5 w-2.5 text-slate-500" />
      {tag}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-slate-600/40 transition-colors cursor-pointer"
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
  onBack,
  isNew,
  categories,
}: {
  note: StudyNote;
  onUpdate: (updates: Partial<StudyNote>) => void;
  onSave: () => void;
  onDelete: () => void;
  onBack?: () => void;
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

  const formatTools = [
    { icon: Heading1, label: 'H1', before: '# ', after: '' },
    { icon: Heading2, label: 'H2', before: '## ', after: '' },
    { icon: Bold, label: 'B', before: '**', after: '**' },
    { icon: Italic, label: 'I', before: '_', after: '_' },
    { icon: Code, label: 'Code', before: '`', after: '`' },
    { icon: List, label: 'List', before: '- ', after: '' },
    { icon: Quote, label: 'Quote', before: '> ', after: '' },
  ];

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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Header bar - aligned with max-w-4xl */}
      <div className="shrink-0 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto max-w-4xl px-8 flex items-center justify-between h-12"
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors mr-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                {isNew ? 'Cancel' : 'Back'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={note.category}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="text-[11px] bg-slate-800/40 rounded-lg px-2 py-1.5 border border-white/5 text-slate-400 font-medium cursor-pointer outline-none hover:border-emerald-500/30 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreview(!preview)}
              className={`p-1.5 rounded-lg transition-colors ${
                preview ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title="Toggle preview"
            >
              {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <motion.div whileTap={{ scale: 0.9 }}>
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition-colors ${
                  showDeleteConfirm
                    ? 'text-rose-500 bg-rose-500/15'
                    : 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10'
                }`}
                title={showDeleteConfirm ? 'Confirm delete' : 'Delete note'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="sm"
                className={`h-7 gap-1 text-[11px] rounded-lg transition-all px-3 ${
                  saveState === "saved"
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-sm"
                }`}
                onClick={handleSave}
                disabled={saveState === "saving"}
              >
                <AnimatePresence mode="wait">
                  {saveState === "saved" ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </motion.span>
                  ) : saveState === "saving" ? (
                    <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                        <Save className="h-3 w-3" />
                      </motion.div>
                      Saving
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                      <Save className="h-3 w-3" /> Save
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scrollable editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8 space-y-6">
          {/* Title */}
          <input
            ref={titleRef}
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Untitled Note"
            className="text-4xl font-extrabold text-slate-100 bg-transparent w-full tracking-tight placeholder:text-slate-700 focus:outline-none focus:ring-0"
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <AnimatePresence>
              {note.tags.map((tag) => (
                <TagPill key={tag} tag={tag} onRemove={() => removeTag(tag)} />
              ))}
            </AnimatePresence>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addTag(); }
              }}
              placeholder="Add tag..."
              className="bg-slate-800/40 text-slate-400 border border-white/5 rounded-full px-3 py-1 text-xs transition hover:text-slate-200 hover:bg-slate-800/80 outline-none"
            />
          </div>

          {/* Glassmorphic toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 backdrop-blur-sm gap-1 w-max shadow-sm flex items-center"
          >
            {formatTools.map((tool, i) => (
              <motion.button
                key={tool.label}
                initial={{ opacity: 0, scale: 0.6, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -2, 0] }}
                transition={{
                  delay: 0.25 + i * 0.04,
                  y: {
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  },
                  default: { type: "spring", stiffness: 300, damping: 14 }
                }}
                whileHover={{
                  scale: 1.2,
                  rotate: [0, -10, 8, -5, 0],
                  transition: { duration: 0.35, ease: "easeInOut" }
                }}
                whileTap={{
                  scale: 0.8,
                  rotate: 0,
                  transition: { type: "spring", stiffness: 500, damping: 8 }
                }}
                onClick={() => insertFormat(tool.before, tool.after)}
                className="size-8 rounded-md text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors text-xs font-medium flex items-center justify-center relative"
                title={tool.label}
              >
                <motion.div
                  className="absolute inset-0 rounded-md border border-emerald-400/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                />
                <tool.icon className="h-3.5 w-3.5 relative z-10" />
              </motion.button>
            ))}
          </motion.div>

          {/* Writing area */}
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[450px] sm:min-h-[550px] space-y-1"
              >
                {note.content.trim() ? renderMarkdown(note.content) : (
                  <p className="text-sm text-slate-500 italic">Nothing to preview</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="textarea" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea
                  ref={textareaRef}
                  value={note.content}
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  placeholder="✨ Type '/' for AI commands or start writing..."
                  className="w-full min-h-[450px] sm:min-h-[550px] text-base text-slate-300 bg-transparent resize-none focus:outline-none pt-2 leading-relaxed focus:ring-0 focus:border-0 placeholder:text-slate-600"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom stats */}
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <span>
              {charCount} char{charCount !== 1 ? 's' : ''} &middot; {note.content.split(/\s+/).filter(Boolean).length} word{note.content.split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}
            </span>
            <span>Updated {formatDate(note.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteGridCard({ note, onClick, onDelete, index = 0 }: { note: StudyNote; onClick: () => void; onDelete?: (id: string) => void; index?: number }) {
  const config = getCategoryConfig(note.category);
  const preview = truncate(note.content.replace(/\n/g, ' '), 100);

  const floatAmplitude = 2 + (index % 3) * 1.5;
  const floatDuration = 3 + (index % 4) * 0.8;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{
        y: -(4 + (index % 3)),
        scale: 1.02,
        rotate: index % 2 === 0 ? 0.8 : -0.8,
        boxShadow: `0 12px 40px -8px ${config.hex}25`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 18,
        mass: 0.8,
        delay: index * 0.04,
      }}
      onClick={onClick}
      className="group relative rounded-xl border border-border/20 bg-gradient-to-b from-card to-muted/20 p-3.5 cursor-pointer transition-colors hover:border-emerald-500/20"
    >
      {/* Animated accent bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.15 + index * 0.04, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl origin-left"
        style={{ background: `linear-gradient(90deg, ${config.hex}, ${config.hex}88, transparent)` }}
      />

      {/* Subtle breathing glow */}
      <motion.div
        animate={{
          opacity: [0.15, 0.4, 0.15],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.2,
        }}
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.hex}15, transparent 70%)` }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
            className={`size-2 rounded-full ${config.dotClass} shrink-0`}
          />
          <span className="text-[9px] font-medium text-muted-foreground/50 truncate">{note.category}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              className="p-1 rounded-md text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="size-3" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="relative z-10 mt-2 text-sm font-semibold leading-snug line-clamp-1 text-foreground/90">
        {note.title || <span className="italic text-muted-foreground/40">Untitled</span>}
      </h3>

      {/* Preview */}
      {preview && (
        <p className="relative z-10 mt-1 text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2">
          {preview}
        </p>
      )}

      {/* Footer */}
      <div className="relative z-10 mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {note.tags.slice(0, 2).map((tag, ti) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.04 + ti * 0.06 }}
              className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground/40 border border-border/20"
            >
              {tag}
            </motion.span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[8px] text-muted-foreground/30">+{note.tags.length - 2}</span>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground/30 shrink-0">
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </motion.div>
  );
}

function LoadingGrid() {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-border/20 p-3.5 animate-pulse">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-muted/40" />
              <div className="h-2.5 w-16 rounded bg-muted/40" />
            </div>
            <div className="mt-3 h-4 w-3/4 rounded bg-muted/30" />
            <div className="mt-2 h-3 w-full rounded bg-muted/20" />
            <div className="mt-1 h-3 w-2/3 rounded bg-muted/20" />
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-3 w-10 rounded-full bg-muted/30" />
              <div className="h-3 w-8 rounded-full bg-muted/30" />
              <div className="flex-1" />
              <div className="h-2.5 w-12 rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrashOverlay({ trashNotes, onRestore, onPermanentDelete, onClose }: {
  trashNotes: StudyNote[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-lg max-h-[80vh] flex flex-col bg-gradient-to-b from-card to-muted/20 rounded-2xl border border-border/30 shadow-2xl mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/15">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 shadow-md shadow-rose-500/20">
              <Trash2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Trash</h2>
              <p className="text-[9px] text-muted-foreground/60">{trashNotes.length} note{trashNotes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {trashNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 text-xs gap-2">
              <Trash2 className="h-10 w-10 opacity-30" />
              <p>Trash is empty</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {trashNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-border/30 bg-card/40 p-3"
                >
                  <h3 className="text-sm font-semibold leading-snug line-clamp-1 text-muted-foreground/80">
                    {note.title || <span className="italic text-muted-foreground/40">Untitled Note</span>}
                  </h3>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => onRestore(note.id)}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-[10px] font-medium rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Restore
                    </button>
                    <button
                      onClick={() => onPermanentDelete(note.id)}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-[10px] font-medium rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3" /> Delete forever
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
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
      className="flex flex-col items-center justify-center size-full text-center px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 border border-border/40 shadow-lg">
          <Search className="size-8 text-muted-foreground/40" />
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

function EmptySelectState({ onNewNote }: { onNewNote?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      {/* Ambient orbs */}
      <motion.div
        className="absolute -top-24 -right-24 size-72 rounded-full bg-emerald-500/[0.03] blur-3xl"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -left-24 size-72 rounded-full bg-teal-500/[0.03] blur-3xl"
        animate={{ scale: [1.2, 0.9, 1.2], rotate: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating sticky notes */}
      {[
        { top: 10, left: 6, delay: 0, rotate: -12, color: 'bg-amber-500' },
        { top: 18, right: 8, delay: 1.5, rotate: 8, color: 'bg-sky-500' },
        { top: 65, left: 5, delay: 3, rotate: -6, color: 'bg-violet-500' },
        { top: 58, right: 6, delay: 0.8, rotate: 15, color: 'bg-rose-500' },
        { top: 78, left: 12, delay: 2.2, rotate: -18, color: 'bg-emerald-500' },
      ].map((note, i) => (
        <motion.div
          key={`note-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: `${note.top}%`,
            left: note.left !== undefined ? `${note.left}%` : undefined,
            right: note.right !== undefined ? `${note.right}%` : undefined,
          }}
          animate={{
            opacity: [0, 0.35, 0],
            y: [0, -30 - Math.random() * 20],
            rotate: note.rotate,
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: note.delay,
            ease: "easeInOut",
          }}
        >
          <div className={`size-6 rounded-sm ${note.color}/15 border ${note.color}/25 shadow-sm`}>
            <div className={`mx-auto mt-1.5 size-3 rounded-sm ${note.color}/30`} />
          </div>
        </motion.div>
      ))}

      {/* Sparkle particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${15 + Math.random() * 70}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.8 + 0.5,
            ease: "easeInOut",
          }}
        >
          <div className="size-1.5 bg-emerald-400/40 rotate-45" />
        </motion.div>
      ))}

      {/* Central content */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-full"
      >
        <div className="flex flex-col items-center gap-7">
          {/* Animated icon with rotating rings */}
          <div className="relative">
            {/* Sparkles around the icon */}
            {[
              { angle: 0, delay: 0, size: 'size-1.5' },
              { angle: 72, delay: 0.8, size: 'size-2' },
              { angle: 144, delay: 1.6, size: 'size-1.5' },
              { angle: 216, delay: 0.4, size: 'size-2' },
              { angle: 288, delay: 1.2, size: 'size-1.5' },
            ].map((sparkle, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, Math.cos(sparkle.angle * Math.PI / 180) * 52],
                  y: [0, Math.sin(sparkle.angle * Math.PI / 180) * 52],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: sparkle.delay,
                  ease: "easeInOut",
                }}
              >
                <div className={`${sparkle.size} bg-emerald-400/60 rotate-45`}
                  style={{
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  }}
                />
              </motion.div>
            ))}
            <motion.div
              className="absolute -inset-6 rounded-full border border-emerald-500/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-3 rounded-full border border-dashed border-teal-500/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/15 shadow-lg shadow-emerald-500/5 backdrop-blur-sm"
            >
              <PenLine className="h-7 w-7 text-emerald-500/80" />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-emerald-500/10"
                animate={{ opacity: [0, 0.35, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>

        {/* Heading */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-xl font-bold tracking-tight"
        >
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Where Ideas Take Shape
          </span>
        </motion.h3>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-sm text-muted-foreground/60 max-w-[240px] leading-relaxed"
        >
          Create a new note to start writing. Your AI-powered study workspace is ready.
        </motion.p>

        {/* New Note button */}
        {onNewNote && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 8px 30px -5px rgba(16, 185, 129, 0.35)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewNote}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Note
          </motion.button>
        )}

        {/* Keyboard shortcut */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/40"
        >
          <span>or press</span>
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
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm"
          >
            Ctrl+N
          </motion.kbd>
        </motion.div>
        </div>
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

  const allCategories = useMemo(() => ['All', ...categories], [categories]);

  const handleBackFromEditor = useCallback(() => {
    if (isNewNote && editBuffer && editBuffer.id.startsWith('temp_') && !editBuffer.title && !editBuffer.content && editBuffer.tags.length === 0) {
      setNotes((prev) => prev.filter((n) => n.id !== editBuffer.id));
    }
    setSelectedId(null);
    setEditBuffer(null);
    setIsNewNote(false);
    setPendingTempId(null);
    setMobileTab("list");
  }, [isNewNote, editBuffer]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex h-full min-h-0 md:min-h-[500px] md:rounded-2xl md:border md:border-border/40 bg-gradient-to-br from-card via-card/95 to-muted/30 md:overflow-hidden md:shadow-xl md:shadow-black/5"
    >
      {/* Ambient orbs */}
      <motion.div className="absolute -top-32 -right-32 size-96 rounded-full bg-emerald-500/[0.03] blur-3xl pointer-events-none" animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-teal-500/[0.03] blur-3xl pointer-events-none" animate={{ scale: [1.1, 0.95, 1.1], rotate: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />

      <AnimatePresence mode="wait">
        {selectedId ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0f]"
          >
            <NoteEditor
              key={selectedId}
              note={editorNote}
              onUpdate={handleUpdate}
              onSave={handleSave}
              onDelete={handleDelete}
              onBack={handleBackFromEditor}
              isNew={isNewNote}
              categories={categories}
            />
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col w-full h-full"
          >
            {/* Top bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border/15"
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <motion.div
                  animate={{ rotate: [-2, 2, -2], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20"
                >
                  <PenLine className="h-4 w-4 text-white" />
                </motion.div>
                <h1 className="text-sm font-bold tracking-tight">Notes</h1>
                <motion.span
                  key={notes.length}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  className="text-[10px] text-muted-foreground/40 bg-muted/30 px-1.5 py-0.5 rounded-md"
                >
                  {notes.length}
                </motion.span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex items-center gap-1.5"
              >
                <div className="relative hidden sm:block">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="h-8 w-36 lg:w-48 rounded-lg border border-border/20 bg-muted/20 pl-8 pr-3 text-[11px] outline-none focus:border-emerald-500/30 focus:bg-background transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTrash}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Trash"
                >
                  <Trash2 className="size-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleNewNote}
                  className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 text-[11px] font-medium px-3 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <motion.span
                    animate={{ rotate: [0, 0, 0] }}
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="size-3.5" />
                  </motion.span>
                  <span className="hidden sm:inline">New</span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Category filters */}
            <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none border-b border-border/10">
              {allCategories.map((cat) => {
                const isActive = categoryFilter === cat;
                const isNoteCat = cat !== 'All';
                const ccfg = isNoteCat ? getCategoryConfig(cat) : null;
                return (
                  <motion.button
                    key={cat}
                    layout
                    onClick={() => setCategoryFilter(cat)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all border whitespace-nowrap cursor-pointer ${
                      isActive
                        ? isNoteCat
                          ? `${ccfg!.pillClass} shadow-sm border-current/30`
                          : "bg-foreground text-background border-foreground shadow-sm"
                        : "bg-muted/20 text-muted-foreground/60 border-border/15 hover:bg-muted/40 hover:text-foreground/80"
                    }`}
                    style={isActive && isNoteCat ? { boxShadow: `0 1px 3px 0 ${ccfg!.hex}1a` } as React.CSSProperties : undefined}
                  >
                    {isNoteCat && <span className={`size-1.5 rounded-full ${ccfg!.dotClass} ${isActive ? '' : 'opacity-40'}`} />}
                    {cat}
                  </motion.button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pt-6">
              {loading ? (
                <LoadingGrid />
              ) : notes.length === 0 ? (
                <EmptySelectState onNewNote={handleNewNote} />
              ) : filteredNotes.length === 0 ? (
                <EmptySearchState />
              ) : (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {filteredNotes.map((note, index) => (
                      <NoteGridCard
                        key={note.id}
                        note={note}
                        index={index}
                        onClick={() => handleSelect(note.id)}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trash modal */}
      <AnimatePresence>
        {showTrash && (
          <TrashOverlay
            trashNotes={trashNotes}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onClose={toggleTrash}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
