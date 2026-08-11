import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { PerfHud } from '@/components/horizon/PerfHud'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { initSentry } from '@/lib/sentry'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" → framer-motion honors prefers-reduced-motion
        app-wide (CSS animations are already guarded in index.css). Keeps the
        UI alive for most users while zeroing transform motion on request. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <App />
          <OfflineBanner />
          <PerfHud />
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
)

/* Lazy Sentry init — no-op unless VITE_SENTRY_DSN is set. */
void initSentry()
