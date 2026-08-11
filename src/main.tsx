import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { PerfHud } from '@/components/horizon/PerfHud'
import { initSentry } from '@/lib/sentry'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <PerfHud />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

/* Lazy Sentry init — no-op unless VITE_SENTRY_DSN is set. */
void initSentry()
