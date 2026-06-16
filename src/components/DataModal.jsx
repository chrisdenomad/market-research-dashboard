import { useState, useRef } from 'react'
import { X, Upload, Download, RotateCcw, Check, ChevronDown, ChevronRight, Trash2, Plus, Search } from 'lucide-react'
import { useData } from '../context/DataContext'
import { parseExcelFile } from '../hooks/useExcelImport'
import { downloadExcelTemplate } from '../utils/excelTemplate'

// ── Constants ────────────────────────────────────────────────────────────────
const TREND_OPTIONS = ['up', 'down', 'neutral']
const ICON_OPTIONS  = ['users', 'userCheck', 'mapPin', 'clock']
const TAG_OPTIONS   = ['Opportunity', 'Risk', 'Trend', 'Watch', 'Note']
const ZONE_OPTIONS  = ['Southeast Asia', 'East Asia', 'South Asia', 'Oceania', 'Other']
const BASIS_OPTIONS = ['Monthly', 'Yearly', 'Hourly', 'Daily']

// APAC country quick-fill lookup
const COUNTRY_LOOKUP = [
  { name: 'Vietnam',       code: '704', lat:  21.0285, lng: 105.8542, zone: 'Southeast Asia' },
  { name: 'Singapore',     code: '702', lat:   1.3521, lng: 103.8198, zone: 'Southeast Asia' },
  { name: 'Thailand',      code: '764', lat:  13.7563, lng: 100.5018, zone: 'Southeast Asia' },
  { name: 'Indonesia',     code: '360', lat:  -6.2088, lng: 106.8456, zone: 'Southeast Asia' },
  { name: 'Malaysia',      code: '458', lat:   3.1390, lng: 101.6869, zone: 'Southeast Asia' },
  { name: 'Philippines',   code: '608', lat:  14.5995, lng: 120.9842, zone: 'Southeast Asia' },
  { name: 'Myanmar',       code: '104', lat:  16.8661, lng:  96.1951, zone: 'Southeast Asia' },
  { name: 'Cambodia',      code: '116', lat:  11.5564, lng: 104.9282, zone: 'Southeast Asia' },
  { name: 'China',         code: '156', lat:  39.9042, lng: 116.4074, zone: 'East Asia'      },
  { name: 'Japan',         code: '392', lat:  35.6762, lng: 139.6503, zone: 'East Asia'      },
  { name: 'South Korea',   code: '410', lat:  37.5665, lng: 126.9780, zone: 'East Asia'      },
  { name: 'Taiwan',        code: '158', lat:  25.0330, lng: 121.5654, zone: 'East Asia'      },
  { name: 'Hong Kong SAR', code: '344', lat:  22.3193, lng: 114.1694, zone: 'East Asia'      },
  { name: 'India',         code: '356', lat:  28.6139, lng:  77.2090, zone: 'South Asia'     },
  { name: 'Australia',     code: '036', lat: -33.8688, lng: 151.2093, zone: 'Oceania'        },
  { name: 'New Zealand',   code: '554', lat: -36.8485, lng: 174.7633, zone: 'Oceania'        },
]

function CountryLookupPanel({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = COUNTRY_LOOKUP.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="geo-lookup-panel">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          className="form-input"
          placeholder="Search country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ flex: 1 }}
        />
      </div>
      <div className="geo-lookup-table-wrap">
        <table className="geo-lookup-table">
          <thead>
            <tr>
              <th>Country</th><th>ISO Code</th><th>Lat</th><th>Lng</th><th>Zone</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code}>
                <td>{c.name}</td>
                <td><code>{c.code}</code></td>
                <td>{c.lat}</td>
                <td>{c.lng}</td>
                <td>{c.zone}</td>
                <td>
                  <button type="button" className="geo-lookup-use-btn"
                    onClick={() => { onSelect(c); onClose() }}>
                    Use
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>No match</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '5px 0 0', fontSize: 10, color: 'var(--text-muted)' }}>
        "Use" fills Country, ISO Code, Lat, Lng and Zone into this region.
      </p>
    </div>
  )
}

const SECTIONS = [
  { id: 'report',      label: 'Report & Metrics',   desc: 'Title, role, date, and key metric cards'          },
  { id: 'marketsize',  label: 'Market Size',         desc: 'Candidate supply & availability by city'          },
  { id: 'capacity',    label: 'Capacity Funnel',     desc: 'TAM → SAM → SOM → Target pipeline'               },
  { id: 'sourcing',    label: 'Sourcing Outlook',    desc: 'Conversion funnel stages & sourcing stats'        },
  { id: 'insights',    label: 'Key Insights',        desc: 'Opportunity, risk, trend, and note cards'         },
  { id: 'rates',       label: 'Salary Benchmark',    desc: 'Market rate ranges per location'                  },
  { id: 'geo',         label: 'Geographic Data',     desc: 'City nodes, map coordinates, and supply trend'    },
  { id: 'methodology', label: 'Methodology',         desc: 'Search criteria, data sources, and disclaimers'   },
]

