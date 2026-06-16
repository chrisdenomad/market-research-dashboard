import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Trash2, RefreshCw, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// ── Color groups for the builder ─────────────────────────────────────────────
const COLOR_GROUPS = [
  {
    label: 'Backgrounds',
    fields: [
      { key: '--bg-primary',   label: 'Page Background', tip: 'Main page background' },
      { key: '--bg-secondary', label: 'Secondary BG',    tip: 'Subtle surface behind cards' },
      { key: '--bg-card',      label: 'Card Background', tip: 'Widget / card surface' },
      { key: '--bg-hover',     label: 'Hover State',     tip: 'Background on hover' },
      { key: '--sidebar-bg',   label: 'Sidebar BG',      tip: 'Left navigation background' },
      { key: '--header-bg',    label: 'Header BG',       tip: 'Top bar background' },
    ],
  },
  {
    label: 'Text',
    fields: [
      { key: '--text-primary',   label: 'Primary Text',   tip: 'Headings, important labels' },
      { key: '--text-secondary', label: 'Secondary Text', tip: 'Body text, descriptions' },
      { key: '--text-muted',     label: 'Muted Text',     tip: 'Timestamps, hints, captions' },
    ],
  },
  {
    label: 'Accent & Brand',
    fields: [
      { key: '--accent',       label: 'Accent',       tip: 'Primary brand / action color' },
      { key: '--accent-light', label: 'Accent Light', tip: 'Hover/active state of accent' },
    ],
  },
  {
    label: 'Borders & Shadows',
    fields: [
      { key: '--border', label: 'Border Color', tip: 'Lines between elements' },
    ],
  },
  {
    label: 'Chart Colors',
    fields: [
      { key: '--chart-1', label: 'Chart 1', tip: 'First data series' },
      { key: '--chart-2', label: 'Chart 2', tip: 'Second data series' },
      { key: '--chart-3', label: 'Chart 3', tip: 'Third data series' },
      { key: '--chart-4', label: 'Chart 4', tip: 'Fourth data series' },
      { key: '--chart-5', label: 'Chart 5', tip: 'Fifth data series' },
    ],
  },
  {
    label: 'Map',
    fields: [
      { key: '--geo-land-data', label: 'Map Highlight', tip: 'Filled region color on the geo map' },
    ],
  },
]

// Non-color vars we always copy from the base theme without exposing pickers
const NON_COLOR_VARS = ['--shadow', '--glass', '--accent-bg']

// ── Helper: is a CSS value a plain hex / rgb color (pickable)? ────────────────
function isPickableColor(val) {
  if (!val) return false
  const v = val.trim()
  return v.startsWith('#') || v.startsWith('rgb')
}

// ── Helper: hex ↔ display ─────────────────────────────────────────────────────
function toHex(val) {
  if (!val) return '#000000'
  const v = val.trim()
  if (v.startsWith('#') && (v.length === 7 || v.length === 4)) return v
  // rgb(r,g,b) → hex
  const m = v.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (m) {
    return (
      '#' +
      [m[1], m[2], m[3]]
        .map((n) => parseInt(n).toString(16).padStart(2, '0'))
        .join('')
    )
  }
  return '#000000'
}

// ── Pre-set palette shortcuts ─────────────────────────────────────────────────
const QUICK_PALETTES = [
  { label: 'Ocean',    accent: '#0ea5e9', bg: '#071428', card: '#0d1f3c', text: '#e0f2fe', chart: ['#0ea5e9','#38bdf8','#7dd3fc','#06b6d4','#0891b2'] },
  { label: 'Rose',     accent: '#f43f5e', bg: '#1a0a0e', card: '#2d0f16', text: '#ffe4e6', chart: ['#f43f5e','#fb7185','#fda4af','#e11d48','#be123c'] },
  { label: 'Forest',   accent: '#16a34a', bg: '#0a1209', card: '#122010', text: '#dcfce7', chart: ['#16a34a','#22c55e','#4ade80','#15803d','#86efac'] },
  { label: 'Amber',    accent: '#f59e0b', bg: '#151005', card: '#261c08', text: '#fef3c7', chart: ['#f59e0b','#fbbf24','#fcd34d','#d97706','#92400e'] },
  { label: 'Violet',   accent: '#7c3aed', bg: '#0f0a1e', card: '#1a1035', text: '#ede9fe', chart: ['#7c3aed','#8b5cf6','#a78bfa','#6d28d9','#c4b5fd'] },
  { label: 'Neon',     accent: '#39ff14', bg: '#050505', card: '#111111', text: '#f0fff0', chart: ['#39ff14','#00ffe7','#ff00ff','#ff6600','#ffe600'] },
  { label: 'Sand',     accent: '#c2a36b', bg: '#f5f0e8', card: '#fffef7', text: '#3b2f1e', chart: ['#c2a36b','#a0845c','#d4b896','#8b6340','#e8d5b0'] },
  { label: 'Ice',      accent: '#67e8f9', bg: '#ecfeff', card: '#ffffff',  text: '#164e63', chart: ['#67e8f9','#22d3ee','#06b6d4','#0891b2','#0e7490'] },
]

