import { Trash2, Plus } from 'lucide-react'

export default function MethodologyTab({ data, onChange }) {
  const method      = data.methodologyData || {}
  const criteria    = method.criteria    || []
  const sources     = method.sources     || []
  const disclaimers = method.disclaimers || []

  function patch(field, val) {
    onChange('methodologyData', { ...method, [field]: val })
  }

  // Criteria
  function setCriteria(i, field, val) {
    const next = criteria.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    patch('criteria', next)
  }
  function addCriteria() { patch('criteria', [...criteria, { label: '', value: '' }]) }
  function removeCriteria(i) { patch('criteria', criteria.filter((_, idx) => idx !== i)) }

  // Sources
  function setSource(i, field, val) {
    const next = sources.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'confidence' ? Number(val)||0 : val } : r
    )
    patch('sources', next)
  }
  function addSource() { patch('sources', [...sources, { name: '', confidence: 80, sampleSize: null, note: '' }]) }
  function removeSource(i) { patch('sources', sources.filter((_, idx) => idx !== i)) }

  // Disclaimers
  function setDisclaimer(i, val) {
    const next = disclaimers.map((d, idx) => idx === i ? val : d)
    patch('disclaimers', next)
  }
  function addDisclaimer() { patch('disclaimers', [...disclaimers, '']) }
  function removeDisclaimer(i) { patch('disclaimers', disclaimers.filter((_, idx) => idx !== i)) }

  return (
    <div className="tab-content">

      {/* Search Criteria */}
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Search Criteria</h3>
          <p className="form-section-desc">Role, platform, location, exclusions, experience requirements.</p>
        </div>
        <div className="table-editor">
          <div className="table-editor-head" style={{ gridTemplateColumns: '1fr 2fr auto' }}>
            <span>Label</span><span>Value</span><span></span>
          </div>
          {criteria.map((r, i) => (
            <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '1fr 2fr auto' }}>
              <input className="form-input" value={r.label} placeholder="e.g. Role" onChange={(e) => setCriteria(i, 'label', e.target.value)} />
              <input className="form-input" value={r.value} placeholder="e.g. Security Champion" onChange={(e) => setCriteria(i, 'value', e.target.value)} />
              <button className="row-delete-btn" onClick={() => removeCriteria(i)}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={addCriteria}><Plus size={14}/> Add Criterion</button>
      </section>

      {/* Data Sources */}
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Data Sources & Confidence</h3>
          <p className="form-section-desc">Each source shows a confidence bar. Confidence is 0–100.</p>
        </div>
        {sources.map((r, i) => (
          <div key={i} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">{r.name || `Source ${i + 1}`}</div>
              <button className="row-delete-btn" onClick={() => removeSource(i)}><Trash2 size={14}/></button>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Source Name</label>
                <input className="form-input" value={r.name} onChange={(e) => setSource(i, 'name', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Confidence % (0–100)</label>
                <input className="form-input" type="number" min={0} max={100} value={r.confidence} onChange={(e) => setSource(i, 'confidence', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Sample Size (optional)</label>
                <input className="form-input" type="number" value={r.sampleSize ?? ''} placeholder="leave blank if N/A" onChange={(e) => setSource(i, 'sampleSize', e.target.value === '' ? null : e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Note</label>
                <input className="form-input" value={r.note} onChange={(e) => setSource(i, 'note', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button className="add-row-btn" onClick={addSource}><Plus size={14}/> Add Source</button>
      </section>

      {/* Disclaimers */}
      <section className="form-section">
        <div className="form-section-header">
          <h3 className="form-section-title">Important Remarks / Disclaimers</h3>
          <p className="form-section-desc">Each line appears as a bullet point in the disclaimer panel.</p>
        </div>
        {disclaimers.map((d, i) => (
          <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '1fr auto', marginBottom: 8 }}>
            <textarea className="form-textarea" value={d} rows={2}
              onChange={(e) => setDisclaimer(i, e.target.value)} />
            <button className="row-delete-btn" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => removeDisclaimer(i)}><Trash2 size={14}/></button>
          </div>
        ))}
        <button className="add-row-btn" onClick={addDisclaimer}><Plus size={14}/> Add Remark</button>
      </section>

    </div>
  )
}
