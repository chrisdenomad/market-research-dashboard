import { useData } from '../context/DataContext'

const tagStyles = {
  Opportunity: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  Risk:        { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  Trend:       { bg: 'rgba(99,102,241,0.12)', color: 'var(--accent-light)', border: 'rgba(99,102,241,0.3)' },
  Watch:       { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  Note:        { bg: 'rgba(148,163,184,0.12)',color: 'var(--text-secondary)', border: 'rgba(148,163,184,0.3)' },
}

export default function KeyInsights() {
  const { data } = useData()
  const keyInsightsData = data.keyInsightsData || []
  return (
    <div className="card" id="insights">
      <div className="card-header">
        <div>
          <h2 className="card-title">{(data.widgetTitles || {}).keyInsights || 'Key Insights'}</h2>
          <p className="card-subtitle">Critical findings from the market research</p>
        </div>
        <div className="tag-legend">
          {Object.entries(tagStyles).map(([tag, s]) => (
            <span key={tag} className="tag-legend-item" style={{ color: s.color }}>
              <span style={{ background: s.color, borderRadius: '50%', width: 6, height: 6, display: 'inline-block', marginRight: 4 }} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="insights-grid">
        {keyInsightsData.map((insight, i) => {
          const style = tagStyles[insight.tag] || tagStyles.Note
          return (
            <div key={i} className="insight-card" style={{ borderColor: style.border }}>
              <span
                className="insight-tag"
                style={{ background: style.bg, color: style.color, borderColor: style.border }}
              >
                {insight.tag}
              </span>
              <h3 className="insight-title">{insight.title}</h3>
              <p className="insight-body">{insight.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