// ── Accordion wrapper ────────────────────────────────────────────────────────
function AccordionSection({ id, label, desc, open, onToggle, children }) {
  return (
    <div className={`accordion-section ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => onToggle(id)}>
        <div className="accordion-header-left">
          <span className="accordion-chevron">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          <span className="accordion-label">{label}</span>
          <span className="accordion-desc">{desc}</span>
        </div>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  )
}

// Map data keys → section ids so patch() can auto-mark sections as edited
const KEY_TO_SECTION = {
  reportMeta: 'report', widgetTitles: 'report', kpiData: 'report',
  marketSizeData: 'marketsize',
  marketCapacityData: 'capacity',
  sourcingFunnelData: 'sourcing', sourcingStats: 'sourcing',
  keyInsightsData: 'insights',
  salaryBenchmarkData: 'rates',
  geoRegions: 'geo', geoTrendData: 'geo', countryBounds: 'geo',
  methodologyData: 'methodology',
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function DataModal({ onClose, initialSection }) {
  const { data, applyData, resetData } = useData()
  const [formData, setFormData]   = useState(() => JSON.parse(JSON.stringify(data)))
  const [openSections, setOpen]   = useState(() => ({
    report: !initialSection || initialSection === 'report',
    ...(initialSection && initialSection !== 'report' ? { [initialSection]: true } : {}),
  }))
  // Track which sections the user has explicitly edited / opened for editing
  const [editedSections, setEditedSections] = useState(() => new Set(data.providedSections || []))
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const fileRef = useRef()

  function patch(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    // Auto-mark the section as edited whenever any field changes
    const sectionId = KEY_TO_SECTION[key]
    if (sectionId) markEdited(sectionId)
  }

  function patchBatch(patches) {
    setFormData((prev) => ({ ...prev, ...patches }))
    // Mark all affected sections
    Object.keys(patches).forEach((key) => {
      const sectionId = KEY_TO_SECTION[key]
      if (sectionId) markEdited(sectionId)
    })
  }

  function toggleSection(id) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
    // Mark as edited when the user opens a section (they can see and intend to use it)
    markEdited(id)
  }

  // Mark a section as explicitly edited by the user
  function markEdited(sectionId) {
    setEditedSections((prev) => new Set([...prev, sectionId]))
  }

  function expandAll()   { setOpen(Object.fromEntries(SECTIONS.map((s) => [s.id, true]))) }
  function collapseAll() { setOpen({}) }

  function handleApply() {
    const sections = [...editedSections]
    applyData(formData, sections)
    onClose()
  }

  function handleReset() {
    resetData()
    onClose()
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    try {
      const parsed = await parseExcelFile(file)

      // Determine which sections the Excel file contained — do this BEFORE setFormData
      const importedSections = []
      if (parsed.reportMeta || parsed.kpiData)                                                       importedSections.push('report')
      if (parsed.marketSizeData)                                                                      importedSections.push('marketsize')
      if (parsed.marketCapacityData)                                                                  importedSections.push('capacity')
      if (parsed.sourcingFunnelData || parsed.sourcingStats)                                         importedSections.push('sourcing')
      if (parsed.salaryBenchmarkData)                                                                 importedSections.push('rates')
      if (parsed.keyInsightsData)                                                                     importedSections.push('insights')
      if (parsed.geoRegions || parsed.geoTrendData)                                                  importedSections.push('geo')
      if (parsed.methodologyCriteria || parsed.methodologySources || parsed.disclaimers)             importedSections.push('methodology')

      setFormData((prev) => {
        const next = { ...prev }
        if (parsed.reportMeta)          next.reportMeta          = parsed.reportMeta
        if (parsed.kpiData)             next.kpiData             = parsed.kpiData
        if (parsed.marketSizeData)      next.marketSizeData      = parsed.marketSizeData
        if (parsed.marketCapacityData)  next.marketCapacityData  = parsed.marketCapacityData
        if (parsed.sourcingFunnelData)  next.sourcingFunnelData  = parsed.sourcingFunnelData
        if (parsed.sourcingStats)       next.sourcingStats       = parsed.sourcingStats
        if (parsed.salaryBenchmarkData) next.salaryBenchmarkData = parsed.salaryBenchmarkData
        if (parsed.keyInsightsData)     next.keyInsightsData     = parsed.keyInsightsData
        if (parsed.geoRegions)          next.geoRegions          = parsed.geoRegions
        if (parsed.geoTrendData)        next.geoTrendData        = parsed.geoTrendData
        if (parsed.methodologyCriteria || parsed.methodologySources || parsed.disclaimers) {
          next.methodologyData = {
            criteria:    parsed.methodologyCriteria ?? prev.methodologyData?.criteria    ?? [],
            sources:     parsed.methodologySources  ?? prev.methodologyData?.sources     ?? [],
            disclaimers: parsed.disclaimers         ?? prev.methodologyData?.disclaimers ?? [],
          }
        }
        return next
      })

      // Mark all imported sections as edited so Apply will include them
      setEditedSections((prev) => new Set([...prev, ...importedSections]))
      setImportMsg({ type: 'success', text: `"${file.name}" imported — review and click Apply.` })
    } catch (err) {
      setImportMsg({ type: 'error', text: `Import failed: ${err.message}` })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container modal-container-wide">

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 className="modal-title">Master Data Input</h2>
            <p className="modal-subtitle">All dashboard data in one place. Expand sections to edit, then Apply.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="accordion-expand-btn" onClick={expandAll}>Expand all</button>
            <button className="accordion-expand-btn" onClick={collapseAll}>Collapse all</button>
            <button className="modal-close" onClick={onClose} title="Close"><X size={20} /></button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="modal-toolbar">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button className="modal-btn modal-btn-primary" onClick={() => fileRef.current.click()} disabled={importing}>
            <Upload size={14} />{importing ? 'Importing…' : 'Upload Excel'}
          </button>
          <button className="modal-btn modal-btn-secondary" onClick={() => downloadExcelTemplate(formData)}>
            <Download size={14} />Download Template
          </button>
          {importMsg && (
            <span className={`import-msg import-msg-${importMsg.type}`}>{importMsg.text}</span>
          )}
        </div>

        {/* ── Accordion body ── */}
        <div className="modal-body">
          <div className="accordion-list">

            {/* ── 1. Report & Metrics ── */}
            <AccordionSection {...SECTIONS[0]} open={!!openSections.report} onToggle={toggleSection}>
              <ReportSection formData={formData} patch={patch} />
            </AccordionSection>

            {/* ── 2. Market Size ── */}
            <AccordionSection {...SECTIONS[1]} open={!!openSections.marketsize} onToggle={toggleSection}>
              <MarketSizeSection formData={formData} patch={patch} />
            </AccordionSection>

            {/* ── 3. Capacity Funnel ── */}
            <AccordionSection {...SECTIONS[2]} open={!!openSections.capacity} onToggle={toggleSection}>
              <CapacitySection formData={formData} patch={patch} />
            </AccordionSection>

            {/* ── 4. Sourcing ── */}
            <AccordionSection {...SECTIONS[3]} open={!!openSections.sourcing} onToggle={toggleSection}>
              <SourcingSection formData={formData} patch={patch} />
            </AccordionSection>

            {/* ── 5. Key Insights ── */}
            <AccordionSection {...SECTIONS[4]} open={!!openSections.insights} onToggle={toggleSection}>
              <InsightsSection formData={formData} patch={patch} />
            </AccordionSection>

            {/* ── 6. Salary Benchmark ── */}
            <AccordionSection {...SECTIONS[5]} open={!!openSections.rates} onToggle={toggleSection}>
              <RatesSection formData={formData} patch={patch} />
            </AccordionSection>

            {/* ── 7. Geographic ── */}
            <AccordionSection {...SECTIONS[6]} open={!!openSections.geo} onToggle={toggleSection}>
              <GeoSection formData={formData} patch={patch} patchBatch={patchBatch} />
            </AccordionSection>

            {/* ── 8. Methodology ── */}
            <AccordionSection {...SECTIONS[7]} open={!!openSections.methodology} onToggle={toggleSection}>
              <MethodologySection formData={formData} patch={patch} />
            </AccordionSection>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="modal-btn modal-btn-danger" onClick={handleReset}>
            <RotateCcw size={14} />Reset to Defaults
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-btn modal-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="modal-btn modal-btn-apply" onClick={handleApply}>
              <Check size={14} />Apply Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── 1. Report & Metrics ──────────────────────────────────────────────────────
function ReportSection({ formData, patch }) {
  const meta   = formData.reportMeta   || {}
  const kpis   = formData.kpiData      || []
  const titles = formData.widgetTitles || {}

  function setMeta(field, val) {
    patch('reportMeta', { ...meta, [field]: val })
  }

  function setTitle(key, val) {
    patch('widgetTitles', { ...titles, [key]: val })
  }

  function setKpi(i, field, val) {
    const next = kpis.map((k, idx) => idx === i ? { ...k, [field]: val } : k)
    patch('kpiData', next)
  }

  const TITLE_FIELDS = [
    { key: 'aiOverview',      label: 'AI Overview'            },
    { key: 'marketSize',      label: 'Market Size'            },
    { key: 'marketCapacity',  label: 'Market Capacity'        },
    { key: 'geoDistribution', label: 'Geographic Distribution'},
    { key: 'sourcing',        label: 'Sourcing Outlook'       },
    { key: 'keyInsights',     label: 'Key Insights'           },
    { key: 'benchmark',       label: 'Rate Benchmark'         },
    { key: 'methodology',     label: 'Methodology'            },
  ]

  return (
    <div className="section-content">
      <div className="sub-section">
        <p className="sub-section-title">Report Metadata</p>
        <div className="form-grid-2">
          {[
            { label: 'Dashboard Title', field: 'title' },
            { label: 'Role',            field: 'role'  },
            { label: 'Date',            field: 'date'  },
            { label: 'Prepared By',     field: 'preparedBy' },
            { label: 'Company',         field: 'company' },
          ].map(({ label, field }) => (
            <div key={field} className="form-row">
              <label className="form-label">{label}</label>
              <input className="form-input" value={meta[field] || ''} onChange={(e) => setMeta(field, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="sub-section">
        <p className="sub-section-title">Widget Titles</p>
        <div className="form-grid-2">
          {TITLE_FIELDS.map(({ key, label }) => (
            <div key={key} className="form-row">
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                value={titles[key] ?? ''}
                onChange={(e) => setTitle(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sub-section">
        <p className="sub-section-title">Metric Cards</p>
        <div className="form-grid-2">
          {kpis.map((k, i) => (
            <div key={i} className="form-card">
              <div className="form-card-title">Metric {i + 1}</div>
              <div className="form-row">
                <label className="form-label">Label</label>
                <input className="form-input" value={k.label || ''} onChange={(e) => setKpi(i, 'label', e.target.value)} />
              </div>
              <div className="form-grid-2">
                <div className="form-row">
                  <label className="form-label">Value</label>
                  <input className="form-input" value={k.value || ''} onChange={(e) => setKpi(i, 'value', e.target.value)} />
                </div>
                <div className="form-row">
                  <label className="form-label">Unit</label>
                  <input className="form-input" value={k.unit || ''} onChange={(e) => setKpi(i, 'unit', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">Change Text</label>
                <input className="form-input" value={k.change || ''} onChange={(e) => setKpi(i, 'change', e.target.value)} />
              </div>
              <div className="form-grid-2">
                <div className="form-row">
                  <label className="form-label">Trend</label>
                  <select className="form-input" value={k.trend || 'neutral'} onChange={(e) => setKpi(i, 'trend', e.target.value)}>
                    {TREND_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">Icon</label>
                  <select className="form-input" value={k.icon || 'users'} onChange={(e) => setKpi(i, 'icon', e.target.value)}>
                    {ICON_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 2. Market Size ────────────────────────────────────────────────────────────
function MarketSizeSection({ formData, patch }) {
  const rows = formData.marketSizeData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'city' ? val : Number(val) || 0 } : r
    )
    patch('marketSizeData', next)
  }

  return (
    <div className="section-content">
      <p className="section-hint">These cities power the bar chart. Editing them also syncs supply/available in the Geographic section.</p>
      <div className="table-editor">
        <div className="table-editor-head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr auto' }}>
          <span>City / Location</span><span>Market Size (profiles)</span><span>Candidate Availability</span><span></span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr auto' }}>
            <input className="form-input" value={r.city} placeholder="e.g. Singapore"
              onChange={(e) => setRow(i, 'city', e.target.value)} />
            <input className="form-input" type="number" value={r.size}
              onChange={(e) => setRow(i, 'size', e.target.value)} />
            <input className="form-input" type="number" value={r.available}
              onChange={(e) => setRow(i, 'available', e.target.value)} />
            <button className="row-delete-btn" onClick={() => patch('marketSizeData', rows.filter((_, idx) => idx !== i))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => patch('marketSizeData', [...rows, { city: '', size: 0, available: 0 }])}>
        <Plus size={14} /> Add City
      </button>
    </div>
  )
}

// ── 3. Capacity Funnel ────────────────────────────────────────────────────────
function CapacitySection({ formData, patch }) {
  const rows = formData.marketCapacityData || []

  function setRow(i, field, val) {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'value' ? Number(val) || 0 : val } : r
    )
    patch('marketCapacityData', next)
  }

  const fallbackColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#4f46e5']

  return (
    <div className="section-content">
      <div className="form-grid-2">
        {rows.map((r, i) => (
          <div key={i} className="form-card" style={{ borderLeft: `3px solid ${r.color || fallbackColors[i % fallbackColors.length]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-card-title" style={{ color: r.color }}>{r.label || `Tier ${i + 1}`}</span>
              <button className="row-delete-btn" onClick={() => patch('marketCapacityData', rows.filter((_, idx) => idx !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="form-row">
              <label className="form-label">Short Label</label>
              <input className="form-input" value={r.label || ''} placeholder="TAM" onChange={(e) => setRow(i, 'label', e.target.value)} />
            </div>
            <div className="form-row">
              <label className="form-label">Full Label</label>
              <input className="form-input" value={r.fullLabel || ''} placeholder="Total Addressable Market" onChange={(e) => setRow(i, 'fullLabel', e.target.value)} />
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Value</label>
                <input className="form-input" type="number" value={r.value || 0} onChange={(e) => setRow(i, 'value', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={r.color || '#6366f1'} onChange={(e) => setRow(i, 'color', e.target.value)}
                    style={{ width: 34, height: 32, padding: 2, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', background: 'none' }} />
                  <input className="form-input" value={r.color || ''} onChange={(e) => setRow(i, 'color', e.target.value)} placeholder="#6366f1" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={r.description || ''} onChange={(e) => setRow(i, 'description', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => patch('marketCapacityData', [...rows, { label: '', fullLabel: '', value: 0, description: '', color: fallbackColors[rows.length % fallbackColors.length] }])}>
        <Plus size={14} /> Add Tier
      </button>
    </div>
  )
}

// ── 4. Sourcing ───────────────────────────────────────────────────────────────
function SourcingSection({ formData, patch }) {
  const funnel = formData.sourcingFunnelData || []
  const stats  = formData.sourcingStats      || []
  const funnelColors = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe']

  function setFunnelRow(i, field, val) {
    const next = funnel.map((r, idx) =>
      idx === i ? { ...r, [field]: ['count','pct'].includes(field) ? Number(val) || 0 : val } : r
    )
    patch('sourcingFunnelData', next)
  }

  function setStatRow(i, field, val) {
    const next = stats.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    patch('sourcingStats', next)
  }

  return (
    <div className="section-content">
      <div className="sub-section">
        <p className="sub-section-title">Conversion Funnel Stages</p>
        <div className="table-editor">
          <div className="table-editor-head" style={{ gridTemplateColumns: '2fr 80px 70px 2fr 90px auto' }}>
            <span>Stage Name</span><span>Count</span><span>Pct %</span><span>Note</span><span>Color</span><span></span>
          </div>
          {funnel.map((r, i) => (
            <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '2fr 80px 70px 2fr 90px auto' }}>
              <input className="form-input" value={r.stage} onChange={(e) => setFunnelRow(i, 'stage', e.target.value)} />
              <input className="form-input" type="number" value={r.count} onChange={(e) => setFunnelRow(i, 'count', e.target.value)} />
              <input className="form-input" type="number" value={r.pct} onChange={(e) => setFunnelRow(i, 'pct', e.target.value)} />
              <input className="form-input" value={r.note} onChange={(e) => setFunnelRow(i, 'note', e.target.value)} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="color" value={r.color || '#6366f1'} onChange={(e) => setFunnelRow(i, 'color', e.target.value)}
                  style={{ width: 28, height: 28, padding: 2, borderRadius: 4, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', flexShrink: 0 }} />
                <input className="form-input" value={r.color || ''} onChange={(e) => setFunnelRow(i, 'color', e.target.value)} style={{ fontSize: 11 }} />
              </div>
              <button className="row-delete-btn" onClick={() => patch('sourcingFunnelData', funnel.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={() => patch('sourcingFunnelData', [...funnel, { stage: '', count: 0, pct: 0, note: '', color: funnelColors[funnel.length % funnelColors.length] }])}>
          <Plus size={14} /> Add Stage
        </button>
      </div>

      <div className="sub-section">
        <p className="sub-section-title">Sourcing Stat Cards</p>
        <div className="table-editor">
          <div className="table-editor-head" style={{ gridTemplateColumns: '1fr 1fr 2fr auto' }}>
            <span>Label</span><span>Value</span><span>Note</span><span></span>
          </div>
          {stats.map((r, i) => (
            <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '1fr 1fr 2fr auto' }}>
              <input className="form-input" value={r.label} onChange={(e) => setStatRow(i, 'label', e.target.value)} />
              <input className="form-input" value={r.value} onChange={(e) => setStatRow(i, 'value', e.target.value)} />
              <input className="form-input" value={r.note}  onChange={(e) => setStatRow(i, 'note',  e.target.value)} />
              <button className="row-delete-btn" onClick={() => patch('sourcingStats', stats.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={() => patch('sourcingStats', [...stats, { label: '', value: '', note: '' }])}>
          <Plus size={14} /> Add Stat
        </button>
      </div>
    </div>
  )
}

// ── 5. Key Insights ───────────────────────────────────────────────────────────
function InsightsSection({ formData, patch }) {
  const rows = formData.keyInsightsData || []

  function setRow(i, field, val) {
    patch('keyInsightsData', rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  return (
    <div className="section-content">
      <div className="form-grid-2">
        {rows.map((r, i) => (
          <div key={i} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">Insight {i + 1}</div>
              <button className="row-delete-btn" onClick={() => patch('keyInsightsData', rows.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Tag</label>
                <select className="form-input" value={r.tag || 'Note'} onChange={(e) => setRow(i, 'tag', e.target.value)}>
                  {TAG_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Title</label>
                <input className="form-input" value={r.title || ''} onChange={(e) => setRow(i, 'title', e.target.value)} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 4 }}>
              <label className="form-label">Body</label>
              <textarea className="form-textarea" value={r.body || ''} rows={3} onChange={(e) => setRow(i, 'body', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => patch('keyInsightsData', [...rows, { tag: 'Note', title: '', body: '' }])}>
        <Plus size={14} /> Add Insight
      </button>
    </div>
  )
}

// ── 6. Salary Benchmark ───────────────────────────────────────────────────────
function RatesSection({ formData, patch }) {
  const rows = formData.salaryBenchmarkData || []

  function setRow(i, field, val) {
    patch('salaryBenchmarkData', rows.map((r, idx) =>
      idx === i ? { ...r, [field]: ['rangeMin','rangeMax'].includes(field) ? Number(val) || 0 : val } : r
    ))
  }

  return (
    <div className="section-content">
      <div className="form-grid-2">
        {rows.map((r, i) => (
          <div key={i} className="form-card">
            <div className="form-card-header">
              <div className="form-card-title">{r.location || `Location ${i + 1}`}</div>
              <button className="row-delete-btn" onClick={() => patch('salaryBenchmarkData', rows.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Location</label>
                <input className="form-input" value={r.location || ''} onChange={(e) => setRow(i, 'location', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Currency</label>
                <input className="form-input" value={r.currency || ''} placeholder="SGD / AUD / USD" onChange={(e) => setRow(i, 'currency', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Range Min</label>
                <input className="form-input" type="number" value={r.rangeMin || 0} onChange={(e) => setRow(i, 'rangeMin', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Range Max</label>
                <input className="form-input" type="number" value={r.rangeMax || 0} onChange={(e) => setRow(i, 'rangeMax', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Basis</label>
                <select className="form-input" value={r.basis || 'Monthly'} onChange={(e) => setRow(i, 'basis', e.target.value)}>
                  {BASIS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Sources</label>
                <input className="form-input" value={r.sources || ''} onChange={(e) => setRow(i, 'sources', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="add-row-btn" onClick={() => patch('salaryBenchmarkData', [...rows, { location: '', rangeMin: 0, rangeMax: 0, currency: '', basis: 'Monthly', sources: '' }])}>
        <Plus size={14} /> Add Location
      </button>
    </div>
  )
}

// ── 7. Geographic ─────────────────────────────────────────────────────────────
function GeoSection({ formData, patch, patchBatch }) {
  const regions   = formData.geoRegions   || []
  const trendData = formData.geoTrendData || []
  const geoColors = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#7c3aed','#4f46e5','#818cf8','#6d28d9']
  const [lookupIdx, setLookupIdx] = useState(null)

  function fillFromLookup(i, entry) {
    patch('geoRegions', regions.map((r, idx) =>
      idx === i
        ? { ...r, country: entry.name, countryCode: entry.code, lat: entry.lat, lng: entry.lng, zone: entry.zone }
        : r
    ))
    setLookupIdx(null)
  }

  function setRegionField(i, field, val) {
    const numFields = ['supply', 'available', 'lat', 'lng', 'yoyChange', 'marketShare']
    if (field === 'id') {
      const oldId = regions[i].id
      const nextRegions = regions.map((r, idx) => idx === i ? { ...r, id: val } : r)
      const nextTrend = trendData.map((row) => {
        const { [oldId]: colVal, ...rest } = row
        return { ...rest, [val]: colVal ?? 0 }
      })
      patchBatch({ geoRegions: nextRegions, geoTrendData: nextTrend })
      return
    }
    patch('geoRegions', regions.map((r, idx) =>
      idx === i ? { ...r, [field]: numFields.includes(field) ? (Number(val) || 0) : val } : r
    ))
  }

  function addRegion() {
    const newId = `city${regions.length + 1}`
    const newRegion = { id: newId, name: '', country: '', countryCode: '', zone: 'Southeast Asia', supply: 0, available: 0, lat: 0, lng: 0, color: geoColors[regions.length % geoColors.length], yoyChange: 0, marketShare: 0 }
    patchBatch({ geoRegions: [...regions, newRegion], geoTrendData: trendData.map((row) => ({ ...row, [newId]: 0 })) })
  }

  function removeRegion(i) {
    const removed = regions[i]
    patchBatch({
      geoRegions: regions.filter((_, idx) => idx !== i),
      geoTrendData: trendData.map((row) => { const { [removed.id]: _drop, ...rest } = row; return rest }),
    })
  }

  function setTrendCell(rowIdx, regionId, val) {
    patch('geoTrendData', trendData.map((row, i) => i === rowIdx ? { ...row, [regionId]: Number(val) || 0 } : row))
  }

  function addTrendMonth() {
    const blank = { month: '' }
    regions.forEach((r) => { blank[r.id] = 0 })
    patch('geoTrendData', [...trendData, blank])
  }

  return (
    <div className="section-content">
      <p className="section-hint">
        City nodes shown on the map, trend chart, data table, and comparison panel.
        Editing the <strong>Market Size</strong> section above will auto-sync supply &amp; available for matching city names.
      </p>

      {/* Regions */}
      <div className="sub-section">
        <p className="sub-section-title">City Nodes</p>
        {regions.map((r, i) => (
           <div key={i} className="form-card" style={{ borderLeft: `3px solid ${r.color || '#6366f1'}`, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="form-card-title" style={{ color: r.color }}>{r.name || `Region ${i + 1}`} · {r.country}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="geo-lookup-toggle"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setLookupIdx(lookupIdx === i ? null : i)}
                  title="Fill country code & coordinates from lookup"
                >
                  <Search size={12} />
                  {lookupIdx === i ? 'Close' : 'Lookup country'}
                </button>
                <button className="row-delete-btn" onClick={() => removeRegion(i)}><Trash2 size={14}/></button>
              </div>
            </div>

            {/* Inline country lookup */}
            {lookupIdx === i && (
              <CountryLookupPanel
                onSelect={(entry) => fillFromLookup(i, entry)}
                onClose={() => setLookupIdx(null)}
              />
            )}
            <div className="form-grid-3">
              <div className="form-row">
                <label className="form-label">ID (short key)</label>
                <input className="form-input" value={r.id || ''} placeholder="hcm" onChange={(e) => setRegionField(i, 'id', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">City Name</label>
                <input className="form-input" value={r.name || ''} placeholder="Ho Chi Minh City" onChange={(e) => setRegionField(i, 'name', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Country</label>
                <input className="form-input" value={r.country || ''} placeholder="Vietnam" onChange={(e) => setRegionField(i, 'country', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Country Code (ISO numeric)</label>
                <input className="form-input" value={r.countryCode || ''} placeholder="704" onChange={(e) => setRegionField(i, 'countryCode', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Zone</label>
                <select className="form-input" value={r.zone || 'Southeast Asia'} onChange={(e) => setRegionField(i, 'zone', e.target.value)}>
                  {ZONE_OPTIONS.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={r.color || '#6366f1'} onChange={(e) => setRegionField(i, 'color', e.target.value)}
                    style={{ width: 32, height: 32, padding: 2, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', flexShrink: 0 }} />
                  <input className="form-input" value={r.color || ''} onChange={(e) => setRegionField(i, 'color', e.target.value)} placeholder="#6366f1" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">Supply (total profiles)</label>
                <input className="form-input" type="number" value={r.supply ?? 0} onChange={(e) => setRegionField(i, 'supply', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Available candidates</label>
                <input className="form-input" type="number" value={r.available ?? 0} onChange={(e) => setRegionField(i, 'available', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">YoY Change (%)</label>
                <input className="form-input" type="number" value={r.yoyChange ?? 0} onChange={(e) => setRegionField(i, 'yoyChange', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Market Share (%)</label>
                <input className="form-input" type="number" value={r.marketShare ?? 0} onChange={(e) => setRegionField(i, 'marketShare', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="0.0001" value={r.lat ?? 0} onChange={(e) => setRegionField(i, 'lat', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="0.0001" value={r.lng ?? 0} onChange={(e) => setRegionField(i, 'lng', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button className="add-row-btn" onClick={addRegion}><Plus size={14}/> Add Region</button>
      </div>

      {/* Trend table */}
      <div className="sub-section">
        <p className="sub-section-title">Monthly Supply Trend</p>
        <p className="section-hint" style={{ marginBottom: 8 }}>12-month supply per region. Column keys match Region IDs above.</p>
        {regions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add regions above first.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>Month</th>
                    {regions.map((r) => (
                      <th key={r.id} style={{ padding: '6px 8px', textAlign: 'center', color: r.color, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                        {r.name || r.id}
                      </th>
                    ))}
                    <th style={{ width: 32, borderBottom: '1px solid var(--border)' }} />
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '4px 8px' }}>
                        <input className="form-input" value={row.month || ''} placeholder="Jan"
                          style={{ width: 60 }}
                          onChange={(e) => patch('geoTrendData', trendData.map((r, i) => i === rowIdx ? { ...r, month: e.target.value } : r))} />
                      </td>
                      {regions.map((region) => (
                        <td key={region.id} style={{ padding: '4px 8px' }}>
                          <input className="form-input" type="number" value={row[region.id] ?? 0}
                            style={{ width: 64, textAlign: 'center' }}
                            onChange={(e) => setTrendCell(rowIdx, region.id, e.target.value)} />
                        </td>
                      ))}
                      <td style={{ padding: '4px 8px' }}>
                        <button className="row-delete-btn" onClick={() => patch('geoTrendData', trendData.filter((_, idx) => idx !== rowIdx))}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="add-row-btn" style={{ marginTop: 8 }} onClick={addTrendMonth}>
              <Plus size={14} /> Add Month
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── 8. Methodology ────────────────────────────────────────────────────────────
function MethodologySection({ formData, patch }) {
  const method      = formData.methodologyData || {}
  const criteria    = method.criteria    || []
  const sources     = method.sources     || []
  const disclaimers = method.disclaimers || []

  function patchMethod(field, val) {
    patch('methodologyData', { ...method, [field]: val })
  }

  return (
    <div className="section-content">

      {/* Search Criteria */}
      <div className="sub-section">
        <p className="sub-section-title">Search Criteria</p>
        <div className="table-editor">
          <div className="table-editor-head" style={{ gridTemplateColumns: '1fr 2fr auto' }}>
            <span>Label</span><span>Value</span><span></span>
          </div>
          {criteria.map((r, i) => (
            <div key={i} className="table-editor-row" style={{ gridTemplateColumns: '1fr 2fr auto' }}>
              <input className="form-input" value={r.label} placeholder="e.g. Role" onChange={(e) => patchMethod('criteria', criteria.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))} />
              <input className="form-input" value={r.value} placeholder="e.g. Security Champion" onChange={(e) => patchMethod('criteria', criteria.map((c, idx) => idx === i ? { ...c, value: e.target.value } : c))} />
              <button className="row-delete-btn" onClick={() => patchMethod('criteria', criteria.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={() => patchMethod('criteria', [...criteria, { label: '', value: '' }])}>
          <Plus size={14}/> Add Criterion
        </button>
      </div>

      {/* Data Sources */}
      <div className="sub-section">
        <p className="sub-section-title">Data Sources & Confidence</p>
        <div className="form-grid-2">
          {sources.map((r, i) => (
            <div key={i} className="form-card">
              <div className="form-card-header">
                <div className="form-card-title">{r.name || `Source ${i + 1}`}</div>
                <button className="row-delete-btn" onClick={() => patchMethod('sources', sources.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
              </div>
              <div className="form-grid-2">
                <div className="form-row">
                  <label className="form-label">Source Name</label>
                  <input className="form-input" value={r.name || ''} onChange={(e) => patchMethod('sources', sources.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Confidence % (0–100)</label>
                  <input className="form-input" type="number" min={0} max={100} value={r.confidence ?? 80} onChange={(e) => patchMethod('sources', sources.map((s, idx) => idx === i ? { ...s, confidence: Number(e.target.value) || 0 } : s))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Sample Size (optional)</label>
                  <input className="form-input" type="number" value={r.sampleSize ?? ''} placeholder="leave blank if N/A"
                    onChange={(e) => patchMethod('sources', sources.map((s, idx) => idx === i ? { ...s, sampleSize: e.target.value === '' ? null : Number(e.target.value) } : s))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Note</label>
                  <input className="form-input" value={r.note || ''} onChange={(e) => patchMethod('sources', sources.map((s, idx) => idx === i ? { ...s, note: e.target.value } : s))} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={() => patchMethod('sources', [...sources, { name: '', confidence: 80, sampleSize: null, note: '' }])}>
          <Plus size={14}/> Add Source
        </button>
      </div>

      {/* Disclaimers */}
      <div className="sub-section">
        <p className="sub-section-title">Disclaimers / Important Remarks</p>
        {disclaimers.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <textarea className="form-textarea" value={d} rows={2}
              onChange={(e) => patchMethod('disclaimers', disclaimers.map((x, idx) => idx === i ? e.target.value : x))} />
            <button className="row-delete-btn" style={{ marginTop: 4 }} onClick={() => patchMethod('disclaimers', disclaimers.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button>
          </div>
        ))}
        <button className="add-row-btn" onClick={() => patchMethod('disclaimers', [...disclaimers, ''])}>
          <Plus size={14}/> Add Remark
        </button>
      </div>

    </div>
  )
}
