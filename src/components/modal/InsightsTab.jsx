import { Trash2, Plus } from 'lucide-react'

const TAG_OPTIONS = ['Opportunity', 'Risk', 'Trend', 'Watch', 'Note']

export default function InsightsTab({ data, onChange }) {
  const rows = data.keyInsightsData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    onChange('keyInsightsData', next)
  }

  function addRow() {
    onChange('keyInsightsData', [...rows, { tag: 'Note', title: '', body: '' }])
  }

  function removeRow(i) {
    onChange('keyInsightsData', rows.filter((_, idx) => idx !== i))
  }

  return (
    <div className="tab-content">
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Key Insights</h3>
          <p className="form-section-desc">Each card appears in the Key Insights grid. Add, edit or remove insights freely.</p>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">Insight {i + 1}</div>
              <button className="row-delete-btn" onClick={() => removeRow(i)} title="Remove insight">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Tag</label>
                <select className="form-select" value={r.tag || 'Note'} onChange={(e) => setRow(i, 'tag', e.target.value)}>
                  {TAG_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Title</label>
                <input className="form-input" value={r.title || ''} onChange={(e) => setRow(i, 'title', e.target.value)} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <label className="form-label">Body</label>
              <textarea className="form-textarea" value={r.body || ''} onChange={(e) => setRow(i, 'body', e.target.value)} rows={3} />
            </div>
          </div>
        ))}

        <button className="add-row-btn" onClick={addRow}>
          <Plus size={14} /> Add Insight
        </button>
      </section>
    </div>
  )
}
