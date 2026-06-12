import { Users, UserCheck, MapPin, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const iconMap = {
  users:     Users,
  userCheck: UserCheck,
  mapPin:    MapPin,
  clock:     Clock,
}

const trendIcon = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
}

export default function KPICard({ label, value, unit, change, trend, icon }) {
  const Icon    = iconMap[icon] || Users
  const Trend   = trendIcon[trend] || Minus
  const trendColor = trend === 'up' ? 'var(--chart-4)' : trend === 'down' ? '#ef4444' : 'var(--text-muted)'

  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon-wrap">
          <Icon size={18} />
        </span>
      </div>
      <div className="kpi-value">
        {value}
        <span className="kpi-unit">{unit}</span>
      </div>
      <div className="kpi-change" style={{ color: trendColor }}>
        <Trend size={13} style={{ marginRight: 4, flexShrink: 0 }} />
        {change}
      </div>
    </div>
  )
}
