import { useEffect, useRef } from 'react'
import { X, RotateCcw, Eye, EyeOff } from 'lucide-react'

// All possible widgets with their display metadata
export const ALL_WIDGETS = [
  { id: 'ai-overview',       label: 'AI Market Overview',       description: 'AI-generated market summary' },
  { id: 'kpi',               label: 'Overview Metrics',         description: 'Key metrics summary cards' },
  { id: 'market-size',       label: 'Market Size Chart',        description: 'Market size by city (bar chart)' },
  { id: 'market-capacity',   label: 'Market Capacity',          description: 'TAM / SAM / SOM funnel' },
  { id: 'geo-distribution',  label: 'Geographic Distribution',  description: 'Interactive map, trends & region compare' },
  { id: 'sourcing',          label: 'Sourcing Outlook',         description: 'Hiring funnel & sourcing stats' },
  { id: 'key-insights',      label: 'Key Insights',             description: 'Color-coded insight cards' },
  { id: 'benchmark',         label: 'Salary Benchmark',         description: 'Market rate & salary table' },
  { id: 'methodology',       label: 'Search Methodology',       description: 'Criteria, sources & confidence' },
]

export default function WidgetManager({ visibleWidgets, onToggle, onReset, onClose }) {
  const panelRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Close on outside click (backdrop)
  function handleBackdropClick(e) {
    if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
  }

  const visibleCount = visibleWidgets.length

  return (
    <div className="wm-backdrop" onPointerDown={handleBackdropClick}>
      <aside className="wm-panel" ref={panelRef} role="dialog" aria-label="Manage widgets">
        {/* Header */}
        <div className="wm-header">
          <div className="wm-header-left">
            <h2 className="wm-title">Dashboard Widgets</h2>
            <p className="wm-subtitle">{visibleCount} of {ALL_WIDGETS.length} shown</p>
          </div>
          <div className="wm-header-actions">
            <button className="wm-reset-btn" onClick={onReset} title="Restore all widgets">
              <RotateCcw size={13} /> Reset
            </button>
            <button className="wm-close-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Widget list */}
        <ul className="wm-list">
          {ALL_WIDGETS.map(({ id, label, description }) => {
            const isVisible = visibleWidgets.includes(id)
            return (
              <li key={id} className={`wm-item ${isVisible ? 'wm-item--on' : 'wm-item--off'}`}>
                <div className="wm-item-info">
                  <span className="wm-item-label">{label}</span>
                  <span className="wm-item-desc">{description}</span>
                </div>
                <button
                  className={`wm-toggle ${isVisible ? 'wm-toggle--on' : 'wm-toggle--off'}`}
                  onClick={() => onToggle(id)}
                  title={isVisible ? 'Hide widget' : 'Show widget'}
                  aria-pressed={isVisible}
                >
                  <span className="wm-toggle-track">
                    <span className="wm-toggle-thumb" />
                  </span>
                  <span className="wm-toggle-icon">
                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="wm-footer">
          <p className="wm-footer-note">Changes are saved automatically and persist on refresh.</p>
        </div>
      </aside>
    </div>
  )
}
