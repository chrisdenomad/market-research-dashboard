import {
  RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip,
} from 'recharts'
import { useData } from '../context/DataContext'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d.fullLabel}</p>
      <p style={{ color: d.color }}><strong>{d.value.toLocaleString()}</strong> candidates</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{d.description}</p>
    </div>
  )
}

export default function MarketCapacity() {
  const { data } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('capacity')) return null
  const marketCapacityData = data.marketCapacityData || []
  const max = marketCapacityData[0]?.value || 1
  const chartData = marketCapacityData.map((d) => ({ ...d, fill: d.color }))
  const titles = data.widgetTitles || {}

  return (
    <div className="card" id="capacity">
      <div className="card-header">
        <div>
          <h2 className="card-title">{titles.marketCapacity || 'Market Capacity'}</h2>
          <p className="card-subtitle">Talent funnel — from total market to reachable candidates</p>
        </div>
        <span className="card-badge">Funnel</span>
      </div>

      <div className="capacity-layout">
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="20%" outerRadius="90%"
              data={chartData}
              startAngle={180} endAngle={-180}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: 'var(--border)' }}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 700, formatter: (val) => val.toLocaleString() }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="capacity-legend">
          {marketCapacityData.map((d) => (
            <div key={d.label} className="capacity-item">
              <div className="capacity-item-top">
                <span className="capacity-dot" style={{ background: d.color }} />
                <span className="capacity-tag">{d.label}</span>
                <span className="capacity-value">{d.value.toLocaleString()}</span>
              </div>
              <p className="capacity-desc">{d.description}</p>
              <div className="capacity-bar-bg">
                <div
                  className="capacity-bar-fill"
                  style={{
                    width: `${(d.value / max) * 100}%`,
                    background: d.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
