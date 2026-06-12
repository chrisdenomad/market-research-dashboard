export default function CapacityTab({ data, onChange }) {
  const rows = data.marketCapacityData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'value' ? Number(val) || 0 : val } : r
    )
    onChange('marketCapacityData', next)
  }

  return (
    <div className="tab-content">
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Market Capacity Funnel</h3>
          <p className="form-section-desc">TAM → SAM → SOM → Target. Edit values and descriptions for the radial chart.</p>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="form-card">
            <div className="form-card-title" style={{ color: r.color }}>{r.label} — {r.fullLabel}</div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Short Label (TAM / SAM…)</label>
                <input className="form-input" value={r.label || ''} onChange={(e) => setRow(i, 'label', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Full Label</label>
                <input className="form-input" value={r.fullLabel || ''} onChange={(e) => setRow(i, 'fullLabel', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Value (count)</label>
                <input className="form-input" type="number" value={r.value || 0} onChange={(e) => setRow(i, 'value', e.target.value)} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={r.description || ''} onChange={(e) => setRow(i, 'description', e.target.value)} />
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
