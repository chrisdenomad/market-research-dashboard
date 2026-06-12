import { createContext, useContext, useEffect, useState } from 'react'
import { themes, defaultTheme } from '../themes/themes'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('dashboard-theme')
    return themes.find((t) => t.id === saved) || defaultTheme
  })

  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, val]) => {
      root.style.setProperty(key, val)
    })
    // gradient-modern gets a background gradient on body
    if (theme.id === 'gradient-modern') {
      document.body.style.background =
        'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
      document.body.style.backgroundAttachment = 'fixed'
    } else {
      document.body.style.background = theme.vars['--bg-primary']
      document.body.style.backgroundAttachment = 'unset'
    }
    localStorage.setItem('dashboard-theme', theme.id)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, themes, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
