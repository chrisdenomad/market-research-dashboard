import { useState } from 'react'
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Pencil, Check, X } from 'lucide-react'
import { useData } from '../context/DataContext'

// ── Fallback colours ────────────────────────────────────────────────────────
const BAR_COLORS = [
  'var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)',
  'var(--chart-4)', 'var(--chart-5)',
]

// Recharts CSS vars can't be used inside Pie/Cell fills — resolve them once
const HEX_FALLBACKS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']

function resolveColor(cssVar, idx) {
  // If it's already a hex/rgb value return it directly
  if (!cssVar || !cssVar.startsWith('var(')) return cssVar || HEX_FALLBACKS[idx % HEX_FALLBACKS.length]
  // Try to read the CSS variable from :root; if we're in a test/SSR env fall back to hex
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(
      cssVar.replace(/^var\(/, '').replace(/\)$/, '').trim()
    ).trim()
    return v || HEX_FALLBACKS[idx % HEX_FALLBACKS.length]
  } catch {
    return HEX_FALLBACKS[idx % HEX_FALLBACKS.length]
  }
}

// ── Chart type definitions ──────────────────────────────────────────────────
const CHART_TYPES = [
  {
    id:    'bar',
    label: 'Bar',
    icon:  (
      <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
        <rect x="2" y="8"  width="4" height="10" rx="1"/>
        <rect x="8" y="4"  width="4" height="14" rx="1"/>
        <rect x="14" y="11" width="4" height="7"  rx="1"/>
      </svg>
    ),
  },
  {
    id:    'line',
    label: 'Line',
    icon:  (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <polyline points="2,16 7,8 12,11 18,4"/>
      </svg>
    ),
  },
  {
    id:    'area',
    label: 'Area',
    icon:  (
      <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
        <path d="M2,18 L2,10 L7,6 L12,9 L18,3 L18,18 Z" opacity="0.5"/>
        <polyline points="2,10 7,6 12,9 18,3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id:    'pie',
    label: 'Pie',
    icon:  (
      <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
        <path d="M10,10 L10,2 A8,8 0 0,1 18,10 Z" opacity="0.9"/>
        <path d="M10,10 L18,10 A8,8 0 0,1 2,14 Z" opacity="0.7"/>
        <path d="M10,10 L2,14 A8,8 0 0,1 10,2 Z" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id:    'scatter',
    label: 'Scatter',
    icon:  (
      <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
        <circle cx="4"  cy="15" r="1.8"/>
        <circle cx="8"  cy="9"  r="1.8"/>
        <circle cx="12" cy="13" r="1.8"/>
        <circle cx="16" cy="5"  r="1.8"/>
        <circle cx="6"  cy="5"  r="1.8"/>
        <circle cx="14" cy="11" r="1.8"/>
      </svg>
    ),
  },
]

// ── Shared tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((p) => (
        <p key={p.name || p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name || p.dataKey}: <strong>{p.value}</strong>
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
        <button className="inline-edit-btn inline-edit-confirm" onClick={commit}  title="Save (Enter)"><Check size={12}/></button>
        <button className="inline-edit-btn inline-edit-cancel"  onClick={cancel}  title="Cancel (Esc)"><X    size={12}/></button>
      </span>
    )
  }

  return (
    <span className="inline-edit-static">
      <Tag className={className}>{value}</Tag>
      <button className="inline-edit-trigger" onClick={startEdit} title="Edit"><Pencil size={11}/></button>
    </span>
  )
}

