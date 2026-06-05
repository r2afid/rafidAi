'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  RotateCcw,
  BookOpen,
  Target,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Brain,
  Check,
  History,
  Lightbulb,
  Link2,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// ── Types ──────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard'
type QuizStep = 'selection' | 'loading' | 'active' | 'results' | 'history'

interface QuizQuestion {
  id: string
  topic: string
  difficulty: Difficulty
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface QuizConfig {
  topics: string[]
  difficulty: Difficulty
  questionCount: number
}

interface QuizResult {
  questionId: string
  selectedIndex: number | null
  isCorrect: boolean
  topic: string
  question: string
  userAnswer: string | null
  correctAnswer: string
  explanation: string
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: 'arrays', title: 'Arrays & Linked Lists', icon: '📊' },
  { id: 'trees', title: 'Trees & BST', icon: '🌳' },
  { id: 'sorting', title: 'Sorting Algorithms', icon: '🔀' },
  { id: 'graph', title: 'Graphs & Traversal', icon: '🕸️' },
  { id: 'dp', title: 'Dynamic Programming', icon: '🧩' },
  { id: 'hashing', title: 'Hash Tables', icon: '🔑' },
  { id: 'recursion', title: 'Recursion', icon: '🔄' },
  { id: 'complexity', title: 'Big-O Complexity', icon: '📈' },
]

