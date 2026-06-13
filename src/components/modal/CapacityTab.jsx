import { Trash2, Plus } from 'lucide-react'

export default function CapacityTab({ data, onChange }) {
  const rows = data.marketCapacityData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'value' ? Number(val) || 0 : val } : r
    )
    onChange('marketCapacityData', next)
  }

  function addRow() {
    const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#4f46e5']
    const newRow = {
      label: '',
      fullLabel: '',
      value: 0,
      description: '',
      color: colors[rows.length % colors.length],
    }
    onChange('marketCapacityData', [...rows, newRow])
  }

  function removeRow(i) {
    onChange('marketCapacityData', rows.filter((_, idx) => idx !== i))
  }

  return (
    <div className="tab-content">
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Market Capacity Funnel</h3>
          <p className="form-section-desc">TAM → SAM → SOM → Target. Edit values, descriptions, and colors for the radial chart.</p>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="form-card" style={{ borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="form-card-title" style={{ color: r.color }}>{r.label || `Tier ${i + 1}`} — {r.fullLabel}</span>
              <button className="row-delete-btn" onClick={() => removeRow(i)} title="Remove tier">
                <Trash2 size={14} />
              </button>
            </div>
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
              <div className="form-row">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={r.color || '#6366f1'}
                    onChange={(e) => setRow(i, 'color', e.target.value)}
                    style={{ width: 36, height: 34, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'none' }}
                    title="Pick color"
                  />
                  <input
                    className="form-input"
                    value={r.color || ''}
                    onChange={(e) => setRow(i, 'color', e.target.value)}
                    placeholder="#6366f1"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={r.description || ''} onChange={(e) => setRow(i, 'description', e.target.value)} />
            </div>
          </div>
        ))}

        <button className="add-row-btn" onClick={addRow}><Plus size={14} /> Add Tier</button>
      </section>
    </div>
  )
}

