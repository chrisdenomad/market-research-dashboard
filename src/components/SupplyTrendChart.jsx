import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label, regions }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => {
        const region = regions.find((r) => r.id === p.dataKey)
        return (
          <p key={p.dataKey} style={{ color: p.color }}>
            {region?.name || p.dataKey}: <strong>{p.value}</strong>
          </p>
        )
      })}
    </div>
  )
}

export default function SupplyTrendChart({ trendData, regions, selectedRegions }) {
  const [hiddenLines, setHiddenLines] = useState([])

  const visibleRegions = selectedRegions.length > 0
    ? regions.filter((r) => selectedRegions.includes(r.id))
    : regions

  function toggleLine(regionId) {
    setHiddenLines((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId]
    )
  }

  // Growth calculation (first vs last month)
  function getGrowth(regionId) {
    if (!trendData.length) return 0
    const first = trendData[0][regionId] || 0
    const last  = trendData[trendData.length - 1][regionId] || 0
    return first ? Math.round(((last - first) / first) * 100) : 0
  }

  return (
    <div className="geo-trend-wrap">
      {/* Toggle buttons */}
      <div className="geo-trend-toggles">
        {visibleRegions.map((region) => {
          const hidden  = hiddenLines.includes(region.id)
          const growth  = getGrowth(region.id)
          return (
            <button
              key={region.id}
              className={`geo-trend-toggle ${hidden ? 'hidden' : 'visible'}`}
              style={!hidden ? { borderColor: region.color, color: region.color } : {}}
              onClick={() => toggleLine(region.id)}
            >
              <span
                className="geo-trend-swatch"
                style={{ background: hidden ? 'var(--border)' : region.color }}
              />
              {region.name}
              <span
                className="geo-trend-growth"
                style={{ color: growth >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {growth >= 0 ? '+' : ''}{growth}%
              </span>
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip regions={regions} />} />
            {visibleRegions.map((region) =>
              hiddenLines.includes(region.id) ? null : (
                <Line
                  key={region.id}
                  type="monotone"
                  dataKey={region.id}
                  stroke={region.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="geo-trend-note">
        12-month supply trend · Toggle regions using the buttons above
      </p>
    </div>
  )
}