const QUESTIONS_BY_TOPIC: Record<string, Record<Difficulty, QuizQuestion[]>> = {
  arrays: {
    easy: [
      { id: 'arr-e1', topic: 'Arrays & Linked Lists', difficulty: 'easy', question: 'What is the time complexity of accessing an element by index in an array?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(nÂ²)'], correctIndex: 0, explanation: 'Arrays provide O(1) random access because elements are stored in contiguous memory, and the address of any element can be calculated directly from its index.' },
      { id: 'arr-e2', topic: 'Arrays & Linked Lists', difficulty: 'easy', question: 'What does each node in a singly linked list contain?', options: ['Data and a pointer to the next node', 'Data and pointers to both next and previous nodes', 'Only data', 'Only a pointer'], correctIndex: 0, explanation: 'A singly linked list node contains data and one pointer to the next node. Doubly linked lists have an additional pointer to the previous node.' },
      { id: 'arr-e3', topic: 'Arrays & Linked Lists', difficulty: 'easy', question: 'Which data structure uses contiguous memory allocation?', options: ['Array', 'Linked List', 'Binary Tree', 'Hash Table'], correctIndex: 0, explanation: 'Arrays store elements in contiguous memory locations, which enables O(1) random access. Linked lists store nodes scattered in memory, connected by pointers.' },
      { id: 'arr-e4', topic: 'Arrays & Linked Lists', difficulty: 'easy', question: 'What happens when you try to insert an element at the beginning of an array?', options: ['All existing elements must be shifted right', 'The element is inserted in O(1)', 'A new array is always created', 'The array size doubles'], correctIndex: 0, explanation: 'Inserting at the beginning of an array requires shifting all existing elements one position to the right, resulting in O(n) time complexity.' },
      { id: 'arr-e5', topic: 'Arrays & Linked Lists', difficulty: 'easy', question: 'What is a dynamic array?', options: ['An array that can resize itself automatically', 'An array with variable data types', 'A linked list implementation', 'An array that only grows, never shrinks'], correctIndex: 0, explanation: 'A dynamic array (like Python\'s list or Java\'s ArrayList) can resize itself automatically when full, typically by doubling the capacity and copying elements.' },
    ],
    medium: [
      { id: 'arr-m1', topic: 'Arrays & Linked Lists', difficulty: 'medium', question: 'What is the time complexity of inserting at the head of a singly linked list?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correctIndex: 0, explanation: 'Inserting at the head only requires creating a new node, pointing it to the current head, and updating the head pointer â€” all O(1) operations.' },
      { id: 'arr-m2', topic: 'Arrays & Linked Lists', difficulty: 'medium', question: 'Which is better for a cache-friendly implementation?', options: ['Array', 'Linked List', 'Both are equal', 'Neither'], correctIndex: 0, explanation: 'Arrays are more cache-friendly because elements are stored contiguously in memory, leading to better spatial locality and fewer cache misses.' },
      { id: 'arr-m3', topic: 'Arrays & Linked Lists', difficulty: 'medium', question: 'How do you detect a cycle in a linked list?', options: ['Floyd\'s Cycle Detection (tortoise and hare)', 'Binary search on the list', 'Sort the list and check', 'Use a stack'], correctIndex: 0, explanation: 'Floyd\'s algorithm uses two pointers â€” a slow pointer moving one step and a fast pointer moving two steps. If they meet, a cycle exists.' },
      { id: 'arr-m4', topic: 'Arrays & Linked Lists', difficulty: 'medium', question: 'What is the amortized time complexity of appending to a dynamic array?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(nÂ²)'], correctIndex: 0, explanation: 'Although resizing is O(n), it happens infrequently. Over n insertions, the total work is O(n), making the amortized cost per insertion O(1).' },
      { id: 'arr-m5', topic: 'Arrays & Linked Lists', difficulty: 'medium', question: 'Given a linked list: 1â†’2â†’3â†’4â†’5, after reversing it becomes:', options: ['5â†’4â†’3â†’2â†’1', '1â†’5â†’4â†’3â†’2', '2â†’3â†’4â†’5â†’1', '5â†’1â†’2â†’3â†’4'], correctIndex: 0, explanation: 'Reversing a linked list flips all the pointers: 5â†’4â†’3â†’2â†’1. This can be done iteratively in O(n) time with O(1) space.' },
    ],
    hard: [
      { id: 'arr-h1', topic: 'Arrays & Linked Lists', difficulty: 'hard', question: 'What is the time complexity of merging k sorted linked lists with total n elements?', options: ['O(n log k)', 'O(nk)', 'O(nÂ²)', 'O(k log n)'], correctIndex: 0, explanation: 'Using a min-heap of size k, we can merge k sorted lists in O(n log k) time â€” n total elements, each insertion/removal from heap is O(log k).' },
      { id: 'arr-h2', topic: 'Arrays & Linked Lists', difficulty: 'hard', question: 'Which algorithm can find the kth element from the end of a singly linked list in one pass?', options: ['Two-pointer technique with k gap', 'Reverse then traverse', 'Stack-based approach', 'Binary search'], correctIndex: 0, explanation: 'Use two pointers: advance the first pointer k steps, then move both together. When the first reaches the end, the second is at the kth from the end.' },
      { id: 'arr-h3', topic: 'Arrays & Linked Lists', difficulty: 'hard', question: 'What is the space complexity of a recursive linked list reversal?', options: ['O(n) due to call stack', 'O(1)', 'O(log n)', 'O(nÂ²)'], correctIndex: 0, explanation: 'Recursive reversal uses O(n) space on the call stack since each recursive call adds a frame. The iterative version uses only O(1) space.' },
      { id: 'arr-h4', topic: 'Arrays & Linked Lists', difficulty: 'hard', question: 'In a circular buffer implementation, when is data considered overwritten?', options: ['When the head catches up to the tail', 'When the buffer is exactly half full', 'When a resize operation occurs', 'Never â€” it throws an error'], correctIndex: 0, explanation: 'In a circular buffer, when the write pointer wraps around and catches the read pointer, old data is overwritten. This is a design tradeoff for O(1) operations.' },
      { id: 'arr-h5', topic: 'Arrays & Linked Lists', difficulty: 'hard', question: 'What data structure is used to implement an LRU cache efficiently?', options: ['Hash Map + Doubly Linked List', 'Singly Linked List only', 'Array + Binary Search', 'Stack + Queue'], correctIndex: 0, explanation: 'A hash map provides O(1) lookup, and a doubly linked list provides O(1) insertion/deletion for maintaining access order. This combination achieves O(1) for both get and put.' },
    ],
  },
  trees: {
    easy: [
      { id: 'tree-e1', topic: 'Trees & BST', difficulty: 'easy', question: 'What is the maximum number of nodes at level L of a binary tree?', options: ['2^L', '2^L - 1', 'LÂ²', 'L + 1'], correctIndex: 0, explanation: 'At level L (0-indexed root), the maximum number of nodes is 2^L. The root (level 0) has 1 node, level 1 has 2, level 2 has 4, and so on.' },
      { id: 'tree-e2', topic: 'Trees & BST', difficulty: 'easy', question: 'In a Binary Search Tree, where are values less than the root stored?', options: ['Left subtree only', 'Right subtree only', 'Both subtrees', 'At the root level'], correctIndex: 0, explanation: 'BST property: left subtree contains only values less than the root, right subtree contains only values greater than the root.' },
      { id: 'tree-e3', topic: 'Trees & BST', difficulty: 'easy', question: 'What is a leaf node?', options: ['A node with no children', 'The root node', 'A node with one child', 'A node at the maximum depth'], correctIndex: 0, explanation: 'A leaf node (also called an external node) is a node with no children â€” both left and right child pointers are null.' },
      { id: 'tree-e4', topic: 'Trees & BST', difficulty: 'easy', question: 'Which traversal visits the root first?', options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correctIndex: 0, explanation: 'Pre-order traversal visits nodes in the order: Root â†’ Left â†’ Right. In-order visits Left â†’ Root â†’ Right. Post-order visits Left â†’ Right â†’ Root.' },
      { id: 'tree-e5', topic: 'Trees & BST', difficulty: 'easy', question: 'What is the height of a tree with only a root node?', options: ['0', '1', '-1', 'Undefined'], correctIndex: 0, explanation: 'The height of a tree with only a root node is 0, as height is defined as the number of edges on the longest path from root to a leaf.' },
    ],
    medium: [
      { id: 'tree-m1', topic: 'Trees & BST', difficulty: 'medium', question: 'What is the worst-case height of a BST with n nodes?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(âˆšn)'], correctIndex: 0, explanation: 'A skewed BST (essentially a linked list) has O(n) height. Self-balancing BSTs like AVL trees guarantee O(log n) height.' },
      { id: 'tree-m2', topic: 'Trees & BST', difficulty: 'medium', question: 'What does in-order traversal of a BST produce?', options: ['Elements in sorted order', 'Elements in reverse order', 'Random order', 'Level-by-level order'], correctIndex: 0, explanation: 'In-order traversal of a BST visits left â†’ root â†’ right, which naturally produces elements in ascending sorted order.' },
      { id: 'tree-m3', topic: 'Trees & BST', difficulty: 'medium', question: 'In an AVL tree, what is the maximum allowed balance factor?', options: ['1', '0', '2', '-1'], correctIndex: 0, explanation: 'AVL trees maintain a balance factor (height difference between left and right subtrees) of at most 1 for every node, ensuring O(log n) operations.' },
      { id: 'tree-m4', topic: 'Trees & BST', difficulty: 'medium', question: 'Which rotation is performed when a node is inserted in the left subtree of the left child?', options: ['Right rotation (LL case)', 'Left rotation (RR case)', 'Left-Right rotation (LR case)', 'Right-Left rotation (RL case)'], correctIndex: 0, explanation: 'An LL imbalance (left-left case) requires a single right rotation to rebalance the tree.' },
      { id: 'tree-m5', topic: 'Trees & BST', difficulty: 'medium', question: 'What is the minimum number of nodes in a complete binary tree of height h?', options: ['2^h', '2^(h+1) - 1', 'h', 'h + 1'], correctIndex: 0, explanation: 'A complete binary tree of height h has at minimum 2^h nodes (all at the last level). A full binary tree of height h has 2^(h+1) - 1 nodes.' },
    ],
    hard: [
      { id: 'tree-h1', topic: 'Trees & BST', difficulty: 'hard', question: 'What is the time complexity to find the Lowest Common Ancestor (LCA) in a BST?', options: ['O(h) where h is tree height', 'O(n)', 'O(n log n)', 'O(nÂ²)'], correctIndex: 0, explanation: 'LCA in a BST can be found in O(h) by comparing node values with both targets and navigating left or right accordingly.' },
      { id: 'tree-h2', topic: 'Trees & BST', difficulty: 'hard', question: 'A Red-Black tree with n internal nodes has height at most:', options: ['2 logâ‚‚(n + 1)', 'logâ‚‚(n)', 'n/2', 'âˆšn'], correctIndex: 0, explanation: 'A Red-Black tree guarantees height â‰¤ 2 logâ‚‚(n + 1), which is why all operations run in O(log n) time.' },
      { id: 'tree-h3', topic: 'Trees & BST', difficulty: 'hard', question: 'How many distinct BSTs can be formed with n unique nodes?', options: ['Catalan number Câ‚™', 'n!', '2â¿', 'nÂ²'], correctIndex: 0, explanation: 'The number of distinct BSTs with n nodes is the nth Catalan number: Câ‚™ = (2n)! / ((n+1)! Ã— n!). For n=3, there are 5 BSTs.' },
      { id: 'tree-h4', topic: 'Trees & BST', difficulty: 'hard', question: 'In a B-tree of order m, each internal node (except root) has at least:', options: ['âŒˆm/2âŒ‰ children', 'm children', 'âŒŠm/2âŒ‹ children', 'm - 1 children'], correctIndex: 0, explanation: 'In a B-tree of order m, every internal node (except root) has between âŒˆm/2âŒ‰ and m children, ensuring the tree stays balanced.' },
      { id: 'tree-h5', topic: 'Trees & BST', difficulty: 'hard', question: 'What is the time complexity of building a BST from a sorted array using a balanced approach?', options: ['O(n)', 'O(n log n)', 'O(nÂ²)', 'O(log n)'], correctIndex: 0, explanation: 'By recursively picking the middle element as root, we can build a balanced BST from a sorted array in O(n) time since each element is processed exactly once.' },
    ],
  },
  sorting: {
    easy: [
      { id: 'sort-e1', topic: 'Sorting Algorithms', difficulty: 'easy', question: 'Which sorting algorithm repeatedly steps through the list and swaps adjacent elements?', options: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort'], correctIndex: 0, explanation: 'Bubble Sort compares adjacent elements and swaps them if they\'re in the wrong order, "bubbling" larger elements to the end.' },
      { id: 'sort-e2', topic: 'Sorting Algorithms', difficulty: 'easy', question: 'What is the best-case time complexity of Bubble Sort?', options: ['O(n)', 'O(nÂ²)', 'O(n log n)', 'O(1)'], correctIndex: 0, explanation: 'With an optimized version that stops if no swaps occur in a pass, the best case for already-sorted data is O(n).' },
      { id: 'sort-e3', topic: 'Sorting Algorithms', difficulty: 'easy', question: 'Which sorting algorithm uses a divide-and-conquer strategy?', options: ['Merge Sort', 'Bubble Sort', 'Insertion Sort', 'Selection Sort'], correctIndex: 0, explanation: 'Merge Sort divides the array in half, recursively sorts each half, then merges them back together â€” classic divide-and-conquer.' },
      { id: 'sort-e4', topic: 'Sorting Algorithms', difficulty: 'easy', question: 'Which sorting algorithm is NOT comparison-based?', options: ['Counting Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort'], correctIndex: 0, explanation: 'Counting Sort counts occurrences of each element and doesn\'t compare elements directly. It achieves O(n + k) time where k is the range of values.' },
      { id: 'sort-e5', topic: 'Sorting Algorithms', difficulty: 'easy', question: 'Insertion Sort is most efficient when the data is:', options: ['Nearly sorted', 'Reverse sorted', 'Randomly ordered', 'All elements are equal'], correctIndex: 0, explanation: 'Insertion Sort runs in O(n + d) where d is the number of inversions. Nearly sorted data has few inversions, making it very efficient.' },
    ],
    medium: [
      { id: 'sort-m1', topic: 'Sorting Algorithms', difficulty: 'medium', question: 'What is the average time complexity of Quick Sort?', options: ['O(n log n)', 'O(nÂ²)', 'O(n)', 'O(n logÂ² n)'], correctIndex: 0, explanation: 'Quick Sort has O(n log n) average time complexity with random pivot selection, though worst case is O(nÂ²) with bad pivots.' },
      { id: 'sort-m2', topic: 'Sorting Algorithms', difficulty: 'medium', question: 'Which sorting algorithm is stable?', options: ['Merge Sort', 'Quick Sort (standard)', 'Heap Sort', 'Selection Sort'], correctIndex: 0, explanation: 'Merge Sort preserves the relative order of equal elements (stable). Quick Sort, Heap Sort, and Selection Sort are generally not stable.' },
      { id: 'sort-m3', topic: 'Sorting Algorithms', difficulty: 'medium', question: 'Heap Sort uses which data structure?', options: ['Binary Heap', 'BST', 'Hash Table', 'Trie'], correctIndex: 0, explanation: 'Heap Sort builds a max-heap (or min-heap) from the input data, then repeatedly extracts the maximum element to build the sorted output.' },
      { id: 'sort-m4', topic: 'Sorting Algorithms', difficulty: 'medium', question: 'What is the space complexity of Merge Sort?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(nÂ²)'], correctIndex: 0, explanation: 'Merge Sort requires O(n) auxiliary space for the temporary arrays used during the merge step. This is its main disadvantage compared to Quick Sort.' },
      { id: 'sort-m5', topic: 'Sorting Algorithms', difficulty: 'medium', question: 'In Quick Sort, choosing the median element as pivot guarantees:', options: ['O(n log n) worst case', 'O(n) time', 'O(1) space', 'Stable sorting'], correctIndex: 0, explanation: 'If the true median is chosen as pivot, the array is always split in half, guaranteeing O(n log n) time. However, finding the median takes O(n) time per step.' },
    ],
    hard: [
      { id: 'sort-h1', topic: 'Sorting Algorithms', difficulty: 'hard', question: 'What is the lower bound for comparison-based sorting?', options: ['Î©(n log n)', 'Î©(n)', 'Î©(nÂ²)', 'Î©(log n)'], correctIndex: 0, explanation: 'A comparison-based sort must make at least Î©(n log n) comparisons in the worst case, as proven by the decision tree model.' },
      { id: 'sort-h2', topic: 'Sorting Algorithms', difficulty: 'hard', question: 'Tim Sort (used in Python/Java) is a hybrid of:', options: ['Merge Sort + Insertion Sort', 'Quick Sort + Heap Sort', 'Bubble Sort + Merge Sort', 'Radix Sort + Merge Sort'], correctIndex: 0, explanation: 'Tim Sort divides the array into "runs," sorts small runs with Insertion Sort, then merges them using a modified Merge Sort.' },
      { id: 'sort-h3', topic: 'Sorting Algorithms', difficulty: 'hard', question: 'What is the time complexity of Radix Sort with n numbers of maximum d digits and base b?', options: ['O(d(n + b))', 'O(n log n)', 'O(nÂ²)', 'O(nd log b)'], correctIndex: 0, explanation: 'Radix Sort performs d passes, each taking O(n + b) time using counting sort as a subroutine. Total: O(d(n + b)).' },
      { id: 'sort-h4', topic: 'Sorting Algorithms', difficulty: 'hard', question: 'Which algorithm guarantees O(n) time for sorting k distinct values out of n?', options: ['Counting Sort', 'Quick Sort', 'Merge Sort', 'Bubble Sort'], correctIndex: 0, explanation: 'When k is small (constant or O(log n)), Counting Sort runs in O(n + k) = O(n) time, beating the Î©(n log n) lower bound for comparison sorts.' },
      { id: 'sort-h5', topic: 'Sorting Algorithms', difficulty: 'hard', question: 'The Dutch National Flag problem is best solved by a variant of:', options: ['Quick Sort (3-way partition)', 'Merge Sort', 'Heap Sort', 'Insertion Sort'], correctIndex: 0, explanation: 'Dijkstra\'s 3-way partitioning (used in 3-way Quick Sort) divides the array into three regions: less than, equal to, and greater than the pivot.' },
    ],
  },
}

