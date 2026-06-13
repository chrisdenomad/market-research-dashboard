import { Trash2, Plus } from 'lucide-react'

export default function SourcingTab({ data, onChange }) {
  const funnel = data.sourcingFunnelData || []
  const stats  = data.sourcingStats      || []

  function setFunnelRow(i, field, val) {
    const next = funnel.map((r, idx) =>
      idx === i ? { ...r, [field]: ['count','pct'].includes(field) ? Number(val)||0 : val } : r
    )
    onChange('sourcingFunnelData', next)
  }

  function addFunnelRow() {
    const colors = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe']
    onChange('sourcingFunnelData', [...funnel, { stage: '', count: 0, pct: 0, note: '', color: colors[funnel.length % colors.length] }])
  }

  function removeFunnelRow(i) {
    onChange('sourcingFunnelData', funnel.filter((_, idx) => idx !== i))
  }

  function setStatRow(i, field, val) {
    const next = stats.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    onChange('sourcingStats', next)
  }

  function addStatRow() {
    onChange('sourcingStats', [...stats, { label: '', value: '', note: '' }])
  }

  function removeStatRow(i) {
    onChange('sourcingStats', stats.filter((_, idx) => idx !== i))
  }

  return (
    <div className="tab-content">

      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Conversion Funnel Stages</h3>
          <p className="form-section-desc">Each row is one bar in the funnel chart.</p>
        </div>
        <div className="table-editor">
          <div className="table-editor-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 80px auto' }}>
            <span>Stage Name</span><span>Count</span><span>Pct %</span><span>Note</span><span>Color</span><span></span>
          </div>
          {funnel.map((r, i) => (
            <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 80px auto' }}>
              <input className="form-input" value={r.stage} onChange={(e) => setFunnelRow(i, 'stage', e.target.value)} />
              <input className="form-input" type="number" value={r.count} onChange={(e) => setFunnelRow(i, 'count', e.target.value)} />
              <input className="form-input" type="number" value={r.pct}   onChange={(e) => setFunnelRow(i, 'pct',   e.target.value)} />
              <input className="form-input" value={r.note}  onChange={(e) => setFunnelRow(i, 'note',  e.target.value)} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="color"
                  value={r.color || '#6366f1'}
                  onChange={(e) => setFunnelRow(i, 'color', e.target.value)}
                  style={{ width: 30, height: 30, padding: 2, borderRadius: 4, border: '1px solid var(--border)', cursor: 'pointer', background: 'none' }}
                  title="Pick color"
                />
                <input
                  className="form-input"
                  value={r.color || ''}
                  onChange={(e) => setFunnelRow(i, 'color', e.target.value)}
                  placeholder="#6366f1"
                  style={{ flex: 1, fontSize: 11 }}
                />
              </div>
              <button className="row-delete-btn" onClick={() => removeFunnelRow(i)}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={addFunnelRow}><Plus size={14}/> Add Stage</button>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Sourcing Stat Cards</h3>
          <p className="form-section-desc">The 5 summary stat cards below the funnel.</p>
        </div>
        <div className="table-editor">
          <div className="table-editor-head" style={{ gridTemplateColumns: '1fr 1fr 2fr auto' }}>
            <span>Label</span><span>Value</span><span>Note</span><span></span>
          </div>
          {stats.map((r, i) => (
            <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '1fr 1fr 2fr auto' }}>
              <input className="form-input" value={r.label} onChange={(e) => setStatRow(i, 'label', e.target.value)} />
              <input className="form-input" value={r.value} onChange={(e) => setStatRow(i, 'value', e.target.value)} />
              <input className="form-input" value={r.note}  onChange={(e) => setStatRow(i, 'note',  e.target.value)} />
              <button className="row-delete-btn" onClick={() => removeStatRow(i)}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={addStatRow}><Plus size={14}/> Add Stat</button>
      </section>
    </div>
  )
}
