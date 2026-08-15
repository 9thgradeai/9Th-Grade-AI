import { lazy } from 'react'

export const publicRoutes = [
  { path: '/', element: lazy(() => import('@/pages/Landing')) },
  { path: '/how-it-works', element: lazy(() => import('@/pages/HowItWorks')) },
  { path: '/exams', element: lazy(() => import('@/pages/Exams')) },
  { path: '/exams/:slug', element: lazy(() => import('@/pages/ExamDetail')) },
  { path: '/ai-engine', element: lazy(() => import('@/pages/AIEngine')) },
  { path: '/pricing', element: lazy(() => import('@/pages/Pricing')) },
  { path: '/about', element: lazy(() => import('@/pages/About')) },
]

export const authRoutes = [
  { path: '/login', element: lazy(() => import('@/pages/Login')) },
  { path: '/register', element: lazy(() => import('@/pages/Register')) },
  { path: '/forgot-password', element: lazy(() => import('@/pages/ForgotPassword')) },
  { path: '/reset-password', element: lazy(() => import('@/pages/ResetPassword')) },
  { path: '/verify-email', element: lazy(() => import('@/pages/VerifyEmail')) },
  { path: '/onboarding', element: lazy(() => import('@/pages/Onboarding')) },
]

export const protectedRoutes = [
  { path: 'dashboard', element: lazy(() => import('@/pages/Dashboard')) },
  { path: 'subjects/:id', element: lazy(() => import('@/pages/Subject')) },
  { path: 'topics/:id', element: lazy(() => import('@/pages/Topic')) },
  { path: 'practice', element: lazy(() => import('@/pages/Practice')) },
  { path: 'mock-tests', element: lazy(() => import('@/pages/MockTests')) },
  { path: 'mock-tests/:id', element: lazy(() => import('@/pages/MockTest')) },
  { path: 'results/:id', element: lazy(() => import('@/pages/Results')) },
  { path: 'strategy', element: lazy(() => import('@/pages/Strategy')) },
  { path: 'memory', element: lazy(() => import('@/pages/Memory')) },
  { path: 'progress', element: lazy(() => import('@/pages/Progress')) },
  { path: 'rank', element: lazy(() => import('@/pages/Rank')) },
  { path: 'profile', element: lazy(() => import('@/pages/Profile')) },
  { path: 'settings', element: lazy(() => import('@/pages/Settings')) },
  { path: 'notices', element: lazy(() => import('@/pages/ComingSoon')) },
  { path: 'career', element: lazy(() => import('@/pages/ComingSoon')) },
  { path: 'written-viva', element: lazy(() => import('@/pages/ComingSoon')) },
]