// Fill in default questions for topics without specific questions
const getDefaultQuestions = (topicId: string, diff: Difficulty): QuizQuestion[] => {
  const topic = TOPICS.find((t) => t.id === topicId)
  const title = topic?.title || topicId
  return [
    { id: `${topicId}-${diff}-d1`, topic: title, difficulty: diff, question: `Which concept is fundamental to understanding ${title}?`, options: ['Core data organization principles', 'Network protocols', 'Database management', 'Machine learning'], correctIndex: 0, explanation: `Understanding core data organization principles is fundamental to ${title}.` },
    { id: `${topicId}-${diff}-d2`, topic: title, difficulty: diff, question: `What is a common use case for ${title}?`, options: ['Efficient data processing', 'Graphic rendering', 'Audio compression', 'Video encoding'], correctIndex: 0, explanation: `${title} is commonly used for efficient data processing in various applications.` },
    { id: `${topicId}-${diff}-d3`, topic: title, difficulty: diff, question: `Which time complexity is typical for operations in ${title}?`, options: ['O(log n) or O(n)', 'O(nÂ²) always', 'O(2^n)', 'O(1) always'], correctIndex: 0, explanation: `Operations in ${title} typically have O(log n) to O(n) time complexity depending on the specific operation.` },
    { id: `${topicId}-${diff}-d4`, topic: title, difficulty: diff, question: `What is the main advantage of ${title} over brute force?`, options: ['Significant performance improvement', 'Simpler implementation', 'Less memory usage always', 'Better error handling'], correctIndex: 0, explanation: `The main advantage of ${title} over brute force approaches is a significant performance improvement.` },
    { id: `${topicId}-${diff}-d5`, topic: title, difficulty: diff, question: `When implementing ${title}, which consideration is most important?`, options: ['Trade-offs between time and space', 'Color of the output', 'Font size', 'Number of comments'], correctIndex: 0, explanation: `When implementing ${title}, balancing time and space complexity trade-offs is the most important consideration.` },
  ]
}

