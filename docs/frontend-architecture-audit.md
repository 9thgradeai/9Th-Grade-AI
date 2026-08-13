# Frontend Architecture Audit - BCS Question Bank Engine

**Audit Date:** 2026-08-13

This document consolidates the frontend architecture analysis for planning the questions generation database integration.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Question/Practice/Test Components](#2-questionpracticetest-components)
3. [Data Fetching](#3-data-fetching)
4. [Pages/Routes](#4-pagesroutes)
5. [State Management](#5-state-management)
6. [TypeScript Types](#6-typescript-types)
7. [Subject/Topic/Exam Navigation](#7-subjecttopicexam-navigation)
8. [UI Component Library](#8-ui-component-library)
9. [Dashboard Components](#9-dashboard-components)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Key Patterns](#11-key-patterns)
12. [Database Integration Requirements](#12-database-integration-requirements)

---

## 1. Project Overview

The frontend is a **Vite + React + TypeScript** application using:
- **Build Tool**: Vite with React plugin and Tailwind CSS v4
- **Routing**: React Router v6 (client-side routing)
- **State Management**: React Context + custom hooks (`useAsync`, `useSubmit`)
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: Framer Motion

**Key Files:**
- `/src/App.tsx` - Route configuration and lazy loading
- `/src/lib/api.ts` - Service layer for API calls
- `/src/lib/client.ts` - HTTP client wrapper
- `/src/lib/types.ts` - TypeScript domain types

---

## 2. Question/Practice/Test Components

### Core Exam Components

| File | Purpose |
|------|---------|
| `/src/components/exam/QuestionRunner.tsx` | Main question display and answering interface. Handles navigation, flagging, timing, and submission |
| `/src/pages/Practice.tsx` | Practice session configuration (topic, count, timed mode, adaptive mode) |
| `/src/pages/MockTest.tsx` | Mock test interface with pre-start screen and timed execution |
| `/src/pages/MockTests.tsx` | List of available mock tests |
| `/src/pages/Results.tsx` | Test result display with scoring breakdown, AI diagnosis, and next-best-action |

### QuestionRunner Component Details

**Location:** `/src/components/exam/QuestionRunner.tsx`

**Props Interface:**
```typescript
interface Props {
  questions: Question[]
  timed?: boolean
  durationSeconds?: number
  onSubmit: (attempts: QuestionAttempt[]) => void
  immersive?: boolean
}
```

**Internal State:**
```typescript
const [index, setIndex] = useState(0)
const [selections, setSelections] = useState<(number | null)[]>(() => questions.map(() => null))
const [flagged, setFlagged] = useState<Set<number>>(() => new Set())
const [timeLeft, setTimeLeft] = useState(durationSeconds)
const [timePerQ, setTimePerQ] = useState<number[]>(() => questions.map(() => 0))
const [done, setDone] = useState(false)
```

**Features:**
- Question navigation (previous/next)
- Option selection with visual feedback
- Flagging questions for review
- Timer with warning states (<60s shows red)
- Progress bar showing answered questions
- Animated question transitions (Framer Motion `AnimatePresence`)
- Correct/incorrect answer reveal after submission
- Auto-submit on timer expiry

**UI Elements:**
- Progress dots (clickable to jump to any question)
- Timer display (top-right)
- Question card with difficulty badge
- Flag button
- Option buttons with selection states

---

## 3. Data Fetching

### API Client (`/src/lib/client.ts`)

**Base URL Configuration:**
```typescript
const configuredApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')
export const API_BASE: string =
  configuredApi || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')
```

**Features:**
- Request deduplication (in-flight request merging)
- Token management (Bearer header + HttpOnly cookie fallback)
- Automatic token refresh on 401 (`refreshSession()`)
- Retry with exponential backoff for GET requests (2 retries)
- Structured `ApiError` with status, code, requestId
- Sentry error capture for 5xx errors and network failures

**Error Types:**
```typescript
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly requestId?: string
}

// Special error codes
export function isFeatureLocked(e: unknown): boolean
export function isNetworkError(e: unknown): boolean
```

### Service Layer (`/src/lib/api.ts`)

**Memoization Pattern:**
```typescript
const inflight = new Map<string, Promise<unknown>>()
const valueCache = new Map<string, { value: unknown; expiresAt: number }>()

function memo<T>(key: string, real: () => Promise<T>, fallback: () => Promise<T>, ttlMs?: number): Promise<T>
```

**Fallback Strategy:**
- Tries real API first
- Falls back to mock data in DEV mode only
- Production throws errors (no silent mock fallback)
- Paywall errors (`FEATURE_LOCKED`) are never caught by fallback

**TTL Constants:**
```typescript
const TTL_CATALOG = 5 * 60_000  // 5 minutes for exams/subjects/topics
const TTL_QUESTIONS = 2 * 60_000  // 2 minutes for questions
```

**API Methods:**

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getUser()` | `/users/me` | `User` |
| `listExams()` | `/exams` | `Exam[]` |
| `getExam(slug)` | `/exams/:slug` | `Exam` |
| `listSubjects(examId?)` | `/exams/subjects` | `Subject[]` |
| `getSubject(id)` | `/exams/subjects/:id` | `Subject` |
| `listTopics(subjectId)` | `/exams/topics?subjectId=...` | `Topic[]` |
| `getTopic(id)` | `/exams/topics/:id` | `Topic` |
| `listQuestions(topicId, count)` | `/questions/:topicId?limit=...` | `Question[]` |
| `getPerformance()` | `/performance` | `Performance` |
| `getRoadmap()` | `/strategy` | `Roadmap` |
| `getDailyTasks()` | `/dashboard/daily-tasks` | `DailyTask[]` |
| `getRevisionItems()` | `/revision/items` | `RevisionItem[]` |
| `getAIBriefing()` | `/ai/briefing` | `AIBriefing` |
| `getAIRecommendations()` | `/ai/recommendations` | `AIRecommendation[]` |
| `buildTest(...)` | (client-side only currently) | `Test` |

**Data Transformation:**
Raw API responses are transformed via `toExam()`, `toSubject()`, `toTopic()`, `toQuestion()` etc.

### Custom Data Hooks

**useAsync (`/src/lib/useAsync.ts`):**
```typescript
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: boolean
  errorObject: unknown | null
  reload: () => void
}

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []): AsyncState<T>
```

**useSubmit (`/src/lib/useSubmit.ts`):**
```typescript
export function useSubmit<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<unknown>,
): {
  run: (...args: TArgs) => Promise<boolean>
  inFlight: boolean
  error: Error | null
  clearError: () => void
}
```
Guards against double-submission with `busyRef`.

---

## 4. Pages/Routes

### Route Structure (`/src/App.tsx`)

```typescript
// Public routes (with Navbar + Footer)
/                    → Landing
/how-it-works       → HowItWorks
/exams              → Exams
/exams/:slug        → ExamDetail
/ai-engine          → AIEngine
/pricing            → Pricing
/about              → About

// Auth routes (immersive, no chrome)
/login               → Login
/register            → Register
/forgot-password     → ForgotPassword
/reset-password      → ResetPassword
/verify-email        → VerifyEmail
/onboarding          → Onboarding

// Protected routes (AppShell wrapper, ProtectedRoute gate)
/dashboard           → Dashboard
/subjects/:id        → Subject
/topics/:id          → Topic
/practice            → Practice
/mock-tests          → MockTests
/mock-tests/:id      → MockTest
/results/:id         → Results
/strategy            → Strategy
/memory              → Memory
/progress            → Progress
/rank                → Rank
/profile             → Profile
/settings            → Settings
/notices             → ComingSoon
/career              → ComingSoon
/written-viva        → ComingSoon
```

### Key Pages for Questions/Tests

**Practice Page (`/src/pages/Practice.tsx`):**
- Topic selection from dropdown
- Question count selection (3, 5, 10, 15)
- Timed mode toggle
- Adaptive mode toggle (preview)
- Uses `useSubmit` for session start
- Passes questions to `QuestionRunner`

**MockTest Page (`/src/pages/MockTest.tsx`):**
- Pre-start screen with test metadata
- Loads questions via `api.listQuestions('__mock__', 10)`
- Uses `QuestionRunner` with `immersive` and `timed` props
- Computes result on finish and navigates to Results

**Results Page (`/src/pages/Results.tsx`):**
- Displays score, accuracy, speed, retention
- BPSC negative marking breakdown (`scoreAttempts`)
- Per-subject mark loss visualization
- AI diagnosis card
- Next best action with targeted practice link
- Save to Memory functionality

**Subject Page (`/src/pages/Subject.tsx`):**
- Subject metrics (mastery, accuracy, speed, retention)
- Topics grouped by syllabus sections
- AI recommendation for weakest topic
- Links to topic detail and practice

**Topic Page (`/src/pages/Topic.tsx`):**
- Topic metrics and status
- Common error patterns (hardcoded currently)
- Revision schedule
- Question preview (sample questions)
- Link to targeted practice

---

## 5. State Management

### Auth State (`/src/lib/auth.tsx`)

**States:**
```typescript
export type AuthState = 
  | 'INITIALIZING'    // Session bootstrap in progress
  | 'AUTHENTICATED'   // Real user loaded
  | 'UNAUTHENTICATED' // No session, redirect to /login
  | 'BACKEND_UNAVAILABLE' // Network error, offer retry
```

**Context Interface:**
```typescript
interface AuthContextValue {
  state: AuthState
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  handleUnauthorized: () => void
  retry: () => Promise<void>
}
```

**Key Behaviors:**
- Bootstrap checks session on mount via `/users/me`
- Listens for `auth:logout` event from client.ts
- Token stored in memory (dev: localStorage mirror)
- Cache cleared on logout via `clearApiCache()`

### Session State (`/src/lib/session.ts`)

Simple in-memory store for bridging test completion to results page:
```typescript
const store: { lastResult: TestResult | null } = { lastResult: null }

export function saveResult(result: TestResult)
export function getSavedResult(): TestResult | null
```

### Memory Store (`/src/lib/memoryStore.ts`)

LocalStorage-backed revision items:
```typescript
export function listMemoryItems(): RevisionItem[]
export function addMemoryItem(topic: string, subject?: string): RevisionItem
export function removeMemoryItem(topic: string): void
```
Merged with API revision items in `api.getRevisionItems()`.

### Question State (Component-Level)

In `QuestionRunner.tsx`:
- `selections`: Array of selected options per question (null = unanswered)
- `flagged`: Set of flagged question indices
- `timeLeft`: Remaining seconds in timed mode
- `timePerQ`: Time spent per question (increments each second)
- `done`: Submission state flag

---

## 6. TypeScript Types

**Location:** `/src/lib/types.ts`

### Core Question Types

```typescript
export interface Question {
  id: string
  topicId: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 1 | 2 | 3 | 4 | 5
  /** seconds a strong candidate should need */
  targetSeconds: number
}

export interface QuestionAttempt {
  id: string
  questionId: string
  selectedIndex: number | null
  correct: boolean
  timeSpentSeconds: number
  confidence: 1 | 2 | 3 | 4 | 5
  answeredAt: string
}
```

### Test Types

```typescript
export interface Test {
  id: string
  examId: string
  name: string
  kind: 'adaptive' | 'mock' | 'diagnostic' | 'topic'
  subjectId?: string
  topicId?: string
  questionIds: string[]
  durationMinutes: number
  startedAt: string
  completedAt?: string
}

export interface TestResult {
  id: string
  testId: string
  score: number
  accuracy: number
  speed: number
  retention: number
  percentile: number
  correct: number
  total: number
  timeSpentMinutes: number
  attempts: QuestionAttempt[]
  /** Per-subject mark losses */
  losses: Record<string, number>
  diagnosis: string
  nextBestAction: string
  targetTopicId?: string
  completedAt: string
}
```

### Syllabus Types

```typescript
export interface Exam {
  id: string
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  color: string
  icon: string
  configurableSyllabus: boolean
}

export interface Subject {
  id: string
  examId: string
  name: string
  nameBn?: string
  weight: number
  mastery: number
  accuracy: number
  speed: number
  retention: number
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  mastery: number
  accuracy: number
  speed: number
  retention: number
  status: 'locked' | 'learning' | 'practicing' | 'mastered'
  reviewDue?: number
}
```

### Performance Types

```typescript
export interface Performance {
  mastery: number
  syllabusCoverage: number
  consistency: number
  accuracy: number
  speed: number
  retention: number
  examReadiness: number
  potentialScore: number
  percentile: number
  targetPercentile: number
  projectedPercentile: number
  trajectory: number[]
  studyHistory: { day: string; minutes: number }[]
  streakDays: number
}

export interface DailyTask {
  id: string
  subject: string
  topic: string
  kind: 'practice' | 'revision' | 'test' | 'review'
  durationMinutes: number
  priority: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  expectedQuestions?: number
  status: 'pending' | 'done'
}

export interface RevisionItem {
  id: string
  topic: string
  subject: string
  memoryStrength: number
  lastReviewed: string
  nextReview: string
  overdue: boolean
}

export interface AIRecommendation {
  id: string
  kind: 'diagnosis' | 'action' | 'strategy' | 'memory' | 'alert'
  severity: 'low' | 'medium' | 'high'
  title: string
  body: string
  actionLabel?: string
  actionRoute?: string
}
```

---

## 7. Subject/Topic/Exam Navigation

### Navigation Flow
```
Exams → ExamDetail → Subject → Topic → Practice
                                    ↓
                                  QuestionRunner
                                    ↓
                                  Results
```

### Syllabus Configuration (`/src/lib/syllabus.ts`)

**Structure:**
```typescript
export interface ExamSyllabus {
  id: string
  name: string
  shortName: string
  totalMarks: number
  subjects: ExamSubject[]
}

export interface ExamSubject {
  id: string
  name: string
  nameBn: string
  marks: number
  priority: 'high' | 'medium' | 'low'
  sections: SyllabusSection[]
}

export interface SyllabusSection {
  name: string
  topics: SyllabusTopic[]
}

export interface SyllabusTopic {
  id: string
  name: string
  topicId?: string  // Maps to Topic.id
}
```

**Constants:**
- `BCS_PRELIMINARY`: Canonical 200-mark syllabus (10 subjects)
- `SUBJECT_BY_ID`: Map lookup
- `TOTAL_MARKS`: Sum constant (200)

**Helper:**
```typescript
export function subjectById(id: string): ExamSubject | undefined
```

---

## 8. UI Component Library

**Location:** `/src/components/ui/index.tsx`

### Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `Button` | variant, size, icon, iconRight | Primary/secondary/ghost/outline/danger variants |
| `LinkButton` | to, variant, size, icon, iconRight | Button-styled React Router Link |
| `Card` | glow | Container with border styling |
| `Badge` | tone | Status chips (accent, cyan, violet, success, warning, danger, muted) |
| `Progress` | value, barClassName, showLabel | Animated progress bar with IntersectionObserver |
| `Metric` | label, value, sub, tone | Monospace metric display |
| `Eyebrow` | children | Section label with horizontal line |
| `Signal` | tone | AI signal chip with pulsing dot |
| `Skeleton` | className | Loading placeholder |
| `EmptyState` | icon, title, body, action | Empty data state |
| `ErrorState` | onRetry, onHome | Error with retry option |
| `UpgradeNotice` | feature | Paywall notice |
| `Input` | HTML input props | Text input |
| `Textarea` | HTML textarea props | Multiline input |
| `Field` | label, hint, htmlFor | Form field wrapper |

### AsyncGate (`/src/components/ui/AsyncGate.tsx`)

Standardized async data handling:
```typescript
interface AsyncGateProps<T> {
  loading: boolean
  error: boolean
  data: T | null
  onRetry?: () => void
  offline?: boolean
  skeleton?: ReactNode
  isEmpty?: boolean
  emptyTitle?: string
  emptyBody?: string
  emptyAction?: ReactNode
  children: (data: T) => ReactNode
}
```

**Priority:** offline → loading → error → empty → success(children)

---

## 9. Dashboard Components

**Location:** `/src/components/dashboard/`

### index.tsx

| Component | Purpose |
|-----------|---------|
| `AIBriefingCard` | Daily AI briefing with items list |
| `DailyMissionCard` | Today's tasks with completion state |
| `NextBestAction` | Prominent CTA for next recommended action |
| `MetricTile` | Single metric with progress bar |

### commandCenter.tsx

| Component | Purpose |
|-----------|---------|
| `ExamContextHeader` | Exam name, days remaining, readiness |
| `CoreSummary` | 4-metric grid (Readiness, Accuracy, Percentile, Streak) |
| `MissionCard` | Daily mission with numbered tasks + memory review |
| `SubjectPerformanceList` | 10-subject list sorted by priority |
| `PriorityFlag` | Critical/Focus/On track badge |
| `buildMission()` | Converts DailyTask[] to MissionItem[] |

**Priority Logic:**
```typescript
export function priorityFor(s: Pick<Subject, 'mastery' | 'weight'>): Priority {
  if (s.mastery < 50) return 'critical'
  if (s.mastery < 62) return 'focus'
  if (s.mastery < 55 && s.weight >= 20) return 'focus'
  return 'ontrack'
}
```

---

## 10. Performance Optimizations

### Code Splitting

All pages are lazy-loaded:
```typescript
const Landing = lazy(() => import('@/pages/Landing'))
const Practice = lazy(() => import('@/pages/Practice'))
const MockTest = lazy(() => import('@/pages/MockTest'))
// ... all routes use lazy loading
```

### Route Fallback
```typescript
function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        <span className="font-mono text-xs text-muted">Loading your preparation…</span>
      </div>
    </div>
  )
}
```

### Caching Strategy

**Request Deduplication:**
```typescript
const inflight = new Map<string, Promise<unknown>>()
// Identical concurrent requests share the same promise
```

**TTL Value Cache:**
```typescript
const valueCache = new Map<string, { value: unknown; expiresAt: number }>()
// Catalog data cached for 5 minutes
// Questions cached for 2 minutes
```

**Cache Invalidation:**
```typescript
export function clearApiCache(): void {
  valueCache.clear()
}
// Called on logout to prevent stale data leak
```

### Protected Route Optimization

ProtectedRoute shows spinner during INITIALIZING to prevent flash:
```typescript
if (state === 'INITIALIZING') {
  return <Spinner />
}
```

---

## 11. Key Patterns

### Answer Submission Flow

```
1. User selects option in QuestionRunner
   └── select(opt) updates selections[index]

2. User clicks "Finish" or timer expires
   └── finish() creates QuestionAttempt[]

3. Client-side grading
   └── selections[i] === question.correctIndex

4. Result computed
   └── TestResult with score, accuracy, speed, etc.

5. Save and navigate
   └── saveResult(result) → navigate('/results/:id')
```

### Scoring Rules (`/src/lib/scoring.ts`)

```typescript
export const BPSC_RULES = {
  correct: 1,
  wrong: -0.5,
  skipped: 0,
  label: 'BPSC Preliminary',
} as const

export interface ScoreBreakdown {
  correct: number
  incorrect: number
  skipped: number
  raw: number        // +1 per correct
  negative: number   // 0.5 per wrong
  final: number      // raw - negative
}

export function scoreAttempts(attempts: Pick<QuestionAttempt, 'selectedIndex' | 'correct'>[]): ScoreBreakdown
```

### Mock Data Pattern (`/src/lib/data/index.ts`)

- Realistic sample data aligned with TypeScript types
- Used only in DEV mode when API is unreachable
- No authentication mock (login/register always hit real API)

---

## 12. Database Integration Requirements

### Current Limitations

1. **Client-side grading**: `correctIndex` is exposed to frontend
2. **No server-side test persistence**: Results stored in memory only
3. **Adaptive mode is illustrative**: True adaptive selection not implemented
4. **LocalStorage for memory items**: Needs backend persistence
5. **Hardcoded mock test list**: Not dynamically generated

### Required Backend Endpoints

For full question generation database integration:

```
POST /questions/generate
  - Body: { topicId, difficulty, count, seed? }
  - Returns: Question[] (without correctIndex for real tests)

POST /tests
  - Body: { examId, kind, topicId?, questionIds }
  - Returns: Test

POST /tests/:id/submit
  - Body: { attempts: { questionId, selectedIndex, timeSpentSeconds }[] }
  - Returns: TestResult (server-graded)

GET /tests/:id
  - Returns: Test with questions (no correctIndex until submitted)

GET /tests/history
  - Returns: TestResult[]

POST /attempts
  - Body: { questionId, selectedIndex, timeSpentSeconds }
  - Returns: { correct: boolean, explanation } (immediate feedback)
```

### Data Model Requirements

**Questions Table:**
- id, topicId, prompt, options (JSON), correctIndex, explanation
- difficulty, targetSeconds, createdAt, createdBy (AI/human)
- version (for updates), isActive

**Topics Table:**
- id, subjectId, name, nameBn
- questionCount, avgDifficulty

**Attempts Table:**
- id, userId, questionId, testId
- selectedIndex, correct, timeSpentSeconds, confidence
- answeredAt

**Tests Table:**
- id, userId, examId, kind, topicId
- questionIds (JSON), durationMinutes
- startedAt, completedAt

**TestResults Table:**
- id, testId, userId
- score, accuracy, speed, retention, percentile
- correct, total, timeSpentMinutes
- diagnosis, nextBestAction, targetTopicId
- completedAt

---

## Appendix: File Reference

```
/src/
├── App.tsx                          # Route configuration
├── components/
│   ├── exam/
│   │   └── QuestionRunner.tsx       # Question display/answering
│   ├── dashboard/
│   │   ├── index.tsx                # Dashboard primitives
│   │   └── commandCenter.tsx        # Command center components
│   ├── ui/
│   │   ├── index.tsx                # Core UI components
│   │   └── AsyncGate.tsx            # Async data handling
│   ├── navigation/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Logo.tsx
│   ├── layout/
│   │   └── AppShell.tsx
│   ├── ProtectedRoute.tsx
│   └── ErrorBoundary.tsx
├── pages/
│   ├── Practice.tsx                 # Practice session config
│   ├── MockTest.tsx                 # Mock test runner
│   ├── MockTests.tsx                # Mock test list
│   ├── Results.tsx                  # Test results
│   ├── Subject.tsx                  # Subject detail
│   ├── Topic.tsx                    # Topic detail
│   ├── Dashboard.tsx                # Main dashboard
│   └── ...                          # Other pages
├── lib/
│   ├── api.ts                       # Service layer
│   ├── client.ts                    # HTTP client
│   ├── types.ts                     # TypeScript types
│   ├── auth.tsx                     # Auth context
│   ├── session.ts                   # In-memory result store
│   ├── memoryStore.ts               # LocalStorage revision items
│   ├── scoring.ts                   # BPSC scoring rules
│   ├── syllabus.ts                  # Canonical syllabus
│   ├── useAsync.ts                  # Async data hook
│   └── useSubmit.ts                 # Form submission hook
└── lib/data/
    └── index.ts                     # Mock data
```

---

**End of Audit**
