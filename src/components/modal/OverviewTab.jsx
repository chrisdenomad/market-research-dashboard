// Overview Tab — reportMeta + KPI cards
const TREND_OPTIONS = ['up', 'down', 'neutral']
const ICON_OPTIONS  = ['users', 'userCheck', 'mapPin', 'clock']

function MetaField({ label, value, field, onChange }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
      />
    </div>
  )
}

export default function OverviewTab({ data, onChange }) {
  const meta = data.reportMeta || {}
  const kpis = data.kpiData    || []

  function setMeta(field, val) {
    onChange('reportMeta', { ...meta, [field]: val })
  }

  function setKpi(i, field, val) {
    const next = kpis.map((k, idx) => idx === i ? { ...k, [field]: val } : k)
    onChange('kpiData', next)
  }

  return (
    <div className="tab-content">
      <section className="form-section">
        <h3 className="form-section-title">Report Metadata</h3>
        <MetaField label="Dashboard Title" value={meta.title      || ''} field="title"      onChange={setMeta} />
        <MetaField label="Role"            value={meta.role       || ''} field="role"       onChange={setMeta} />
        <MetaField label="Date"            value={meta.date       || ''} field="date"       onChange={setMeta} />
        <MetaField label="Prepared By"     value={meta.preparedBy || ''} field="preparedBy" onChange={setMeta} />
        <MetaField label="Company"         value={meta.company    || ''} field="company"    onChange={setMeta} />
      </section>

      <section className="form-section">
        <h3 className="form-section-title">KPI Cards</h3>
        {kpis.map((k, i) => (
          <div key={i} className="form-card">
            <div className="form-card-title">KPI {i + 1}</div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Label</label>
                <input className="form-input" value={k.label || ''} onChange={(e) => setKpi(i, 'label', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Value</label>
                <input className="form-input" value={k.value || ''} onChange={(e) => setKpi(i, 'value', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Unit</label>
                <input className="form-input" value={k.unit || ''} onChange={(e) => setKpi(i, 'unit', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Change Text</label>
                <input className="form-input" value={k.change || ''} onChange={(e) => setKpi(i, 'change', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Trend</label>
                <select className="form-select" value={k.trend || 'neutral'} onChange={(e) => setKpi(i, 'trend', e.target.value)}>
                  {TREND_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Icon</label>
                <select className="form-select" value={k.icon || 'users'} onChange={(e) => setKpi(i, 'icon', e.target.value)}>
                  {ICON_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