const getQuestions = (topicId: string, diff: Difficulty): QuizQuestion[] => {
  return QUESTIONS_BY_TOPIC[topicId]?.[diff] || getDefaultQuestions(topicId, diff)
}

const chartConfig = {
  score: {
    label: 'Score %',
    color: 'oklch(0.7 0.15 145)',
  },
}

// Confetti particles for high score celebration
function ConfettiEffect() {
  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (i / 18) * 360,
      distance: 60 + Math.random() * 40,
      size: 4 + Math.random() * 4,
      delay: Math.random() * 0.3,
      duration: 1.5 + Math.random() * 1,
      color: [
        'oklch(0.7 0.18 145)',
        'oklch(0.75 0.15 80)',
        'oklch(0.7 0.15 40)',
        'oklch(0.65 0.2 25)',
      ][i % 4],
    }))
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            top: '50%',
            left: '50%',
            transformOrigin: '0 0',
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance - 20,
            scale: [0, 1.2, 1, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function QuizGenerator() {
  // State
  const [step, setStep] = useState<QuizStep>('selection')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const [answerFeedback, setAnswerFeedback] = useState<{ index: number; correct: boolean } | null>(null)
  const [customTopic, setCustomTopic] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Auto-select topic from dashboard insight click
  useEffect(() => {
    const store = useAppStore.getState()
    const { preselectedQuizTopic, preselectedQuizTopicTitle, setPreselectedQuizTopic, setPreselectedQuizTopicTitle } = store
    if (preselectedQuizTopic) {
      setSelectedTopics([preselectedQuizTopic])
      if (preselectedQuizTopicTitle) setCustomTopic(preselectedQuizTopicTitle)
      setPreselectedQuizTopic(null)
      setPreselectedQuizTopicTitle(null)
    }
  }, [])

  const [historyAttempts, setHistoryAttempts] = useState<any[]>([])
  const [viewingAttempt, setViewingAttempt] = useState<any | null>(null)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showFullTrajectory, setShowFullTrajectory] = useState(false)
  const [error, setError] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const timeUpRef = useRef(false)
  const authUser = useAuthStore((s) => s.user)

  // ── Fetch Quiz History ───────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    if (!authUser?.id) return
    try {
      const res = await fetch(`/api/quiz/history?student_id=${authUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setHistoryAttempts(data.attempts || [])
      }
    } catch { /* ignore */ }
  }, [authUser?.id])

  // ── AI Quiz Generation ───────────────────────────────────────────────────

  const generateQuizWithAI = useCallback(async () => {
    setGenerating(true)
    setError('')
    setQuizId(null)
    setStep('loading')
    const startTime = Date.now()
    const allTopics = [...selectedTopics]
    if (customTopic.trim()) allTopics.push(customTopic.trim())
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: allTopics, difficulty, num_questions: questionCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz')
      setUsedFallback(data.usedFallback || false)
      if (data.quiz_id) setQuizId(data.quiz_id)
      const mapped = data.questions.map((q: any) => ({
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
      }))
      setQuestions(mapped)
      setAnswers(new Array(mapped.length).fill(null))
      setCurrentIndex(0)
      setAnswerFeedback(null)
      const timePerQuestion = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 60
      setTimeLeft(timePerQuestion * mapped.length)
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 3000 - elapsed)
      setTimeout(() => setStep('active'), remaining)
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI. Please try again.')
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 3000 - elapsed)
      setTimeout(() => setStep('selection'), remaining)
    } finally {
      setGenerating(false)
    }
  }, [selectedTopics, difficulty, questionCount, customTopic])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmitQuiz = useCallback(() => {
    if (timeUpRef.current) return
    timeUpRef.current = true
    const quizResults: QuizResult[] = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: answers[i],
      isCorrect: answers[i] === q.correctIndex,
      topic: q.topic,
      question: q.question,
      userAnswer: answers[i] !== null ? q.options[answers[i]!] : null,
      correctAnswer: q.options[q.correctIndex],
      explanation: q.explanation,
    }))
    setResults(quizResults)
    setStep('results')

    // Save attempt to DB
    if (quizId && authUser?.id) {
      const keyMap = ['A', 'B', 'C', 'D']
      const answersPayload: Record<string, string> = {}
      questions.forEach((q, i) => {
        answersPayload[q.id] = answers[i] !== null ? keyMap[answers[i]!] : ''
      })
      fetch('/api/quiz/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: answersPayload,
          student_id: authUser.id,
          time_spent: 0,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.attempt_id) setAttemptId(data.attempt_id)
          fetchHistory()
          // Award XP for completing a quiz
          fetch('/api/gamification/award-xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: authUser.id, amount: 2000 }),
          })
            .then(() => window.dispatchEvent(new Event('xp-updated')))
            .catch(() => {})
        })
        .catch(() => {})
    }
  }, [questions, answers, quizId, authUser?.id, fetchHistory])

  // ── Fetch history on mount ───────────────────────────────────────────────

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    timeUpRef.current = false
    if (step !== 'active' || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, timeLeft, handleSubmitQuiz])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    )
  }

  const handleGenerateQuiz = useCallback(() => {
    generateQuizWithAI()
  }, [generateQuizWithAI])

  const handleSelectAnswer = (optionIndex: number) => {
    if (answers[currentIndex] !== null) return // Already answered
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionIndex
    setAnswers(newAnswers)

    // Show brief feedback flash
    const q = questions[currentIndex]
    setAnswerFeedback({ index: currentIndex, correct: optionIndex === q.correctIndex })
    setTimeout(() => setAnswerFeedback(null), 600)
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      handleSubmitQuiz()
    }
  }

  const handleReviewMistakes = useCallback(() => {
    const store = useAppStore.getState()
    const mappedQuestions = questions.map((q, idx) => ({
      id: idx + 1,
      text: q.question,
      options: q.options,
      studentAnswer: answers[idx] !== null ? q.options[answers[idx]!] : 'Unanswered',
      correctAnswer: q.options[q.correctIndex],
      isCorrect: answers[idx] === q.correctIndex,
      mistakeType: undefined as string | undefined,
    }))
    const correctCount = mappedQuestions.filter((q) => q.isCorrect).length
    store.setReviewAttemptData({
      id: attemptId || 'current',
      label: `Quiz — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      date: new Date().toISOString().split('T')[0],
      score: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
      totalQuestions: questions.length,
      questions: mappedQuestions,
    })
    store.setActivePage('explain-mistake')
  }, [questions, answers, attemptId])

  const viewHistoryAttempt = useCallback((att: any) => {
    const optKeys = ['A', 'B', 'C', 'D']
    const questions = (att.answers || []).map((ans: any, idx: number) => {
      const opts = [ans.question.optionA, ans.question.optionB, ans.question.optionC, ans.question.optionD]
      return {
        id: idx + 1,
        text: ans.question.question,
        options: opts,
        studentAnswer: ans.selectedKey ? opts[optKeys.indexOf(ans.selectedKey)] : 'Unanswered',
        correctAnswer: opts[optKeys.indexOf(ans.question.correctKey)],
        isCorrect: ans.isCorrect,
        mistakeType: undefined as string | undefined,
      }
    })
    const store = useAppStore.getState()
    store.setReviewAttemptData({
      id: att.id,
      label: att.quiz?.title || 'Quiz Attempt',
      date: new Date(att.completedAt || att.createdAt).toLocaleDateString(),
      score: att.totalQuestions > 0 ? Math.round((att.correctCount / att.totalQuestions) * 100) : 0,
      totalQuestions: att.totalQuestions,
      questions,
    })
    store.setActivePage('explain-mistake')
  }, [])

  const handleRetake = () => {
    setStep('selection')
    setResults([])
    setCurrentIndex(0)
    setAnswers([])
    setAnswerFeedback(null)
    setError('')
    setCustomTopic('')
    setQuizId(null)
    setViewingAttempt(null)
    setAttemptId(null)
    setUsedFallback(false)
    setShowAllHistory(false)
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const correctCount = results.filter((r) => r.isCorrect).length
  const incorrectCount = results.filter((r) => r.selectedIndex !== null && !r.isCorrect).length
  const unansweredCount = results.filter((r) => r.selectedIndex === null).length
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0

  // Score history from real data + current attempt
  const scoreHistory = useMemo(() => {
    const past = historyAttempts.map((a, i) => ({
      quiz: `#${historyAttempts.length - i}`,
      score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
    })).reverse()
    if (step === 'results') return [...past, { quiz: 'Now', score: scorePercent }]
    return past
  }, [historyAttempts, step, scorePercent])

  // Weak areas: topics with any wrong answers
  const weakAreas = results
    .filter((r) => !r.isCorrect)
    .reduce<Record<string, { topic: string; wrong: number }>>((acc, r) => {
      if (!acc[r.topic]) acc[r.topic] = { topic: r.topic, wrong: 0 }
      acc[r.topic].wrong++
      return acc
    }, {})

  const weakAreaList = Object.values(weakAreas).sort((a, b) => b.wrong - a.wrong)

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ── Step 1: Topic Selection ──────────────────────────────────────────────

  const renderSelectionStep = () => (
    <motion.div
      key="selection"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="mx-auto max-w-6xl space-y-6 p-4 md:p-8"
    >
      {/* Header */}
      <div className="py-8 mb-8 text-center">
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Brain className="size-7 text-primary" />
        </div>
        <h1 className="mb-3 text-2xl font-bold">AI Quiz Generator</h1>
        <p className="text-muted-foreground">
          Select topics, choose difficulty, and test your knowledge
        </p>
      </div>

      {/* Dual-column dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column (Span 7) - Quiz Configuration */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-6 sm:p-7 space-y-8">
          {/* Select Topics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-5 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground">Select Topics</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedTopics.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TOPICS.map((topic, index) => {
                const isSelected = selectedTopics.includes(topic.id)
                return (
                  <motion.label
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]'
                        : 'border-slate-200/60 dark:border-border/50 hover:border-slate-300 dark:hover:border-border bg-white/40 dark:bg-background/20'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTopic(topic.id)}
                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className="text-base">{topic.icon}</span>
                    <span className="text-xs font-medium">{topic.title}</span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500"
                        >
                          <Check className="size-2.5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.label>
                )
              })}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground">Or Type Your Own Topic</h3>
            </div>
            <div className="relative">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Machine Learning, World History..."
                className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 dark:bg-background/40 dark:border-border/50 dark:text-foreground dark:placeholder-muted-foreground rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
              {customTopic && (
                <button
                  onClick={() => setCustomTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-foreground/80"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Difficulty & Number of Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Difficulty */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="size-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">Difficulty Level</h3>
              </div>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                  const isActive = difficulty === d
                  return (
                    <button
                      key={d}
                      className={`flex-1 capitalize text-xs font-medium py-2 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 dark:bg-card/10 dark:border-border/50 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/20'
                      }`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="size-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">Number of Questions</h3>
              </div>
              <div className="px-1 pt-2 pb-1">
                <Slider
                  value={[questionCount]}
                  onValueChange={([v]) => setQuestionCount(v)}
                  min={3}
                  max={10}
                  step={1}
                  className="data-[state=active]:bg-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-muted-foreground/70 mt-2">
                  <span>3</span>
                  <span className="font-medium text-slate-700 dark:text-foreground/80">{questionCount} questions</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200/80 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-400 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Primary Launch Action */}
          <div className="flex items-center gap-3 pt-4">
            <button
              disabled={(selectedTopics.length === 0 && !customTopic.trim()) || generating}
              onClick={handleGenerateQuiz}
               className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="size-4" />
              Generate Quiz with AI
              <ChevronRight className="size-4" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
              <Sparkles className="size-3.5" />
              +2,000 XP
            </div>
          </div>
        </div>

        {/* Right Column (Span 5) - Analytics & History Deck */}
        <div className="lg:col-span-5 space-y-8">
          {/* Card A: Improvement Trajectory */}
          {historyAttempts.length > 1 ? (
            <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-foreground">Improvement Trajectory</h3>
                </div>
                <button
                  onClick={() => setShowFullTrajectory(true)}
                  className="flex size-7 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              </div>
              <ChartContainer config={chartConfig} className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyAttempts.map((a: any, i: number) => ({
                    quiz: `#${i + 1}`,
                    score: Math.round(a.score),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-border" />
                    <XAxis dataKey="quiz" tick={{ fontSize: 11 }} className="fill-slate-400 dark:fill-muted-foreground/60" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-slate-400 dark:fill-muted-foreground/60" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-score)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-muted-foreground/70">
                <span>Latest:</span>
                <Badge
                  variant={
                    Math.round(historyAttempts[historyAttempts.length - 1].score) >= 80
                      ? 'default'
                      : Math.round(historyAttempts[historyAttempts.length - 1].score) >= 60
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-[11px] px-2 py-0.5"
                >
                  {Math.round(historyAttempts[historyAttempts.length - 1].score)}%
                </Badge>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-6 sm:p-7">
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-muted-foreground/70">
                <Trophy className="size-8 mb-2 opacity-40" />
                <p className="text-xs">Complete a quiz to see your improvement trajectory here</p>
              </div>
            </div>
          )}

          {/* Card B: Recent Quizzes */}
          {historyAttempts.length > 0 && (
            <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-foreground">Recent Quizzes</h3>
                </div>
                {historyAttempts.length > 3 && (
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    {showAllHistory ? 'Show Less' : `See More (${historyAttempts.length})`}
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-border space-y-2">
                {(showAllHistory ? historyAttempts : historyAttempts.slice(0, 3)).map((att: any) => (
                  <button
                    key={att.id}
                    onClick={() => viewHistoryAttempt(att)}
                     className="flex w-full items-center justify-between rounded-xl border border-slate-200/60 dark:border-border/50 p-3 text-left text-xs hover:bg-white/40 dark:hover:bg-background/30 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-700 dark:text-foreground/80 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {att.quiz?.title || 'Quiz'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-muted-foreground/70 mt-0.5">
                        {new Date(att.completedAt).toLocaleDateString()} &middot; {att.totalQuestions} questions
                      </p>
                    </div>
                    <Badge
                      className={
                        att.score >= 80
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[11px]'
                          : att.score >= 60
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[11px]'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400 border-0 text-[11px]'
                      }
                    >
                      {Math.round(att.score)}%
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
  // ── Step 2: Active Quiz ──────────────────────────────────────────────────

  const renderActiveQuizStep = () => {
    const q = questions[currentIndex]
    const isLast = currentIndex === questions.length - 1
    const isAnswered = answers[currentIndex] !== null
    const progressPercent = ((currentIndex + 1) / questions.length) * 100

    const optionLabels = ['A', 'B', 'C', 'D']

    return (
      <motion.div
        key="active"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="mx-auto flex max-w-2xl flex-col p-4 md:p-8"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleRetake}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {difficulty}
            </Badge>
            {/* Timer with pulsing red border when < 30s */}
            <motion.div
              animate={timeLeft < 30 && step === 'active' ? {
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                  '0 0 0 4px rgba(239, 68, 68, 0.3)',
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                ],
              } : {}}
              transition={timeLeft < 30 ? {
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              } : {}}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground"
            >
              <Clock className="size-4" />
              <span className={`font-mono tabular-nums ${timeLeft < 30 ? 'text-red-500 font-bold' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {currentIndex + 1}
                  </span>
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {q.topic}
                    </Badge>
                    <CardTitle className="text-base leading-relaxed">
                      {q.question}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {q.options.map((option, optIdx) => {
                    const isSelected = answers[currentIndex] === optIdx
                    const isFeedbackShowing = answerFeedback?.index === currentIndex
                    const isCorrectOption = q.correctIndex === optIdx
                    const isWrongSelection = isSelected && !isCorrectOption && isFeedbackShowing

                    return (
                      <motion.button
                        key={optIdx}
                        whileHover={!isAnswered ? { scale: 1.01 } : {}}
                        whileTap={!isAnswered ? { scale: 0.99 } : {}}
                        onClick={() => handleSelectAnswer(optIdx)}
                        className={`relative flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all overflow-hidden ${
                          isFeedbackShowing && isCorrectOption
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-foreground font-medium'
                            : isWrongSelection
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-foreground'
                              : isSelected
                                ? 'border-primary bg-primary/10 text-foreground font-medium'
                                : 'hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        {/* Feedback flash overlay */}
                        <AnimatePresence>
                          {isFeedbackShowing && (isCorrectOption || isWrongSelection) && (
                            <motion.div
                              initial={{ opacity: 0.3 }}
                              animate={{ opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.6 }}
                              className={`absolute inset-0 ${
                                isCorrectOption
                                  ? 'bg-emerald-400/30'
                                  : 'bg-red-400/30'
                              }`}
                            />
                          )}
                        </AnimatePresence>
                        <span
                          className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isFeedbackShowing && isCorrectOption
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : isWrongSelection
                                ? 'border-red-500 bg-red-500 text-white'
                                : isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border text-muted-foreground'
                          }`}
                        >
                          {optionLabels[optIdx]}
                        </span>
                        <span className="relative z-10 flex-1">{option}</span>
                        {isFeedbackShowing && isCorrectOption && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative z-10"
                          >
                            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                          </motion.div>
                        )}
                        {isFeedbackShowing && isWrongSelection && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative z-10"
                          >
                            <XCircle className="size-5 text-red-500 shrink-0" />
                          </motion.div>
                        )}
                        {!isFeedbackShowing && isSelected && (
                          <CheckCircle2 className="relative z-10 size-5 text-primary shrink-0" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-auto pt-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!isAnswered}
            onClick={handleNextQuestion}
          >
            {isLast ? 'Submit Quiz' : 'Next Question'}
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Question Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => idx <= currentIndex && setCurrentIndex(idx)}
              className={`size-2.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-primary scale-125'
                  : answers[idx] !== null
                    ? 'bg-primary/50'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>
      </motion.div>
    )
  }

  // ── Step 3: Results ──────────────────────────────────────────────────────

  const RING_CIRCUMFERENCE = 301.592

  const renderResultsStep = () => (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mx-auto max-w-3xl space-y-6 p-4 md:p-8"
    >
      {/* Score Display */}
      <Card className="text-center bg-white border border-slate-200/60 dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 shadow-sm">
        <CardContent className="relative pt-8 pb-8 overflow-visible">
          {/* Confetti effect for high scores */}
          {scorePercent >= 80 && <ConfettiEffect />}

          {/* Radial Progress Ring */}
          <div className="mx-auto mb-4 relative flex size-32 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" fill="none">
              <circle
                cx="60" cy="60" r="48"
                strokeWidth="8"
                className="stroke-slate-100 dark:stroke-border"
              />
              <motion.circle
                cx="60" cy="60" r="48"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-rose-400 dark:stroke-rose-500/80"
                strokeDasharray={`${(scorePercent / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                initial={{ strokeDasharray: `0 ${RING_CIRCUMFERENCE}` }}
                animate={{ strokeDasharray: `${(scorePercent / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {scorePercent}%
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy
              className={`size-6 ${
                scorePercent >= 80
                  ? 'text-emerald-600'
                  : scorePercent >= 60
                    ? 'text-amber-600'
                    : 'text-red-500'
              }`}
            />
            <h2 className="text-xl font-bold">
              {scorePercent >= 80
                ? 'Excellent Work!'
                : scorePercent >= 60
                  ? 'Good Effort!'
                  : 'Keep Practicing!'}
            </h2>
          </div>
          <p className="text-muted-foreground">
            You answered {correctCount} out of {results.length} questions correctly
          </p>
        </CardContent>
      </Card>

      {/* AI Fallback Warning */}
      {usedFallback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
          <strong>AI generation unavailable.</strong> GROQ API rate limit hit. Used template questions instead. The AI mistake review will still work once you submit. Try again later or get a new API key at https://console.groq.com
        </div>
      )}

      {/* Accuracy Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-100 dark:bg-card/10 dark:border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center pt-6 pb-6">
            <CheckCircle2 className="mb-2 size-8 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-600">{correctCount}</span>
            <span className="text-sm text-muted-foreground">Correct</span>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-100 dark:bg-card/10 dark:border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center pt-6 pb-6">
            <XCircle className="mb-2 size-8 text-red-500" />
            <span className="text-2xl font-bold text-red-500">{incorrectCount}</span>
            <span className="text-sm text-muted-foreground">Incorrect</span>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-100 dark:bg-card/10 dark:border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center pt-6 pb-6">
            <AlertTriangle className="mb-2 size-8 text-amber-500" />
            <span className="text-2xl font-bold text-amber-500">{unansweredCount}</span>
            <span className="text-sm text-muted-foreground">Unanswered</span>
          </CardContent>
        </Card>
      </div>

      {/* Weak Areas */}
      {weakAreaList.length > 0 && (
        <Card className="bg-white border border-slate-200/60 dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-amber-500" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {weakAreaList.map((area) => (
                <div
                  key={area.topic}
                  className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"
                >
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                    {area.wrong} wrong
                  </Badge>
                  <span className="text-sm font-medium">{area.topic}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score History - Mini Bar Chart */}
      <Card className="bg-white border border-slate-200/60 dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-5 text-primary" />
            Score History
          </CardTitle>
          <CardDescription>Your quiz scores over the last {scoreHistory.length} attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreHistory} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-border" vertical={false} />
                <XAxis
                  dataKey="quiz"
                  tick={{ fontSize: 12 }}
                  className="fill-slate-400 dark:fill-muted-foreground/60"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-slate-400 dark:fill-muted-foreground/60"
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {scoreHistory.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        entry.score >= 80
                          ? 'oklch(0.6 0.18 145)'
                          : entry.score >= 60
                            ? 'oklch(0.68 0.17 80)'
                            : 'oklch(0.65 0.18 15)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* XP Reward Notice */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 px-4 py-3 text-sm pt-4 mt-2"
      >
        <Sparkles className="size-4 text-amber-500" />
        <span className="text-muted-foreground">
          You earned <strong className="text-amber-600 dark:text-amber-400">+2,000 XP</strong> for completing this quiz
        </span>
        <Sparkles className="size-4 text-amber-500" />
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={handleRetake} className="gap-2">
          <BookOpen className="size-4" />
          Back to Topics
        </Button>
        <Button
          variant="outline"
          onClick={handleReviewMistakes}
          className="gap-2"
        >
          <Brain className="size-4" />
          Review Mistakes
        </Button>
        <Button
          onClick={handleRetake}
          className="gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white dark:from-white dark:to-slate-100 dark:text-slate-900 font-medium transition-all shadow-md px-5 rounded-xl border-0"
        >
          <RotateCcw className="size-4" />
          Retake Quiz
        </Button>
      </div>
    </motion.div>
  )

  // ── Step 3.5: Loading ───────────────────────────────────────────────────

  const renderLoadingStep = () => {
    const allTopics = [...selectedTopics]
    if (customTopic.trim()) allTopics.push(customTopic.trim())

    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mx-auto flex max-w-lg flex-col items-center justify-center p-4 md:p-8 min-h-[60vh]"
      >
        {/* Animated Brain */}
        <motion.div
          className="relative mb-8"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Brain className="size-12 text-primary" />
            </motion.div>
          </div>
          {/* Orbiting dots */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 size-2 rounded-full"
              style={{
                background: i % 2 === 0 ? 'oklch(0.7 0.15 145)' : 'oklch(0.7 0.15 265)',
              }}
              animate={{
                x: [0, Math.cos((angle * Math.PI) / 180) * 50, 0],
                y: [0, Math.sin((angle * Math.PI) / 180) * 50, 0],
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + i * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold">Generating Your Quiz</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          AI is crafting questions about{' '}
          <span className="font-medium text-foreground">
            {allTopics.join(', ')}
          </span>
        </p>

        {/* Animated Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />
        </div>

        {/* Status messages cycling */}
        <div className="mt-6 h-6">
          <motion.p
            key={generating ? 'thinking' : 'done'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-muted-foreground"
          >
            {generating
              ? 'Analyzing topics, generating questions, verifying answers...'
              : 'Quiz ready!'}
          </motion.p>
        </div>
      </motion.div>
    )
  }

  // ── Step 4: History ──────────────────────────────────────────────────────

  const renderHistoryStep = () => {
    if (viewingAttempt) {
      const att = viewingAttempt
      const correctCount = att.answers?.filter((a: any) => a.isCorrect).length || 0
      const score = att.totalQuestions > 0 ? Math.round((correctCount / att.totalQuestions) * 100) : 0

      return (
        <motion.div
          key="history-review"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mx-auto max-w-3xl space-y-6 p-4 md:p-8"
        >
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setViewingAttempt(null)}>
              <ArrowLeft className="size-4 mr-1" /> Back to History
            </Button>
            <Badge className={score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}>
              {score}%
            </Badge>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">{att.quiz?.title || 'Quiz Review'}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(att.completedAt).toLocaleDateString()} &middot; {att.totalQuestions} questions &middot; {correctCount} correct
            </p>
          </div>

          <div className="space-y-4">
            {att.answers?.map((ans: any) => {
              const q = ans.question
              const optLabels = ['A', 'B', 'C', 'D']
              const options = [q.optionA, q.optionB, q.optionC, q.optionD]
              const correctIdx = optLabels.indexOf(q.correctKey)
              const selectedIdx = optLabels.indexOf(ans.selectedKey)
              const isCorrect = ans.isCorrect

              return (
                <Card key={ans.id} className={isCorrect ? 'border-emerald-200 dark:border-emerald-900' : 'border-red-200 dark:border-red-900'}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2 mb-3">
                      {isCorrect ? (
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-medium">{q.question}</p>
                    </div>
                    <div className="ml-7 space-y-1.5">
                      {options.map((opt, oi) => {
                        const isUserAns = oi === selectedIdx
                        const isRightAns = oi === correctIdx
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                              isRightAns
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : isUserAns && !isCorrect
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                  : ''
                            }`}
                          >
                            <span className="w-5 shrink-0 font-mono text-xs">{optLabels[oi]}.</span>
                            <span>{opt}</span>
                            {isRightAns && <Check className="size-3.5 shrink-0 ml-auto" />}
                            {isUserAns && !isRightAns && <XCircle className="size-3.5 shrink-0 ml-auto" />}
                          </div>
                        )
                      })}
                      {q.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground italic">{q.explanation}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="history"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="mx-auto max-w-3xl space-y-6 p-4 md:p-8"
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep('selection')}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">Quiz History</h1>
          <div />
        </div>

        {historyAttempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="mx-auto size-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No quizzes attempted yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setStep('selection')}>
                Take Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          historyAttempts.map((att: any) => {
            const score = att.score || 0
            const correctCount = att.correctCount || 0
            return (
              <Card key={att.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => viewHistoryAttempt(att)}>
                <CardContent className="flex items-center gap-4 pt-4 pb-4">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  >
                    {score}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{att.quiz?.title || 'Quiz'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(att.completedAt).toLocaleDateString()} &middot; {correctCount}/{att.totalQuestions} correct
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            )
          })
        )}
      </motion.div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="h-full overflow-y-auto bg-slate-50/50 dark:bg-transparent">
        <AnimatePresence mode="wait">
          {step === 'selection' && renderSelectionStep()}
          {step === 'loading' && renderLoadingStep()}
          {step === 'active' && renderActiveQuizStep()}
          {step === 'results' && renderResultsStep()}
          {step === 'history' && renderHistoryStep()}
        </AnimatePresence>
      </div>

      {/* Fullscreen Trajectory Modal - at root level */}
      <AnimatePresence>
        {showFullTrajectory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowFullTrajectory(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-3xl rounded-xl border bg-background p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-primary" />
                  <h2 className="text-lg font-bold">Improvement Trajectory</h2>
                </div>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowFullTrajectory(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyAttempts.map((a: any, i: number) => ({
                    quiz: `#${i + 1}`,
                    score: Math.round(a.score),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="quiz" tick={{ fontSize: 13 }} className="fill-muted-foreground" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} className="fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={3} dot={{ r: 6, fill: 'var(--color-score)' }} activeDot={{ r: 9 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <span>Latest score:</span>
                <Badge
                  variant={
                    Math.round(historyAttempts[historyAttempts.length - 1].score) >= 80
                      ? 'default'
                      : Math.round(historyAttempts[historyAttempts.length - 1].score) >= 60
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-sm px-3 py-1"
                >
                  {Math.round(historyAttempts[historyAttempts.length - 1].score)}%
                </Badge>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
