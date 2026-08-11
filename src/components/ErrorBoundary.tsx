import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/lib/sentry'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Lightweight app-level error boundary. Catches render errors thrown by any
 * (lazy) route so the user sees a calm fallback instead of a blank screen or a
 * raw stack trace. Errors are logged for debugging; nothing sensitive leaks.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Route render error:', error, info)
    reportError(error, { boundary: 'App', componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <span className="text-4xl">🚀</span>
          <h1 className="mt-4 text-xl font-semibold text-ink">Something went off course.</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            An unexpected error occurred while rendering this page. Please try again.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 text-sm font-medium text-white transition-all hover:brightness-110"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
