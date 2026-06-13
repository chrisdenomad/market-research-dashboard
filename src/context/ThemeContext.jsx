import { createContext, useContext, useEffect, useState } from 'react'
import { themes, defaultTheme } from '../themes/themes'

const ACTIVE_KEY  = 'dashboard-theme'
const DEFAULT_KEY = 'dashboard-theme-default'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // The currently displayed theme
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_KEY)
    return themes.find((t) => t.id === saved) || defaultTheme
  })

  // The user-pinned default theme (loaded on fresh page load)
  const [defaultThemeId, setDefaultThemeIdState] = useState(() => {
    return localStorage.getItem(DEFAULT_KEY) || defaultTheme.id
  })

  // Apply CSS vars whenever active theme changes
  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, val]) => {
      root.style.setProperty(key, val)
    })
    root.setAttribute('data-theme', theme.id)
    if (theme.id === 'gradient-modern') {
      document.body.style.background =
        'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
      document.body.style.backgroundAttachment = 'fixed'
    } else {
      document.body.style.background = theme.vars['--bg-primary']
      document.body.style.backgroundAttachment = 'unset'
    }
    localStorage.setItem(ACTIVE_KEY, theme.id)
  }, [theme])

  // Switch active theme (temporary preview or selection)
  function setTheme(t) {
    setThemeState(t)
  }

  // Pin a theme as default — next page load will start with this theme
  function setDefaultTheme(t) {
    setDefaultThemeIdState(t.id)
    localStorage.setItem(DEFAULT_KEY, t.id)
    // Also apply it immediately as active
    setTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, themes, setTheme, defaultThemeId, setDefaultTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
