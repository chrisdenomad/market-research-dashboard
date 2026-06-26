import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Pencil, Check, X } from 'lucide-react'
import { useData } from '../context/DataContext'

// Fallback bar colours when no colour is set on the column definition
const BAR_COLORS = [
  'var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)',
  'var(--chart-4)', 'var(--chart-5)',
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Inline editable text field ──────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder, className, as: Tag = 'span' }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)

  function startEdit() { setDraft(value); setEditing(true) }
  function commit()    { onSave(draft.trim() || value); setEditing(false) }
  function cancel()    { setDraft(value); setEditing(false) }
  function handleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit() }
    if (e.key === 'Escape') { cancel() }
  }

  if (editing) {
    return (
      <span className="inline-edit-active">
        <input
          className={`inline-edit-input ${className || ''}`}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
        />
        <button className="inline-edit-btn inline-edit-confirm" onClick={commit}  title="Save (Enter)"><Check size={12} /></button>
        <button className="inline-edit-btn inline-edit-cancel"  onClick={cancel}  title="Cancel (Esc)"><X    size={12} /></button>
      </span>
    )
  }

  return (
    <span className="inline-edit-static">
      <Tag className={className}>{value}</Tag>
      <button className="inline-edit-trigger" onClick={startEdit} title="Edit">
        <Pencil size={11} />
      </button>
    </span>
  )
}

// ── Default columns used when no schema is saved ────────────────────────────
const DEFAULT_COLUMNS = [
  { key: 'city',      label: 'Location',              type: 'label'  },
  { key: 'size',      label: 'Market Size',            type: 'number', color: 'var(--chart-1)' },
  { key: 'available', label: 'Candidate Availability', type: 'number', color: 'var(--chart-3)' },
]

export default function MarketSizeChart() {
  const { data, applyData } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('marketsize')) return null

  const marketSizeData = data.marketSizeData || []
  const columns        = (data.marketSizeColumns && data.marketSizeColumns.length > 0)
    ? data.marketSizeColumns
    : DEFAULT_COLUMNS
  const disclaimers    = data.methodologyData?.disclaimers || []
  const titles         = data.widgetTitles || {}

  const title    = titles.marketSize         || 'Market Size by Location'
  const subtitle = titles.marketSizeSubtitle || ''
  const badge    = titles.marketSizeBadge    || ''

  // Separate label column from numeric columns
  const labelCol  = columns.find((c) => c.type === 'label') || columns[0]
  const numCols   = columns.filter((c) => c.type === 'number')

  // Totals row — only for numeric columns
  const totals = {}
  numCols.forEach((col) => {
    totals[col.key] = marketSizeData.reduce((s, r) => s + (Number(r[col.key]) || 0), 0)
  })

  const chartNote =
    disclaimers.find((d) => d.toLowerCase().includes('linkedin') || d.toLowerCase().includes('profiles')) ||
    disclaimers[0] ||
    null

  function saveTitle(key, val) {
    applyData({ ...data, widgetTitles: { ...titles, [key]: val } })
  }

  return (
    <div className="card" id="market-size">
      <div className="card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineEdit
            value={title}
            onSave={(v) => saveTitle('marketSize', v)}
            placeholder="Card title"
            className="card-title"
            as="h2"
          />
          {subtitle && (
            <InlineEdit
              value={subtitle}
              onSave={(v) => saveTitle('marketSizeSubtitle', v)}
              placeholder="Subtitle"
              className="card-subtitle"
            />
          )}
        </div>
        {badge && (
          <InlineEdit
            value={badge}
            onSave={(v) => saveTitle('marketSizeBadge', v)}
            placeholder="Badge text"
            className="card-badge"
          />
        )}
      </div>

      {/* ── Bar chart ── */}
      {numCols.length > 0 && marketSizeData.length > 0 && (
        <div className="chart-wrap" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marketSizeData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey={labelCol.key}
                tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-secondary)' }} />
              {numCols.map((col, idx) => (
                <Bar
                  key={col.key}
                  dataKey={col.key}
                  name={col.label}
                  fill={col.color || BAR_COLORS[idx % BAR_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Data table ── */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {/* Label column header */}
              <th>{labelCol.label}</th>
              {/* One header per numeric column */}
              {numCols.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {/* Derived ratio column only when exactly two numeric cols exist */}
              {numCols.length === 2 && (
                <th>{numCols[1].label} Rate</th>
              )}
            </tr>
          </thead>
          <tbody>
            {marketSizeData.map((row, i) => (
              <tr key={i}>
                <td><strong>{row[labelCol.key]}</strong></td>
                {numCols.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
                {numCols.length === 2 && (() => {
                  const a = Number(row[numCols[0].key]) || 0
                  const b = Number(row[numCols[1].key]) || 0
                  const pct = a ? Math.round((b / a) * 100) : 0
                  return (
                    <td key="rate">
                      <span className="badge badge-blue">{pct}%</span>
                    </td>
                  )
                })()}
              </tr>
            ))}

            {/* Totals row */}
            {marketSizeData.length > 0 && (
              <tr className="table-total">
                <td><strong>Total</strong></td>
                {numCols.map((col) => (
                  <td key={col.key}><strong>{totals[col.key]}</strong></td>
                ))}
                {numCols.length === 2 && (() => {
                  const totalA = totals[numCols[0].key] || 0
                  const totalB = totals[numCols[1].key] || 0
                  const pct    = totalA ? Math.round((totalB / totalA) * 100) : 0
                  return (
                    <td key="total-rate">
                      <span className="badge badge-green">{pct}%</span>
                    </td>
                  )
                })()}
              </tr>
            )}
          </tbody>
        </table>
        {chartNote && (
          <p className="table-note">* {chartNote}</p>
        )}
      </div>
    </div>
  )
}
