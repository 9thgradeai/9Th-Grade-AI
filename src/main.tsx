import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/lib/auth'
import { PerfHud } from '@/components/horizon/PerfHud'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <PerfHud />
    </AuthProvider>
  </StrictMode>,
)
