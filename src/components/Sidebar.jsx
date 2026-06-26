import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Settings, KeyRound, LayoutDashboard, Palette, Check, Star, Wand2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const CustomThemeBuilder = lazy(() => import('./CustomThemeBuilder'))

// Maps widget id → sidebar section element id + label
const WIDGET_NAV = {
  'ai-overview':      { sectionId: 'ai-overview-section', label: 'AI Overview'        },
  'kpi':              { sectionId: 'kpi',                 label: 'Overview'            },
  'market-size':      { sectionId: 'market-size',         label: 'Market Supply'       },
  'market-capacity':  { sectionId: 'capacity',            label: 'Market Capacity'     },
  'geo-distribution': { sectionId: 'geo-distribution',    label: 'Geographic Dist.'    },
  'sourcing':         { sectionId: 'sourcing',            label: 'Sourcing Outlook'    },
  'key-insights':     { sectionId: 'insights',            label: 'Key Insights'        },
  'benchmark':        { sectionId: 'benchmark',           label: 'Salary Benchmark'    },
  'methodology':      { sectionId: 'methodology',         label: 'Search Methodology'  },
}

const SWATCHES = {
  'executive-dark':  '#6366f1',
  'corporate-light': '#1e3a5f',
  'gradient-modern': '#a855f7',
  'fintech-green':   '#22c55e',
  'minimal-slate':   '#f97316',
}

// ── Settings flyout panel ─────────────────────────────────────────────────────
function SettingsPanel({ onOpenKeyModal, onManageWidgets, onOpenThemeBuilder, onClose }) {
  const { theme, themes, setTheme, defaultThemeId, setDefaultTheme, customThemes } = useTheme()
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function onPointer(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="settings-panel" ref={panelRef}>
      <div className="settings-panel-header">
        <span className="settings-panel-title">Settings</span>
      </div>

      {/* API Key */}
      <button
        className="settings-item"
        onClick={() => { onOpenKeyModal(); onClose() }}
      >
        <KeyRound size={18} />
        <div className="settings-item-text">
          <span className="settings-item-label">API Key</span>
          <span className="settings-item-desc">Configure GitHub Models key</span>
        </div>
      </button>

      {/* Widgets */}
      <button
        className="settings-item"
        onClick={() => { onManageWidgets(); onClose() }}
      >
        <LayoutDashboard size={18} />
        <div className="settings-item-text">
          <span className="settings-item-label">Widgets</span>
          <span className="settings-item-desc">Show, hide or reorder panels</span>
        </div>
      </button>

      {/* Custom Theme Builder */}
      <button
        className="settings-item"
        onClick={() => { onOpenThemeBuilder(); onClose() }}
      >
        <Wand2 size={18} />
        <div className="settings-item-text">
          <span className="settings-item-label">Custom Theme</span>
          <span className="settings-item-desc">
            Build your own color scheme
            {customThemes.length > 0 && (
              <span className="settings-item-badge">{customThemes.length} saved</span>
            )}
          </span>
        </div>
      </button>

      {/* Theme picker */}
      <div className="settings-divider" />
      <p className="settings-section-label">Theme</p>
      <div className="settings-theme-grid">
        {themes.map((t) => {
          const isActive  = theme.id === t.id
          const isDefault = defaultThemeId === t.id
          const color     = SWATCHES[t.id] ?? t.vars?.['--accent'] ?? '#6366f1'
          return (
            <div key={t.id} className="settings-theme-cell" title={t.name}>
              <button
                className={`settings-theme-swatch-btn ${isActive ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => setTheme(t)}
              >
                {isActive && <Check size={10} />}
              </button>
              <button
                className={`settings-default-dot ${isDefault ? 'pinned' : ''}`}
                onClick={() => setDefaultTheme(t)}
                title={isDefault ? 'Default theme' : 'Set as default'}
              >
                <Star size={9} />
              </button>
              <span className="settings-theme-cell-name">{t.name}</span>
            </div>
          )
        })}
      </div>
      <p className="settings-hint">
        <Star size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
        Starred theme loads on every refresh.
      </p>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ visibleWidgets = [], onOpenKeyModal, onManageWidgets }) {
  const [active, setActive]                   = useState(null)
  const [settingsOpen, setSettingsOpen]       = useState(false)
  const [themeBuilderOpen, setThemeBuilderOpen] = useState(false)

  // Build ordered nav items from the live visible widget order
  const navItems = visibleWidgets
    .filter((id) => WIDGET_NAV[id])
    .map((id) => ({ id, sectionId: WIDGET_NAV[id].sectionId, label: WIDGET_NAV[id].label }))

  useEffect(() => {
    if (navItems.length === 0) return
    const observers = []
    navItems.forEach(({ sectionId }) => {
      const el = document.getElementById(sectionId)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(sectionId) },
        { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [navItems.map((n) => n.sectionId).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollTo = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(({ id, sectionId, label }) => (
          <button
            key={id}
            className={`sidebar-item ${active === sectionId ? 'active' : ''}`}
            onClick={() => scrollTo(sectionId)}
          >
            <span className="sidebar-indicator" />
            {label}
          </button>
        ))}
      </nav>

        <div className="sidebar-bottom no-pdf">
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Talent Market Research Dashboard</p>
          <p className="sidebar-footer-text" style={{ opacity: 0.5 }}>v1.0</p>
        </div>

        {/* Settings button + flyout */}
        <div className="sidebar-settings-wrap">
          {settingsOpen && (
            <SettingsPanel
              onOpenKeyModal={onOpenKeyModal}
              onManageWidgets={onManageWidgets}
              onOpenThemeBuilder={() => setThemeBuilderOpen(true)}
              onClose={() => setSettingsOpen(false)}
            />
          )}
          <button
            className={`sidebar-settings-btn ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen((v) => !v)}
            title="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Custom Theme Builder modal (lazy) */}
      {themeBuilderOpen && (
        <Suspense fallback={null}>
          <CustomThemeBuilder onClose={() => setThemeBuilderOpen(false)} />
        </Suspense>
      )}
    </aside>
  )
}