// ── Chart type switcher pill row ────────────────────────────────────────────
function ChartTypePicker({ current, onChange }) {
  return (
    <div className="chart-type-picker no-pdf">
      {CHART_TYPES.map((ct) => (
        <button
          key={ct.id}
          className={`ctp-btn ${current === ct.id ? 'ctp-btn--active' : ''}`}
          onClick={() => onChange(ct.id)}
          title={ct.label}
        >
          {ct.icon}
          <span>{ct.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Default columns (used when no schema is saved) ──────────────────────────
const DEFAULT_COLUMNS = [
  { key: 'city',      label: 'Location',              type: 'label'  },
  { key: 'size',      label: 'Market Size',            type: 'number', color: 'var(--chart-1)' },
  { key: 'available', label: 'Candidate Availability', type: 'number', color: 'var(--chart-3)' },
]

// ────────────────────────────────────────────────────────────────────────────
// Per-chart-type renderers
// ────────────────────────────────────────────────────────────────────────────

function ChartBar({ data, labelKey, numCols }) {
  return (
    <BarChart data={data} barGap={4} barCategoryGap="30%">
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
      <XAxis dataKey={labelKey} tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false}/>
      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}/>
      {numCols.map((col, idx) => (
        <Bar key={col.key} dataKey={col.key} name={col.label}
          fill={col.color || BAR_COLORS[idx % BAR_COLORS.length]} radius={[4,4,0,0]}/>
      ))}
    </BarChart>
  )
}

function ChartLine({ data, labelKey, numCols }) {
  return (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
      <XAxis dataKey={labelKey} tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false}/>
      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}/>
      {numCols.map((col, idx) => (
        <Line key={col.key} type="monotone" dataKey={col.key} name={col.label}
          stroke={col.color || BAR_COLORS[idx % BAR_COLORS.length]}
          strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
      ))}
    </LineChart>
  )
}

function ChartArea({ data, labelKey, numCols }) {
  return (
    <AreaChart data={data}>
      <defs>
        {numCols.map((col, idx) => {
          const color = col.color || BAR_COLORS[idx % BAR_COLORS.length]
          return (
            <linearGradient key={col.key} id={`area-grad-${col.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          )
        })}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
      <XAxis dataKey={labelKey} tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false}/>
      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}/>
      {numCols.map((col, idx) => {
        const color = col.color || BAR_COLORS[idx % BAR_COLORS.length]
        return (
          <Area key={col.key} type="monotone" dataKey={col.key} name={col.label}
            stroke={color} strokeWidth={2}
            fill={`url(#area-grad-${col.key})`}/>
        )
      })}
    </AreaChart>
  )
}

function ChartPie({ data, labelKey, numCols }) {
  // For pie: if there are multiple number columns, show one donut per column side-by-side
  // Each donut uses the row labels as slices
  return (
    <PieChart>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}/>
      {numCols.map((col, colIdx) => {
        const totalCols  = numCols.length
        // Position multiple donuts side-by-side
        const segmentW   = 100 / totalCols
        const cx         = `${segmentW * colIdx + segmentW / 2}%`
        const outerR     = totalCols === 1 ? '75%' : '55%'
        const innerR     = totalCols === 1 ? '45%' : '30%'
        return (
          <Pie
            key={col.key}
            data={data}
            cx={cx}
            cy="50%"
            outerRadius={outerR}
            innerRadius={innerR}
            dataKey={col.key}
            nameKey={labelKey}
            name={col.label}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={totalCols === 1}
          >
            {data.map((_, i) => (
              <Cell
                key={`cell-${i}`}
                fill={resolveColor(
                  // Each slice in this column uses a different "row" colour, cycling through numCols palette base
                  HEX_FALLBACKS[i % HEX_FALLBACKS.length],
                  i
                )}
              />
            ))}
          </Pie>
        )
      })}
    </PieChart>
  )
}

function ChartScatter({ data, labelKey, numCols }) {
  if (numCols.length < 2) {
    // Need at least 2 numeric cols for a meaningful scatter — fall back to bar
    return <ChartBar data={data} labelKey={labelKey} numCols={numCols}/>
  }
  // Use first two number columns as X and Y; further columns as dot size (ZAxis)
  const xCol = numCols[0]
  const yCol = numCols[1]
  const zCol = numCols[2] || null

  // Recharts ScatterChart needs flat { x, y, z?, label } objects
  const scatterData = data.map((row) => ({
    x:     Number(row[xCol.key]) || 0,
    y:     Number(row[yCol.key]) || 0,
    z:     zCol ? (Number(row[zCol.key]) || 1) : 1,
    label: row[labelKey],
  }))

  return (
    <ScatterChart>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
      <XAxis dataKey="x" name={xCol.label} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false}
        label={{ value: xCol.label, position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }}/>
      <YAxis dataKey="y" name={yCol.label} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}
        label={{ value: yCol.label, angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}/>
      {zCol && <ZAxis dataKey="z" range={[40, 400]} name={zCol.label}/>}
      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
        if (!active || !payload?.length) return null
        const d = payload[0]?.payload
        return (
          <div className="chart-tooltip">
            <p className="tooltip-label">{d?.label}</p>
            <p style={{ color: 'var(--chart-1)' }}>{xCol.label}: <strong>{d?.x}</strong></p>
            <p style={{ color: 'var(--chart-3)' }}>{yCol.label}: <strong>{d?.y}</strong></p>
            {zCol && <p style={{ color: 'var(--chart-2)' }}>{zCol.label}: <strong>{d?.z}</strong></p>}
          </div>
        )
      }}/>
      <Scatter
        name="Data"
        data={scatterData}
        fill={resolveColor(xCol.color || 'var(--chart-1)', 0)}
        fillOpacity={0.8}
      />
    </ScatterChart>
  )
}

