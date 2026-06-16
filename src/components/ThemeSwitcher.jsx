import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Palette, Wand2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Small color swatch per built-in theme — matches each theme's accent
const SWATCHES = {
  'executive-dark':  '#6366f1',
  'corporate-light': '#1e3a5f',
  'gradient-modern': '#a855f7',
  'fintech-green':   '#22c55e',
  'minimal-slate':   '#f97316',
}

export default function ThemeSwitcher() {
  const { theme, themes, customThemes = [], setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleSelect(t) {
    setTheme(t)
    setOpen(false)
  }

  return (
    <div className="theme-dropdown" ref={containerRef}>
      <button
        className="theme-dropdown-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change theme"
      >
        {theme.isCustom ? <Wand2 size={13} /> : <Palette size={13} />}
        <span className="theme-dropdown-label">{theme.label ?? theme.name}</span>
        <ChevronDown
          size={13}
          className={`theme-chevron ${open ? 'open' : ''}`}
        />
      </button>

      {open && (
        <div className="theme-dropdown-menu" role="listbox">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-dropdown-item ${theme.id === t.id ? 'active' : ''}`}
              role="option"
              aria-selected={theme.id === t.id}
              onClick={() => handleSelect(t)}
            >
              <span
                className="theme-swatch"
                style={{ background: SWATCHES[t.id] ?? t.vars?.['--accent'] ?? '#6366f1' }}
              />
              <span className="theme-dropdown-item-label">
                {t.name}
                {t.isCustom && (
                  <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4 }}>custom</span>
                )}
              </span>
              {theme.id === t.id && <Check size={12} className="theme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
