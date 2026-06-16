import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useData } from '../context/DataContext'

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

export default function MarketSizeChart() {
  const { data } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('marketsize')) return null
  const marketSizeData = data.marketSizeData || []
  const disclaimers    = data.methodologyData?.disclaimers || []
  const titles         = data.widgetTitles || {}

  // Use the disclaimer mentioning LinkedIn/profiles if present, else the first one
  const chartNote =
    disclaimers.find((d) => d.toLowerCase().includes('linkedin') || d.toLowerCase().includes('profiles')) ||
    disclaimers[0] ||
    null

  return (
    <div className="card" id="market-size">
      <div className="card-header">
        <div>
          <h2 className="card-title">{titles.marketSize || 'Market Size by Location'}</h2>
          <p className="card-subtitle">Total identified profiles vs. candidates open to opportunities</p>
        </div>
        <span className="card-badge">LinkedIn Data</span>
      </div>

      <div className="chart-wrap" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={marketSizeData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="city" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}
            />
            <Bar dataKey="size"      name="Market Size"           fill="var(--chart-1)" radius={[4,4,0,0]} />
            <Bar dataKey="available" name="Candidate Availability" fill="var(--chart-3)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Market Size</th>
              <th>Candidate Availability</th>
              <th>Availability Rate</th>
            </tr>
          </thead>
          <tbody>
            {marketSizeData.map((row) => (
              <tr key={row.city}>
                <td><strong>{row.city}</strong></td>
                <td>{row.size}</td>
                <td>{row.available}</td>
                <td>
                  <span className="badge badge-blue">
                    {Math.round((row.available / row.size) * 100)}%
                  </span>
                </td>
              </tr>
            ))}
            <tr className="table-total">
              <td><strong>Total</strong></td>
              <td><strong>{marketSizeData.reduce((s, r) => s + r.size, 0)}</strong></td>
              <td><strong>{marketSizeData.reduce((s, r) => s + r.available, 0)}</strong></td>
              <td>
                <span className="badge badge-green">
                  {Math.round(
                    (marketSizeData.reduce((s, r) => s + r.available, 0) /
                      marketSizeData.reduce((s, r) => s + r.size, 0)) * 100
                  )}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="table-note">
          {chartNote
            ? `* ${chartNote}`
            : '* Research conducted on all visible LinkedIn profiles including local and non-local candidates. Candidate Availability refers to profiles identified as potentially open to opportunities.'
          }
        </p>
      </div>
    </div>
  )
}
