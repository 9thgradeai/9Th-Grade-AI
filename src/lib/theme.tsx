import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'grade.theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggle: () => {},
})

/**
 * Theme provider — dark by default, with a persisted light/dark toggle.
 *
 * Applies `.light` on <html> so the CSS-variable theme in index.css flips every
 * token-driven utility. The class is applied synchronously in the initializer
 * (before first paint) to avoid a flash when the saved theme is light.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
    const initial: Theme = saved === 'light' ? 'light' : 'dark'
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('light', initial === 'light')
    }
    return initial
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
