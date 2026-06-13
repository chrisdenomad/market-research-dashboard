import { useData } from '../context/DataContext'

export default function SourcingOutlook() {
  const { data } = useData()
  const sourcingFunnelData = data.sourcingFunnelData || []
  const sourcingStats      = data.sourcingStats      || []
  const disclaimers        = data.methodologyData?.disclaimers || []
  const titles             = data.widgetTitles || {}
  const max = sourcingFunnelData[0]?.count || 1

  // Use the disclaimer that mentions "sourcing timeline" if present, else the last one
  const sourcingNote =
    disclaimers.find((d) => d.toLowerCase().includes('sourcing')) ||
    disclaimers[disclaimers.length - 1] ||
    null

  return (
    <div className="card" id="sourcing">
      <div className="card-header">
        <div>
          <h2 className="card-title">{titles.sourcing || 'Sourcing Outlook'}</h2>
          <p className="card-subtitle">Conversion funnel based on historic recruiter data</p>
        </div>
        <span className="card-badge">Historic Data</span>
      </div>

      <div className="sourcing-layout">
        {/* Funnel */}
        <div className="funnel-wrap">
          {sourcingFunnelData.map((stage, i) => {
            const widthPct = Math.max((stage.count / max) * 100, 18)
            return (
              <div key={stage.stage} className="funnel-row">
                <div className="funnel-label-left">
                  <span className="funnel-step">0{i + 1}</span>
                  <span className="funnel-stage-name">{stage.stage}</span>
                </div>
                <div className="funnel-bar-track">
                  <div
                    className="funnel-bar-fill"
                    style={{ width: `${widthPct}%`, background: stage.color }}
                  >
                    <span className="funnel-count">{stage.count.toLocaleString()}</span>
                  </div>
                </div>
                <span className="funnel-pct">{stage.pct}%</span>
              </div>
            )
          })}
        </div>

        {/* Stats grid */}
        <div className="sourcing-stats">
          {sourcingStats.map((s) => (
            <div key={s.label} className="sourcing-stat-card">
              <p className="sourcing-stat-value">{s.value}</p>
              <p className="sourcing-stat-label">{s.label}</p>
              <p className="sourcing-stat-note">{s.note}</p>
            </div>
          ))}
        </div>
      </div>

      {sourcingNote && (
        <p className="table-note" style={{ marginTop: 16 }}>* {sourcingNote}</p>
      )}
    </div>
  )
}
