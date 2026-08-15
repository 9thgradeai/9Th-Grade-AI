import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoutes } from '@/app/router/protectedRoutes'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const Landing = lazy(() => import('@/pages/Landing'))
const HowItWorks = lazy(() => import('@/pages/HowItWorks'))
const Exams = lazy(() => import('@/pages/Exams'))
const ExamDetail = lazy(() => import('@/pages/ExamDetail'))
const AIEngine = lazy(() => import('@/pages/AIEngine'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const About = lazy(() => import('@/pages/About'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Subject = lazy(() => import('@/pages/Subject'))
const Topic = lazy(() => import('@/pages/Topic'))
const Practice = lazy(() => import('@/pages/Practice'))
const MockTests = lazy(() => import('@/pages/MockTests'))
const MockTest = lazy(() => import('@/pages/MockTest'))
const Results = lazy(() => import('@/pages/Results'))
const Strategy = lazy(() => import('@/pages/Strategy'))
const Memory = lazy(() => import('@/pages/Memory'))
const Progress = lazy(() => import('@/pages/Progress'))
const Rank = lazy(() => import('@/pages/Rank'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const ComingSoon = lazy(() => import('@/pages/ComingSoon'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const SubjectOverview = lazy(() => import('@/pages/SubjectOverview'))
const TopicOverview = lazy(() => import('@/pages/TopicOverview'))

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

function ScrollToTop() {
  useLocation()
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/:slug" element={<ExamDetail />} />
              <Route path="/exams/:examSlug/:stageSlug" element={<ExamDetail />} />
              <Route path="/exams/:examSlug/:stageSlug/subjects/:subjectId" element={<SubjectOverview />} />
              <Route path="/exams/:examSlug/:stageSlug/subjects/:subjectId/topics/:topicId" element={<TopicOverview />} />
              <Route path="/ai-engine" element={<AIEngine />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route path="/" element={<AppShell />}>
              <Route element={<ProtectedRoutes />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="subjects/:id" element={<Subject />} />
                <Route path="topics/:id" element={<Topic />} />
                <Route path="practice" element={<Practice />} />
                <Route path="mock-tests" element={<MockTests />} />
                <Route path="mock-tests/:id" element={<MockTest />} />
                <Route path="results/:id" element={<Results />} />
                <Route path="strategy" element={<Strategy />} />
                <Route path="memory" element={<Memory />} />
                <Route path="progress" element={<Progress />} />
                <Route path="rank" element={<Rank />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notices" element={<ComingSoon title="Noticeboard" description="Official exam notices, circulars and deadlines will live here." action={{ to: '/exams', label: 'Browse exam information' }} />} />
                <Route path="career" element={<ComingSoon title="Career OS" description="Your recruitment journey — Preliminary → Written → Viva → Medical → Verification → Gazetted Appointment." action={{ to: '/profile', label: 'View profile' }} />} />
                <Route path="written-viva" element={<ComingSoon title="Written & Viva" description="AI-evaluated written answers and mock viva practice will live here." action={{ to: '/practice', label: 'Practice instead' }} />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </>
  )
}
