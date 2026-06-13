import { X } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts'

const METRICS = [
  { key: 'supply',      label: 'Supply',       max: 200 },
  { key: 'available',   label: 'Available',    max: 100 },
  { key: 'marketShare', label: 'Mkt Share %',  max: 60  },
  { key: 'yoyChange',   label: 'YoY Growth',   max: 30  },
  { key: 'availRate',   label: 'Avail. Rate %', max: 70 },
]

function normalize(value, max) {
  return Math.max(0, Math.min(100, (value / max) * 100))
}

const CustomTooltip = ({ active, payload, regions }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{payload[0]?.payload?.metric}</p>
      {payload.map((p) => {
        const region = regions.find((r) => r.id === p.dataKey)
        return (
          <p key={p.dataKey} style={{ color: p.color }}>
            {region?.name}: <strong>{p.value.toFixed(0)}</strong>
          </p>
        )
      })}
    </div>
  )
}

export default function RegionComparison({ regions, compareRegions, onRemove }) {
  const selected = regions.filter((r) => compareRegions.includes(r.id))

  if (selected.length < 2) {
    return (
      <div className="geo-compare-empty">
        <p>Select <strong>2–4 regions</strong> using the region buttons above to compare them side-by-side.</p>
        <p className="geo-compare-hint">Enable Compare mode, then click region buttons to add them.</p>
      </div>
    )
  }

  // Build radar data
  const radarData = METRICS.map((metric) => {
    const point = { metric: metric.label }
    selected.forEach((region) => {
      const raw = metric.key === 'availRate'
        ? Math.round((region.available / region.supply) * 100)
        : region[metric.key]
      point[region.id] = normalize(raw, metric.max)
    })
    return point
  })

  // Stat cards per region
  function StatCard({ region }) {
    const availRate = Math.round((region.available / region.supply) * 100)
    return (
      <div className="geo-compare-card" style={{ borderColor: region.color + '55' }}>
        <div className="geo-compare-card-header" style={{ borderBottomColor: region.color }}>
          <span className="geo-compare-dot" style={{ background: region.color }} />
          <div>
            <div className="geo-compare-city">{region.name}</div>
            <div className="geo-compare-country">{region.country} · {region.zone}</div>
          </div>
          <button
            className="geo-compare-remove"
            onClick={() => onRemove(region.id)}
            title="Remove from comparison"
          >
            <X size={12} />
          </button>
        </div>
        <div className="geo-compare-stats">
          <div className="geo-compare-stat">
            <span className="geo-compare-stat-val">{region.supply}</span>
            <span className="geo-compare-stat-lbl">Total Supply</span>
          </div>
          <div className="geo-compare-stat">
            <span className="geo-compare-stat-val">{region.available}</span>
            <span className="geo-compare-stat-lbl">Available</span>
          </div>
          <div className="geo-compare-stat">
            <span
              className="geo-compare-stat-val"
              style={{ color: availRate >= 45 ? '#22c55e' : availRate >= 35 ? 'var(--accent)' : '#f59e0b' }}
            >
              {availRate}%
            </span>
            <span className="geo-compare-stat-lbl">Avail. Rate</span>
          </div>
          <div className="geo-compare-stat">
            <span className="geo-compare-stat-val">{region.marketShare}%</span>
            <span className="geo-compare-stat-lbl">Mkt Share</span>
          </div>
          <div className="geo-compare-stat">
            <span
              className="geo-compare-stat-val"
              style={{ color: region.yoyChange >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {region.yoyChange >= 0 ? '+' : ''}{region.yoyChange}%
            </span>
            <span className="geo-compare-stat-lbl">YoY Change</span>
          </div>
        </div>
      </div>
    )
  }

  // Diff table — compare each metric relative to the first selected region
  const base = selected[0]
  function diffPct(a, b) {
    if (!b) return null
    return Math.round(((a - b) / b) * 100)
  }

  return (
    <div className="geo-compare-wrap">
      {/* Stat cards */}
      <div className="geo-compare-cards">
        {selected.map((region) => (
          <StatCard key={region.id} region={region} />
        ))}
      </div>

      {/* Radar chart */}
      <div className="geo-compare-radar">
        <div className="geo-compare-radar-title">Capability Radar (normalised 0–100)</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip regions={regions} />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
                formatter={(value) => regions.find((r) => r.id === value)?.name || value}
              />
              {selected.map((region) => (
                <Radar
                  key={region.id}
                  name={region.id}
                  dataKey={region.id}
                  stroke={region.color}
                  fill={region.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diff table */}
      <div className="geo-compare-diff">
        <div className="geo-compare-diff-title">
          Metric differences vs <strong>{base.name}</strong>
        </div>
        <table className="data-table geo-diff-table">
          <thead>
            <tr>
              <th>Metric</th>
              {selected.map((r) => (
                <th key={r.id} style={{ color: r.color }}>{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Supply',      fn: (r) => r.supply },
              { label: 'Available',   fn: (r) => r.available },
              { label: 'Avail. Rate', fn: (r) => Math.round((r.available / r.supply) * 100) },
              { label: 'Market Share',fn: (r) => r.marketShare },
              { label: 'YoY Change',  fn: (r) => r.yoyChange },
            ].map(({ label, fn }) => {
              const baseVal = fn(base)
              return (
                <tr key={label}>
                  <td><strong>{label}</strong></td>
                  {selected.map((region) => {
                    const val  = fn(region)
                    const diff = region.id === base.id ? null : diffPct(val, baseVal)
                    return (
                      <td key={region.id}>
                        {val}{label.includes('Rate') || label.includes('Share') || label.includes('YoY') ? '%' : ''}
                        {diff !== null && (
                          <span
                            className="geo-diff-badge"
                            style={{ color: diff >= 0 ? '#22c55e' : '#ef4444' }}
                          >
                            {diff >= 0 ? '+' : ''}{diff}%
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
