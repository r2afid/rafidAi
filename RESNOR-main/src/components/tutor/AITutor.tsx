'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import {
  Bot, Send, BookOpen, MessageSquare, Sparkles,
  Clipboard, ClipboardCheck, Search, Plus, Trash2,
  PanelLeftClose, PanelLeftOpen, FileText, Lightbulb,
  Code, GraduationCap, Trophy, RefreshCw, ChevronRight, ChevronDown,
  Hash, X, MoreHorizontal, Bookmark, Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

type TutorMode = 'explain' | 'simplify' | 'quiz' | 'revision' | 'problem-solving' | 'interview' | 'coding'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  mode: TutorMode
  topic: string | null
  createdAt: number
}

interface TopicCard {
  id: string
  name: string
  category: string
  icon: string
  courseId?: string
  courseCode?: string
}

const MODES: { key: TutorMode; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { key: 'explain', label: 'Explain', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' },
  { key: 'simplify', label: 'Simplify', icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' },
  { key: 'quiz', label: 'Quiz', icon: GraduationCap, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20' },
  { key: 'revision', label: 'Revision', icon: FileText, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' },
  { key: 'problem-solving', label: 'Problem-Solving', icon: RefreshCw, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20' },
  { key: 'interview', label: 'Interview', icon: Trophy, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' },
  { key: 'coding', label: 'Coding', icon: Code, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' },
]

const FALLBACK_TOPICS: TopicCard[] = [
  { id: 'arrays', name: 'Arrays & Linked Lists', category: 'Data Structures', icon: 'ListOrdered' },
  { id: 'trees', name: 'Trees & BST', category: 'Data Structures', icon: 'GitBranch' },
  { id: 'sorting', name: 'Sorting Algorithms', category: 'Algorithms', icon: 'ArrowUpDown' },
  { id: 'graph', name: 'Graphs & Traversal', category: 'Data Structures', icon: 'Share2' },
  { id: 'dp', name: 'Dynamic Programming', category: 'Algorithms', icon: 'Puzzle' },
  { id: 'hashing', name: 'Hash Tables', category: 'Data Structures', icon: 'Hash' },
  { id: 'recursion', name: 'Recursion', category: 'Algorithms', icon: 'RefreshCw' },
  { id: 'complexity', name: 'Big-O Complexity', category: 'Fundamentals', icon: 'TrendingUp' },
  { id: 'webdev', name: 'Web Development', category: 'Applied', icon: 'Globe' },
  { id: 'databases', name: 'Database Systems', category: 'Applied', icon: 'Database' },
]

const SUGGESTIONS_BY_MODE: Record<TutorMode, string[]> = {
  explain: ['Explain {topic} simply', 'How does {topic} work?', 'What are the key concepts?'],
  simplify: ['Simplify {topic} for me', 'Explain like I\'m 5', 'Give me an everyday analogy'],
  quiz: ['Quiz me on {topic}', 'Give me practice problems', 'Test my understanding'],
  revision: ['Summarize {topic}', 'Key formulas for {topic}', 'Quick reference card'],
  'problem-solving': ['Walk me through a problem', 'Guide me step by step', 'Help me solve this'],
  interview: ['Start an interview', 'Ask me a medium question', 'Give me a hard problem'],
  coding: ['Help me debug this code', 'Write a function for...', 'Explain this algorithm'],
}

function parseDate(ts: number | string | Date): Date {
  if (ts instanceof Date) return ts
  return new Date(ts)
}

function formatTime(ts: number | string): string {
  return parseDate(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: number | string): string {
  const d = parseDate(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fillTopicSuggestions(suggestions: string[], topic: string | null): string[] {
  const t = topic || 'this topic'
  return suggestions.map(s => s.replace('{topic}', t))
}

export default function AITutor() {
  const authUser = useAuthStore((s) => s.user)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversationsLoaded, setConversationsLoaded] = useState(false)

  const [activeMode, setActiveMode] = useState<TutorMode>('explain')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'topics'>('chats')
  const [topicSearch, setTopicSearch] = useState('')
  const [errorRetry, setErrorRetry] = useState(false)
  const [dynamicTopics, setDynamicTopics] = useState<TopicCard[]>([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!authUser?.id) {
      setConversationsLoaded(true)
      setTopicsLoading(false)
      return
    }
    fetch(`/api/tutor/conversations?student_id=${authUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        const convs: Conversation[] = (data.conversations || []).map((c: any) => ({
          id: c.id,
          title: c.title || 'New Chat',
          messages: [],
          mode: c.mode || 'explain',
          topic: c.topic || null,
          createdAt: new Date(c.createdAt).getTime(),
        }))
        setConversations(convs)
        setConversationsLoaded(true)
      })
      .catch(() => {
        setConversationsLoaded(true)
      })

    fetch(`/api/tutor/topics?student_id=${authUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.topics && data.topics.length > 0) {
          setDynamicTopics(data.topics.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            icon: 'Hash',
            courseId: t.courseId,
            courseCode: t.courseCode,
          })))
        }
        setTopicsLoading(false)
      })
      .catch(() => {
        setTopicsLoading(false)
      })
  }, [authUser?.id])

  const resolvedTopics = dynamicTopics.length > 0 ? dynamicTopics : FALLBACK_TOPICS
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null
  const messages = activeConversation?.messages || []
  const activeTopicCard = resolvedTopics.find(t => t.id === activeTopic)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const createNewConversation = useCallback(async () => {
    if (!authUser?.id) return
    try {
      const res = await fetch('/api/tutor/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: authUser.id,
          mode: activeMode,
          topic: activeTopicCard?.name || activeTopic,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const newConv: Conversation = {
        id: data.conversation.id,
        title: 'New Chat',
        messages: [],
        mode: activeMode,
        topic: activeTopicCard?.name || activeTopic,
        createdAt: new Date(data.conversation.createdAt).getTime(),
      }
      setConversations(prev => [newConv, ...prev])
      setActiveConversationId(newConv.id)
      setErrorRetry(false)
    } catch {
      const fallbackId = crypto.randomUUID()
      const newConv: Conversation = {
        id: fallbackId,
        title: 'New Chat',
        messages: [],
        mode: activeMode,
        topic: activeTopicCard?.name || activeTopic,
        createdAt: Date.now(),
      }
      setConversations(prev => [newConv, ...prev])
      setActiveConversationId(newConv.id)
      setErrorRetry(false)
    }
  }, [activeMode, activeTopic, activeTopicCard, authUser?.id])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConversationId === id) {
      setActiveConversationId(null)
    }
    fetch('/api/tutor/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id }),
    }).catch(() => {})
  }, [activeConversationId])

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setErrorRetry(false)

    const existing = conversations.find(c => c.id === id)
    if (existing) {
      setActiveMode(existing.mode as TutorMode)
      setActiveTopic(existing.topic)
    }
  }, [conversations])

  useEffect(() => {
    if (!activeConversationId || !authUser?.id) return
    const existing = conversations.find(c => c.id === activeConversationId)
    if (existing && existing.messages.length > 0) return

    fetch(`/api/tutor/conversations/${activeConversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.conversation) return
        const msgs: Message[] = (data.conversation.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || new Date(m.createdAt).getTime(),
        }))
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, messages: msgs, mode: data.conversation.mode, topic: data.conversation.topic, title: data.conversation.title }
              : c
          )
        )
        setActiveMode(data.conversation.mode || 'explain')
        setActiveTopic(data.conversation.topic || null)
      })
      .catch(() => {})
  }, [activeConversationId, authUser?.id])

  const handleModeChange = useCallback((mode: TutorMode) => {
    setActiveMode(mode)
    toast.success(`Mode changed to ${MODES.find(m => m.key === mode)?.label}`, {
      description: 'The new mode will apply to your next message.',
      duration: 2000,
    })
  }, [])

  const handleSelectTopic = useCallback((topicId: string) => {
    setActiveTopic(prev => prev === topicId ? null : topicId)
  }, [])

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
    }
  }, [])

  const handleSendMessage = useCallback(async (text?: string) => {
    const content = (text || inputValue).trim()
    if (!content || isTyping || !authUser?.id) return

    setInputValue('')
    setErrorRetry(false)

    let convId = activeConversationId
    if (!convId) {
      try {
        const res = await fetch('/api/tutor/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: authUser.id,
            mode: activeMode,
            topic: activeTopicCard?.name || activeTopic,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        convId = data.conversation.id
        const newConv: Conversation = {
          id: convId!,
          title: 'New Chat',
          messages: [],
          mode: activeMode,
          topic: activeTopicCard?.name || activeTopic,
          createdAt: new Date(data.conversation.createdAt).getTime(),
        }
        setConversations(prev => [newConv, ...prev])
        setActiveConversationId(convId)
      } catch {
        const fallbackId = crypto.randomUUID()
        const newConv: Conversation = {
          id: fallbackId,
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          messages: [],
          mode: activeMode,
          topic: activeTopicCard?.name || activeTopic,
          createdAt: Date.now(),
        }
        setConversations(prev => [newConv, ...prev])
        convId = fallbackId
        setActiveConversationId(convId)
      }
    }

    if (!convId) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c
      return { ...c, messages: [...c.messages, userMsg] }
    }))

    setIsTyping(true)

    let apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    setConversations(prev => {
      const conv = prev.find(c => c.id === convId)
      if (conv) {
        apiMessages = conv.messages.map(m => ({ role: m.role, content: m.content }))
      }
      return prev
    })

    await new Promise(r => setTimeout(r, 10))

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: activeMode,
          topic: activeTopicCard?.name || null,
          sessionId: convId,
          studentId: authUser.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      }

      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c
        const updated = { ...c, messages: [...c.messages, aiMsg] }
        if (data.title && updated.title === 'New Chat') {
          updated.title = data.title
        } else if (updated.title === 'New Chat' && content) {
          updated.title = content.length > 60 ? content.slice(0, 60) + '...' : content
        }
        return updated
      }))
    } catch (err) {
      const serverMsg = err instanceof Error ? err.message : 'Request failed'
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'm sorry, I encountered an issue: ${serverMsg}`,
        timestamp: Date.now(),
      }

      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c
        return { ...c, messages: [...c.messages, errorMsg] }
      }))
      setErrorRetry(true)
    } finally {
      setIsTyping(false)
    }
  }, [inputValue, isTyping, activeConversationId, activeMode, activeTopic, activeTopicCard, conversations, authUser?.id])

  const pendingTutorContext = useAppStore((s) => s.pendingTutorContext)
  const setPendingTutorContext = useAppStore((s) => s.setPendingTutorContext)
  const hasHandledContext = useRef(false)

  useEffect(() => {
    if (pendingTutorContext && conversationsLoaded && !hasHandledContext.current) {
      hasHandledContext.current = true
      setActiveConversationId(null)
      setPendingTutorContext(null)
      setTimeout(() => handleSendMessage(pendingTutorContext), 50)
    }
  }, [pendingTutorContext, conversationsLoaded, handleSendMessage, setPendingTutorContext])

  const handleRetry = useCallback(() => {
    if (!activeConversation || messages.length < 2) return
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return

    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c
      const updated = [...c.messages]
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated.pop()
      }
      return { ...c, messages: updated }
    }))
    setErrorRetry(false)

    setTimeout(() => {
      handleSendMessage(lastUserMsg.content)
    }, 100)
  }, [activeConversation, messages, activeConversationId, handleSendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [])

  const filteredTopics = topicSearch.trim()
    ? resolvedTopics.filter(t =>
        t.name.toLowerCase().includes(topicSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(topicSearch.toLowerCase())
      )
    : resolvedTopics

  useEffect(() => {
    const q = topicSearch.trim().toLowerCase()
    if (!q) return
    const toExpand = new Set(expandedCourses)
    for (const t of resolvedTopics) {
      const key = t.courseCode || t.category
      if (
        (t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) &&
        !toExpand.has(key)
      ) {
        toExpand.add(key)
      }
    }
    setExpandedCourses(toExpand)
  }, [topicSearch])

  const suggestions = fillTopicSuggestions(
    SUGGESTIONS_BY_MODE[activeMode],
    activeTopicCard?.name || null
  )

  interface ContextBriefData {
    question: string
    myAnswer: string
    correctAnswer: string
    mistakeType: string
    followUp: string
  }

  function parseContextBrief(content: string): ContextBriefData | null {
    if (!content.startsWith('[From Explain My Mistake]')) return null
    const lines = content.split('\n').map(l => l.trim())
    const getVal = (prefix: string) => {
      const line = lines.find(l => l.startsWith(prefix))
      return line ? line.slice(prefix.length).trim() : ''
    }
    const q = getVal('Question:')
    const ma = getVal('My answer:')
    const ca = getVal('Correct answer:')
    const mt = getVal('Mistake type:')
    const fuIdx = lines.findIndex(l => l.startsWith('Follow-up:'))
    const fu = fuIdx >= 0 ? lines.slice(fuIdx).map(l => l.replace(/^Follow-up:\s*/, '')).join(' ').trim() : ''
    if (!q) return null
    return { question: q, myAnswer: ma, correctAnswer: ca, mistakeType: mt, followUp: fu }
  }

  const ContextBriefCard = ({ data }: { data: ContextBriefData }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto my-2"
    >
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/10 bg-amber-500/5">
          <div className="size-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">!</div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Context Brief</span>
          <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium">Explain My Mistake</Badge>
        </div>
        <div className="px-3 py-2 space-y-1.5">
          <div className="text-[11px]">
            <span className="text-muted-foreground font-medium">Question: </span>
            <span className="text-foreground/90">{data.question}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="text-rose-500 font-medium">Your answer:</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono">{data.myAnswer || '\u2014'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-emerald-500 font-medium">Correct:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">{data.correctAnswer || '\u2014'}</span>
            </span>
          </div>
          {data.mistakeType && (
            <div className="text-[11px]">
              <span className="text-muted-foreground font-medium">Concept: </span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium">{data.mistakeType}</Badge>
            </div>
          )}
          {data.followUp && (
            <div className="pt-1 border-t border-amber-500/10 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/70">Follow-up: </span>
              {data.followUp}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-2.5"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5 shadow-xs">
        <Bot className="size-3.5" />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/80">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/40"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )

  const CodeBlock = ({ className, children }: { className?: string; children: string }) => {
    const match = /language-(\w+)/.exec(className || '')
    const lang = match ? match[1] : ''
    const code = String(children).replace(/\n$/, '')
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div className="relative my-3 rounded-xl overflow-hidden border border-border/50 bg-zinc-950 dark:bg-zinc-900 shadow-xs">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 bg-zinc-900/80 dark:bg-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500/80" />
              <span className="size-2 rounded-full bg-amber-500/80" />
              <span className="size-2 rounded-full bg-emerald-500/80" />
            </div>
            {lang && (
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider ml-2">{lang}</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md px-2 py-1"
          >
            {copied ? <ClipboardCheck className="size-3 text-emerald-400" /> : <Clipboard className="size-3" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <pre className="overflow-x-auto p-4">
          <code className={cn('text-xs leading-relaxed font-mono', !lang && 'text-emerald-300')}>{code}</code>
        </pre>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
          <Bot className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground">AI Tutor</h2>
          <p className="text-[11px] text-muted-foreground/70">7 learning modes</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <Button
          onClick={() => { createNewConversation(); setMobileSheetOpen(false) }}
          className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20 h-9 text-xs"
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </div>

      <div className="relative flex items-center bg-slate-500/[0.03] dark:bg-white/[0.01] backdrop-blur-sm border border-slate-200/50 dark:border-white/5 p-1 mx-4 mb-2 rounded-xl shadow-none">
        <button
          onClick={() => setSidebarTab('chats')}
          className={cn(
            'flex-1 relative z-10 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors duration-200',
            sidebarTab === 'chats' ? 'text-emerald-600 font-semibold dark:text-white dark:font-medium' : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {sidebarTab === 'chats' && (
            <motion.div
              layoutId="activeSidebarTabPill"
              className="absolute inset-0 bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm shadow-slate-200/50 dark:shadow-black/40 z-0 backdrop-blur-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            Chats
          </span>
        </button>
        <button
          onClick={() => setSidebarTab('topics')}
          className={cn(
            'flex-1 relative z-10 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors duration-200',
            sidebarTab === 'topics' ? 'text-emerald-600 font-semibold dark:text-white dark:font-medium' : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {sidebarTab === 'topics' && (
            <motion.div
              layoutId="activeSidebarTabPill"
              className="absolute inset-0 bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm shadow-slate-200/50 dark:shadow-black/40 z-0 backdrop-blur-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            Topics
          </span>
        </button>
      </div>

      <div className="mx-4 h-px bg-border/50" />

      <ScrollArea className="flex-1 min-h-0 w-full">
        {sidebarTab === 'chats' ? (
          <div className="px-3 py-2 space-y-0.5">
            {conversations.length === 0 && (
              <div className="py-10 text-center">
                <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/60">No conversations yet</p>
                <p className="text-[11px] text-muted-foreground/40 mt-1">Start a new chat to begin</p>
              </div>
            )}
            <AnimatePresence>
              {conversations.slice(0, 10).map((conv, index) => {
                const modeInfo = MODES.find(m => m.key === conv.mode)
                const ModeIcon = modeInfo?.icon || BookOpen
                const isActive = conv.id === activeConversationId

                return (
                    <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="w-full"
                  >
                    <div
                      className={cn(
                        'group flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-all w-full',
                        'hover:bg-muted/60',
                        isActive && 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                      )}
                      onClick={() => { switchConversation(conv.id); setMobileSheetOpen(false) }}
                    >
                      <div className={cn(
                        'flex size-7 items-center justify-center rounded-md shrink-0 transition-colors',
                        isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted/60 text-muted-foreground'
                      )}>
                        <ModeIcon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-[10px]', isActive ? 'text-emerald-600/60 dark:text-emerald-400/60' : 'text-muted-foreground/50')}>{formatDate(conv.createdAt)}</span>
                          {conv.topic && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground/60 font-medium">{conv.topic}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                        className="opacity-0 group-hover:opacity-100 size-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="px-3 py-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search courses & topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {filteredTopics.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No topics found</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Try a different search term</p>
              </div>
            ) : (
              (() => {
                const groups = new Map<string, { courseCode: string; courseName: string; topics: TopicCard[] }>()
                for (const t of filteredTopics) {
                  const key = t.courseCode || t.category
                  if (!groups.has(key)) {
                    groups.set(key, { courseCode: key, courseName: t.category, topics: [] })
                  }
                  groups.get(key)!.topics.push(t)
                }
                const hasSearch = topicSearch.trim().length > 0
                return Array.from(groups.entries()).map(([key, group]) => {
                  const isExpanded = expandedCourses.has(key)
                  const hasActive = group.topics.some(t => t.id === activeTopic)
                  return (
                    <div key={key} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                      <button
                        onClick={() => {
                          setExpandedCourses(prev => {
                            const next = new Set(prev)
                            if (next.has(key)) next.delete(key)
                            else next.add(key)
                            return next
                          })
                        }}
                        className={cn(
                          'flex items-center gap-2.5 w-full px-4 py-3 text-left transition-colors',
                          hasActive ? 'bg-emerald-500/10' : 'hover:bg-muted/60'
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{group.courseName}</p>
                          <p className="text-[10px] text-muted-foreground/70">{group.courseCode} · {group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}</p>
                        </div>
                        {hasActive && (
                          <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border/30 px-1.5 pb-2">
                              {group.topics.map((topic, idx) => {
                                const isSelected = activeTopic === topic.id
                                return (
                                  <motion.button
                                    key={topic.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => handleSelectTopic(topic.id)}
                                    className={cn(
                                      'flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left transition-all',
                                      isSelected
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    )}
                                  >
                                    <div className={cn(
                                      'size-1.5 rounded-full shrink-0 transition-colors',
                                      isSelected ? 'bg-emerald-500' : 'bg-border'
                                    )} />
                                    <span className="text-xs font-medium leading-snug truncate">{topic.name}</span>
                                    {isSelected && (
                                      <span className="ml-auto text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">Active</span>
                                    )}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              })()
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 w-full max-h-screen overflow-hidden">
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl overflow-hidden shrink-0 transition-all duration-250 ease-out',
          sidebarOpen ? 'w-80 xl:w-80 2xl:w-96 opacity-100 shadow-sm shadow-black/[0.02] dark:shadow-black/[0.08]' : 'w-0 opacity-0 border-r-0'
        )}
      >
        <div className={cn('w-80 xl:w-80 2xl:w-96 h-full', !sidebarOpen && 'pointer-events-none')}>
          <SidebarContent />
        </div>
      </aside>

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-80 p-0 backdrop-blur-xl bg-card/95">
          <SheetTitle className="sr-only">AI Tutor Sidebar</SheetTitle>
          <SheetDescription className="sr-only">Chat history and topic selection</SheetDescription>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 h-full max-h-full overflow-hidden w-full relative bg-transparent">
        <div className="shrink-0 border-b border-border/40 bg-card/50 backdrop-blur-md z-10 relative">
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 overflow-x-auto scrollbar-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'shrink-0 flex items-center justify-center size-7 rounded-lg transition-all',
                    sidebarOpen
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/60'
                  )}
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      setSidebarOpen(prev => !prev)
                    } else {
                      setMobileSheetOpen(true)
                    }
                  }}
                >
                  {sidebarOpen ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <p>{sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border/40 shrink-0" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
                    'hover:bg-muted/60',
                    MODES.find(m => m.key === activeMode)?.color,
                  )}
                >
                  {(() => {
                    const CurrentIcon = MODES.find(m => m.key === activeMode)?.icon || Bot
                    return <CurrentIcon className="size-3.5" />
                  })()}
                  <span className="max-w-[80px] sm:max-w-none truncate text-foreground/80">
                    {MODES.find(m => m.key === activeMode)?.label}
                  </span>
                  <ChevronDown className="size-3 opacity-40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="w-[220px] sm:w-[240px] p-1.5 shadow-lg border-border/50">
                {MODES.map((mode) => {
                  const ModeIcon = mode.icon
                  const isActive = activeMode === mode.key
                  return (
                    <DropdownMenuItem
                      key={mode.key}
                      onClick={() => handleModeChange(mode.key)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all',
                        isActive ? 'bg-emerald-500/10' : 'hover:bg-muted/60'
                      )}
                    >
                      <div className={cn(
                        'flex size-8 items-center justify-center rounded-lg',
                        isActive ? mode.bgColor : 'border border-border/50 bg-muted/40'
                      )}>
                        <ModeIcon className={cn('size-3.5', isActive ? mode.color : 'text-muted-foreground/60')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>{mode.label}</p>
                        <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                          {mode.key === 'explain' ? 'Detailed explanations with examples' :
                           mode.key === 'simplify' ? 'Simple, beginner-friendly language' :
                           mode.key === 'quiz' ? 'Interactive questioning' :
                           mode.key === 'revision' ? 'Concise summaries & cheat sheets' :
                           mode.key === 'problem-solving' ? 'Step-by-step guided solutions' :
                           mode.key === 'interview' ? 'Oral exam simulation' :
                           'Code writing, debugging & optimization'}
                        </p>
                      </div>
                      {isActive && (
                        <div className="size-1.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 min-w-[4px]" />

            {activeTopicCard && (
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 text-xs gap-1 cursor-pointer transition-colors border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hidden sm:flex max-w-[120px] md:max-w-none'
                )}
                onClick={() => setActiveTopic(null)}
              >
                <BookOpen className="size-3 shrink-0" />
                <span className="truncate">{activeTopicCard.name}</span>
                <X className="size-2.5 ml-0.5 opacity-50 shrink-0" />
              </Badge>
            )}

            <div className={cn(
              'shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium',
              isTyping ? 'bg-amber-500/8 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400'
            )}>
              <span className={cn('size-1.5 rounded-full', isTyping ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
              <span className="hidden sm:inline">{isTyping ? 'Thinking' : 'Online'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto w-full scroll-smooth scrollbar-thin">
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 px-4 py-6">
            {messages.length === 0 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-10 sm:py-14 md:py-16"
              >
                <motion.div
                  className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 mb-4"
                  animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Bot className="size-7 sm:size-8" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">How can I help you today?</h2>
                <p className="text-sm text-muted-foreground/60 mb-6 sm:mb-7 text-center max-w-md leading-relaxed">
                  Choose a learning mode below or type your question
                </p>

<div className="w-full max-w-xl mb-5 sm:mb-6">
  <div className="grid grid-cols-4 gap-2">
                    {MODES.map((mode) => {
                      const Icon = mode.icon
                      return (
                        <button
                          key={mode.key}
                          onClick={() => handleModeChange(mode.key)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-xl border border-border/60 p-2.5 sm:p-3.5 transition-all bg-card/50 hover:bg-card hover:border-border hover:shadow-sm',
                            activeMode === mode.key && 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                          )}
                        >
                          <div className={cn('flex size-7 sm:size-8 items-center justify-center rounded-lg transition-colors', activeMode === mode.key ? mode.bgColor : 'bg-muted/60')}>
                            <Icon className={cn('size-3.5 sm:size-4', mode.color)} />
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/80 text-center leading-tight">{mode.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

<div className="w-full max-w-xl">
  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="size-3.5 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground/60 font-medium">Suggested Questions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 4).map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSendMessage(q)}
                        className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-xs text-muted-foreground/70 transition-all hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => {
                const contextData = msg.role === 'user' ? parseContextBrief(msg.content) : null

                if (contextData) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ContextBriefCard data={contextData} />
                    </motion.div>
                  )
                }

                return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('group flex items-start gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}
                >
                  {msg.role === 'assistant' ? (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm ring-2 ring-background mt-0.5">
                      <Bot className="size-3.5" />
                    </div>
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold ring-2 ring-background mt-0.5">
                      RA
                    </div>
                  )}

                  <div className="relative max-w-[85%] sm:max-w-[80%] md:max-w-[75%]">
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'rounded-tr-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                          : 'rounded-tl-sm bg-muted shadow-xs'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-neutral max-w-none dark:prose-invert prose-sm
                          [&_p]:mb-1.5 [&_p:last-child]:mb-0
                          [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2
                          [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5
                          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
                          [&_ul]:text-sm [&_ul]:mb-2 [&_ul]:pl-4
                          [&_ol]:text-sm [&_ol]:mb-2 [&_ol]:pl-4
                          [&_li]:mb-0.5
                          [&_strong]:font-semibold
                          [&_em]:italic
                          [&_blockquote]:border-l-[2px] [&_blockquote]:border-emerald-500/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/70 [&_blockquote]:my-2
                          [&_table]:text-xs [&_table]:w-full [&_table]:my-2
                          [&_th]:border-b [&_th]:py-1.5 [&_th]:px-2 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-muted/50
                          [&_td]:border-b [&_td]:py-1.5 [&_td]:px-2 [&_td]:text-muted-foreground/80
                          [&_hr]:my-3 [&_hr]:border-border/50
                          [&_code]:bg-foreground/5 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_code]:border [&_code]:border-border/30
                        ">
                          <ReactMarkdown
                            components={{
                              pre({ children }) {
                                return <>{children}</>
                              },
                              code({ className: codeClassName, children }) {
                                const isBlock = codeClassName?.includes('language-') || (typeof children === 'string' && children.includes('\n'))
                                if (isBlock) {
                                  return <CodeBlock className={codeClassName}>{children as string}</CodeBlock>
                                }
                                return <code className={codeClassName}>{children}</code>
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    <div className={cn('mt-0.5 px-0.5', msg.role === 'user' ? 'text-right' : '')}>
                      <span className="text-[10px] text-muted-foreground/40">{formatTime(msg.timestamp)}</span>
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="absolute -top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center rounded-md bg-background border border-border/50 shadow-xs">
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="flex items-center gap-1 px-1.5 py-1 text-muted-foreground/60 hover:text-foreground transition-colors rounded-l-md"
                          >
                            {copiedId === msg.id ? <ClipboardCheck className="size-3 text-emerald-500" /> : <Clipboard className="size-3" />}
                          </button>
                          <div className="w-px h-3 bg-border/50" />
                          <button className="flex items-center px-1.5 py-1 text-muted-foreground/60 hover:text-foreground transition-colors rounded-r-md">
                            <Save className="size-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                )
              })}
            </AnimatePresence>

            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>

            {errorRetry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                >
                  <RefreshCw className="size-3" />
                  <span>Retry</span>
                </button>
              </motion.div>
            )}

            {messages.length > 0 && !isTyping && (
              <div className="pt-1 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <Sparkles className="size-3 shrink-0 text-muted-foreground/40" />
                  {suggestions.slice(0, 4).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="shrink-0 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1.5 text-[11px] text-muted-foreground/60 transition-all whitespace-nowrap hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="w-full border-t border-border/40 bg-transparent pt-3 pb-6 px-4 shrink-0">
          <div className="w-full max-w-3xl mx-auto relative flex items-center gap-1.5 bg-background border border-border/50 rounded-2xl shadow-xs px-3 py-2 min-h-[52px] focus-within:ring-2 focus-within:ring-emerald-500/15 focus-within:border-emerald-500/30 transition-all duration-300">
              <div className="hidden sm:flex items-center gap-0.5 pr-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(suggestions[0])}
                      className="size-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="Explain"
                    >
                      <BookOpen className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4}><p>Explain</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => { setActiveMode('quiz'); handleSendMessage(`Quiz me on ${activeTopicCard?.name || 'this topic'}`) }}
                      className="size-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      title="Quiz me"
                    >
                      <GraduationCap className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4}><p>Quiz me</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled
                      className="size-7 rounded-lg flex items-center justify-center text-muted-foreground/20 cursor-not-allowed"
                      title="Upload PDF (coming soon)"
                    >
                      <FileText className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4}><p>Upload PDF (coming soon)</p></TooltipContent>
                </Tooltip>
                <div className="w-px h-5 bg-border/40 mx-0.5" />
              </div>

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeTopicCard
                    ? `Ask about ${activeTopicCard.name}... (${MODES.find(m => m.key === activeMode)?.label} mode)`
                    : 'Ask me anything... (Enter to send, Shift+Enter for newline)'
                }
                disabled={isTyping}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40 min-h-[28px] max-h-[160px] py-1.5 disabled:opacity-50"
              />

              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="shrink-0 size-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20 disabled:opacity-30 disabled:shadow-none"
              >
                <Send className="size-3.5" />
              </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
