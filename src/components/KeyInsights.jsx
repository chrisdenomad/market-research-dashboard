import { useData } from '../context/DataContext'

const tagStyles = {
  Opportunity: { bg: '#0d3327', color: '#10b981', border: '#10b981' },
  Risk:        { bg: '#3b1212', color: '#ef4444', border: '#ef4444' },
  Trend:       { bg: '#1e1f4a', color: 'var(--accent-light)', border: 'var(--accent)' },
  Watch:       { bg: '#3b2a0a', color: '#f59e0b', border: '#f59e0b' },
  Note:        { bg: '#1e2535', color: 'var(--text-secondary)', border: 'var(--border)' },
}

export default function KeyInsights() {
  const { data } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('insights')) return null
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
