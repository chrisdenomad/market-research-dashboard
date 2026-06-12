import { Trash2, Plus } from 'lucide-react'

export default function MarketSizeTab({ data, onChange }) {
  const rows = data.marketSizeData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'city' ? val : Number(val) || 0 } : r
    )
    onChange('marketSizeData', next)
  }

  function addRow() {
    onChange('marketSizeData', [...rows, { city: '', size: 0, available: 0 }])
  }

  function removeRow(i) {
    onChange('marketSizeData', rows.filter((_, idx) => idx !== i))
  }

  return (
    <div className="tab-content">
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Market Size by Location</h3>
          <p className="form-section-desc">Add or remove cities. The bar chart and table update automatically.</p>
        </div>

        <div className="table-editor">
          <div className="table-editor-head">
            <span>City / Location</span>
            <span>Market Size (profiles)</span>
            <span>Candidate Availability</span>
            <span></span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="table-editor-row">
              <input className="form-input" value={r.city} placeholder="e.g. Singapore"
                onChange={(e) => setRow(i, 'city', e.target.value)} />
              <input className="form-input" type="number" value={r.size}
                onChange={(e) => setRow(i, 'size', e.target.value)} />
              <input className="form-input" type="number" value={r.available}
                onChange={(e) => setRow(i, 'available', e.target.value)} />
              <button className="row-delete-btn" onClick={() => removeRow(i)} title="Remove row">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button className="add-row-btn" onClick={addRow}>
          <Plus size={14} /> Add City
        </button>
      </section>
    </div>
  )
}
