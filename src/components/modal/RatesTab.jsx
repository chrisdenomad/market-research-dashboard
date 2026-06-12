import { Trash2, Plus } from 'lucide-react'

export default function RatesTab({ data, onChange }) {
  const rows = data.salaryBenchmarkData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: ['rangeMin','rangeMax'].includes(field) ? Number(val)||0 : val } : r
    )
    onChange('salaryBenchmarkData', next)
  }

  function addRow() {
    onChange('salaryBenchmarkData', [...rows, { location: '', rangeMin: 0, rangeMax: 0, currency: '', basis: 'Monthly', sources: '' }])
  }

  function removeRow(i) {
    onChange('salaryBenchmarkData', rows.filter((_, idx) => idx !== i))
  }

  return (
    <div className="tab-content">
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Market Rate Benchmark</h3>
          <p className="form-section-desc">Salary ranges per location. Add or remove rows as needed.</p>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">{r.location || `Location ${i + 1}`}</div>
              <button className="row-delete-btn" onClick={() => removeRow(i)}><Trash2 size={14}/></button>
            </div>
            <div className="form-grid-3">
              <div className="form-row">
                <label className="form-label">Location</label>
                <input className="form-input" value={r.location} onChange={(e) => setRow(i, 'location', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Range Min</label>
                <input className="form-input" type="number" value={r.rangeMin} onChange={(e) => setRow(i, 'rangeMin', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Range Max</label>
                <input className="form-input" type="number" value={r.rangeMax} onChange={(e) => setRow(i, 'rangeMax', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Currency</label>
                <input className="form-input" value={r.currency} placeholder="SGD / AUD / USD" onChange={(e) => setRow(i, 'currency', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Basis</label>
                <select className="form-select" value={r.basis} onChange={(e) => setRow(i, 'basis', e.target.value)}>
                  <option>Monthly</option>
                  <option>Yearly</option>
                  <option>Hourly</option>
                  <option>Daily</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Sources</label>
                <input className="form-input" value={r.sources} onChange={(e) => setRow(i, 'sources', e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <button className="add-row-btn" onClick={addRow}>
          <Plus size={14} /> Add Location
        </button>
      </section>
    </div>
  )
}
