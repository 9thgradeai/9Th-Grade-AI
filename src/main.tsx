import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import { AppProviders } from '@/app/providers/AppProviders'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { PerfHud } from '@/components/horizon/PerfHud'
import { initSentry } from '@/lib/sentry'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <AppProviders>
        <App />
        <OfflineBanner />
        <PerfHud />
      </AppProviders>
    </MotionConfig>
  </StrictMode>,
)

void initSentry()