// ── Derive a full vars map from a quick palette ───────────────────────────────
function paletteToVars(p, baseVars) {
  return {
    ...baseVars,
    '--accent':       p.accent,
    '--accent-light': p.chart[1] ?? p.accent,
    '--accent-bg':    hexToRgba(p.accent, 0.12),
    '--bg-primary':   p.bg,
    '--bg-secondary': shiftLightness(p.bg, 8),
    '--bg-card':      p.card,
    '--bg-hover':     shiftLightness(p.card, 8),
    '--sidebar-bg':   shiftLightness(p.bg, -4),
    '--header-bg':    shiftLightness(p.bg, -4),
    '--text-primary': p.text,
    '--chart-1': p.chart[0], '--chart-2': p.chart[1], '--chart-3': p.chart[2],
    '--chart-4': p.chart[3], '--chart-5': p.chart[4],
    '--geo-land-data': shiftLightness(p.accent, -20),
  }
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0,2), 16)
  const g = parseInt(h.substring(2,4), 16)
  const b = parseInt(h.substring(4,6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Very simple brightness shift – just lightens/darkens hex by offset steps
function shiftLightness(hex, amount) {
  if (!hex.startsWith('#') || hex.length < 7) return hex
  const clamp = (v) => Math.max(0, Math.min(255, v))
  const r = clamp(parseInt(hex.slice(1,3),16) + amount)
  const g = clamp(parseInt(hex.slice(3,5),16) + amount)
  const b = clamp(parseInt(hex.slice(5,7),16) + amount)
  return '#' + [r,g,b].map((n) => n.toString(16).padStart(2,'0')).join('')
}

// ── Single color row ──────────────────────────────────────────────────────────
function ColorRow({ field, value, onChange }) {
  const hex = isPickableColor(value) ? toHex(value) : '#888888'
  const unpickable = !isPickableColor(value)

  return (
    <div className="ctb-color-row" title={field.tip}>
      <label className="ctb-color-label">{field.label}</label>
      <div className="ctb-color-input-wrap">
        {unpickable ? (
          <span className="ctb-color-raw" title="Complex value – edit manually">
            {value?.slice(0, 22)}…
          </span>
        ) : (
          <>
            <input
              type="color"
              className="ctb-color-native"
              value={hex}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
            <span className="ctb-color-hex">{hex.toUpperCase()}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ── Collapsible group ─────────────────────────────────────────────────────────
function ColorGroup({ group, vars, onChange }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="ctb-group">
      <button className="ctb-group-header" onClick={() => setOpen((v) => !v)}>
        <span className="ctb-group-label">{group.label}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="ctb-group-body">
          {group.fields.map((f) => (
            <ColorRow
              key={f.key}
              field={f}
              value={vars[f.key] ?? ''}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CustomThemeBuilder({ onClose }) {
  const { theme: activeTheme, setTheme, addCustomTheme, removeCustomTheme, customThemes } = useTheme()

  // Working copy of the vars — starts from current active theme
  const [workVars, setWorkVars] = useState(() => ({ ...activeTheme.vars }))
  const [themeName, setThemeName] = useState('My Theme')
  const [saveMsg, setSaveMsg] = useState('')
  const liveId = useRef('custom-preview')

  // Live-apply changes to the document as user picks colors
  const handleChange = useCallback((key, val) => {
    setWorkVars((prev) => {
      const next = { ...prev, [key]: val }
      // Derive accent-bg from accent automatically
      if (key === '--accent') {
        next['--accent-bg'] = hexToRgba(val, 0.12)
      }
      // Live preview: push to root immediately
      document.documentElement.style.setProperty(key, val)
      if (key === '--accent') {
        document.documentElement.style.setProperty('--accent-bg', next['--accent-bg'])
      }
      return next
    })
  }, [])

  // Apply a quick palette
  const applyPalette = useCallback((p) => {
    const next = paletteToVars(p, workVars)
    setWorkVars(next)
    Object.entries(next).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v)
    })
  }, [workVars])

  // Reset to whatever the currently active preset theme was
  const handleReset = useCallback(() => {
    setWorkVars({ ...activeTheme.vars })
    Object.entries(activeTheme.vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v)
    })
  }, [activeTheme])

  // Save as a named custom theme
  const handleSave = useCallback(() => {
    const name = themeName.trim() || 'My Theme'
    const id = 'custom-' + Date.now()
    const newTheme = {
      id,
      name,
      label: 'Custom',
      isCustom: true,
      vars: { ...workVars },
    }
    addCustomTheme(newTheme)
    setTheme(newTheme)
    setSaveMsg(`"${name}" saved!`)
    setTimeout(() => setSaveMsg(''), 2500)
  }, [themeName, workVars, addCustomTheme, setTheme])

  return createPortal(
    <div className="ctb-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ctb-panel">

        {/* Header */}
        <div className="ctb-header">
          <Wand2 size={16} className="ctb-header-icon" />
          <span className="ctb-title">Custom Theme Builder</span>
          <button className="ctb-close" onClick={onClose} title="Close"><X size={16} /></button>
        </div>

        <div className="ctb-body">

          {/* Quick palettes */}
          <div className="ctb-section">
            <p className="ctb-section-title">Quick Palettes</p>
            <div className="ctb-palettes">
              {QUICK_PALETTES.map((p) => (
                <button
                  key={p.label}
                  className="ctb-palette-btn"
                  title={`Apply ${p.label} palette`}
                  onClick={() => applyPalette(p)}
                  style={{ '--p-accent': p.accent, '--p-bg': p.bg }}
                >
                  <span className="ctb-palette-dot" style={{ background: p.accent }} />
                  <span className="ctb-palette-dot" style={{ background: p.chart[1] }} />
                  <span className="ctb-palette-dot" style={{ background: p.bg }} />
                  <span className="ctb-palette-name">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color groups */}
          <div className="ctb-section">
            <p className="ctb-section-title">Color Tokens</p>
            {COLOR_GROUPS.map((g) => (
              <ColorGroup key={g.label} group={g} vars={workVars} onChange={handleChange} />
            ))}
          </div>

          {/* Saved custom themes */}
          {customThemes.length > 0 && (
            <div className="ctb-section">
              <p className="ctb-section-title">Saved Custom Themes</p>
              <div className="ctb-saved-list">
                {customThemes.map((t) => (
                  <div key={t.id} className="ctb-saved-row">
                    <span
                      className="ctb-saved-swatch"
                      style={{ background: t.vars['--accent'] ?? '#888' }}
                    />
                    <button
                      className="ctb-saved-name"
                      onClick={() => {
                        setTheme(t)
                        setWorkVars({ ...t.vars })
                        setThemeName(t.name)
                        Object.entries(t.vars).forEach(([k, v]) =>
                          document.documentElement.style.setProperty(k, v)
                        )
                      }}
                    >
                      {t.name}
                    </button>
                    <button
                      className="ctb-saved-delete"
                      title="Delete this custom theme"
                      onClick={() => removeCustomTheme(t.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: name + save + reset */}
        <div className="ctb-footer">
          <input
            className="ctb-name-input"
            type="text"
            placeholder="Theme name…"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            maxLength={32}
          />
          <button className="ctb-btn-reset" onClick={handleReset} title="Reset to base theme">
            <RefreshCw size={13} />
            Reset
          </button>
          <button className="ctb-btn-save" onClick={handleSave}>
            <Save size={13} />
            Save
          </button>
        </div>
        {saveMsg && <div className="ctb-save-msg">{saveMsg}</div>}
      </div>
    </div>,
    document.body
  )
}
