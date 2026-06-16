import { useData } from '../context/DataContext'
import { AlertCircle } from 'lucide-react'

export default function SearchMethodology() {
  const { data } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('methodology')) return null
  const methodologyData = data.methodologyData || { criteria: [], sources: [], disclaimers: [] }
  const titles = data.widgetTitles || {}
  return (
    <div className="card" id="methodology">
      <div className="card-header">
        <div>
          <h2 className="card-title">{titles.methodology || 'Search Methodology'}</h2>
          <p className="card-subtitle">Data sources, search criteria, and confidence levels</p>
        </div>
        <span className="card-badge">Transparency</span>
      </div>

      <div className="methodology-layout">
        {/* Search Criteria */}
        <div className="methodology-section">
          <h3 className="methodology-heading">Search Criteria</h3>
          <div className="criteria-list">
            {methodologyData.criteria.map((c) => (
              <div key={c.label} className="criteria-row">
                <span className="criteria-label">{c.label}</span>
                <span className="criteria-value">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources with confidence bars */}
        <div className="methodology-section">
          <h3 className="methodology-heading">Data Sources & Confidence</h3>
          <div className="sources-list">
            {methodologyData.sources.map((src) => (
              <div key={src.name} className="source-item">
                <div className="source-top">
                  <span className="source-name">{src.name}</span>
                  <span className="source-confidence">{src.confidence}%</span>
                </div>
                <div className="source-bar-bg">
                  <div
                    className="source-bar-fill"
                    style={{ width: `${src.confidence}%` }}
                  />
                </div>
                <div className="source-bottom">
                  <span className="source-note">{src.note}</span>
                  {src.sampleSize && (
                    <span className="badge badge-blue">n = {src.sampleSize.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="disclaimer-box">
        <div className="disclaimer-header">
          <AlertCircle size={16} />
          <span>Important Remarks</span>
        </div>
        <ul className="disclaimer-list">
          {methodologyData.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