// ── Dispatch to the correct chart component ─────────────────────────────────
function ChartRenderer({ chartType, data, labelKey, numCols }) {
  const props = { data, labelKey, numCols }
  switch (chartType) {
    case 'line':    return <ChartLine    {...props}/>
    case 'area':    return <ChartArea    {...props}/>
    case 'pie':     return <ChartPie     {...props}/>
    case 'scatter': return <ChartScatter {...props}/>
    default:        return <ChartBar     {...props}/>
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
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

  const title     = titles.marketSize            || 'Market Size by Location'
  const subtitle  = titles.marketSizeSubtitle    || ''
  const badge     = titles.marketSizeBadge       || ''
  const chartType = titles.marketSizeChartType   || 'bar'

  const labelCol = columns.find((c) => c.type === 'label') || columns[0]
  const numCols  = columns.filter((c) => c.type === 'number')

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

  function setChartType(type) {
    applyData({ ...data, widgetTitles: { ...titles, marketSizeChartType: type } })
  }

  return (
    <div className="card" id="market-size">
      {/* ── Header ── */}
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

      {/* ── Chart type switcher ── */}
      {numCols.length > 0 && marketSizeData.length > 0 && (
        <ChartTypePicker current={chartType} onChange={setChartType}/>
      )}

      {/* ── Chart ── */}
      {numCols.length > 0 && marketSizeData.length > 0 && (
        <div className="chart-wrap" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartRenderer
              chartType={chartType}
              data={marketSizeData}
              labelKey={labelCol.key}
              numCols={numCols}
            />
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Data table ── */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{labelCol.label}</th>
              {numCols.map((col) => <th key={col.key}>{col.label}</th>)}
              {numCols.length === 2 && <th>{numCols[1].label} Rate</th>}
            </tr>
          </thead>
          <tbody>
            {marketSizeData.map((row, i) => (
              <tr key={i}>
                <td><strong>{row[labelCol.key]}</strong></td>
                {numCols.map((col) => <td key={col.key}>{row[col.key]}</td>)}
                {numCols.length === 2 && (() => {
                  const a = Number(row[numCols[0].key]) || 0
                  const b = Number(row[numCols[1].key]) || 0
                  return (
                    <td><span className="badge badge-blue">{a ? Math.round((b / a) * 100) : 0}%</span></td>
                  )
                })()}
              </tr>
            ))}
            {marketSizeData.length > 0 && (
              <tr className="table-total">
                <td><strong>Total</strong></td>
                {numCols.map((col) => <td key={col.key}><strong>{totals[col.key]}</strong></td>)}
                {numCols.length === 2 && (() => {
                  const a = totals[numCols[0].key] || 0
                  const b = totals[numCols[1].key] || 0
                  return (
                    <td><span className="badge badge-green">{a ? Math.round((b / a) * 100) : 0}%</span></td>
                  )
                })()}
              </tr>
            )}
          </tbody>
        </table>
        {chartNote && <p className="table-note">* {chartNote}</p>}
      </div>
    </div>
  )
}
