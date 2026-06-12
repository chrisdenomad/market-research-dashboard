import { useState, useRef } from 'react'
import { X, Upload, Download, RotateCcw, Check } from 'lucide-react'
import { useData } from '../context/DataContext'
import { parseExcelFile } from '../hooks/useExcelImport'
import { downloadExcelTemplate } from '../utils/excelTemplate'
import OverviewTab     from './modal/OverviewTab'
import MarketSizeTab   from './modal/MarketSizeTab'
import CapacityTab     from './modal/CapacityTab'
import SourcingTab     from './modal/SourcingTab'
import InsightsTab     from './modal/InsightsTab'
import RatesTab        from './modal/RatesTab'
import MethodologyTab  from './modal/MethodologyTab'

const TABS = [
  { id: 'overview',    label: 'Overview'     },
  { id: 'marketsize',  label: 'Market Size'  },
  { id: 'capacity',    label: 'Capacity'     },
  { id: 'sourcing',    label: 'Sourcing'     },
  { id: 'insights',    label: 'Insights'     },
  { id: 'rates',       label: 'Rates'        },
  { id: 'methodology', label: 'Methodology'  },
]

export default function DataModal({ onClose }) {
  const { data, applyData, resetData } = useData()
  const [activeTab, setActiveTab]  = useState('overview')
  const [formData, setFormData]    = useState(() => JSON.parse(JSON.stringify(data)))
  const [importing, setImporting]  = useState(false)
  const [importMsg, setImportMsg]  = useState(null) // { type: 'success'|'error', text }
  const fileRef = useRef()

  function patchForm(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleApply() {
    applyData(formData)
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
      // Merge parsed fields into current formData (only overwrite found sheets)
      setFormData((prev) => {
        const next = { ...prev }
        if (parsed.reportMeta)         next.reportMeta         = parsed.reportMeta
        if (parsed.marketSizeData)     next.marketSizeData     = parsed.marketSizeData
        if (parsed.marketCapacityData) next.marketCapacityData = parsed.marketCapacityData
        if (parsed.sourcingFunnelData) next.sourcingFunnelData = parsed.sourcingFunnelData
        if (parsed.sourcingStats)      next.sourcingStats      = parsed.sourcingStats
        if (parsed.salaryBenchmarkData)next.salaryBenchmarkData= parsed.salaryBenchmarkData
        if (parsed.keyInsightsData)    next.keyInsightsData    = parsed.keyInsightsData
        if (parsed.methodologyCriteria || parsed.methodologySources || parsed.disclaimers) {
          next.methodologyData = {
            criteria:    parsed.methodologyCriteria ?? prev.methodologyData?.criteria    ?? [],
            sources:     parsed.methodologySources  ?? prev.methodologyData?.sources     ?? [],
            disclaimers: parsed.disclaimers         ?? prev.methodologyData?.disclaimers ?? [],
          }
        }
        return next
      })
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
      <div className="modal-container">

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 className="modal-title">Edit Dashboard Data</h2>
            <p className="modal-subtitle">Changes are saved to your browser and persist on reload.</p>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* ── Import / Export bar ── */}
        <div className="modal-toolbar">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            className="modal-btn modal-btn-primary"
            onClick={() => fileRef.current.click()}
            disabled={importing}
          >
            <Upload size={14} />
            {importing ? 'Importing…' : 'Upload Excel'}
          </button>
          <button
            className="modal-btn modal-btn-secondary"
            onClick={() => downloadExcelTemplate(formData)}
          >
            <Download size={14} />
            Download Template
          </button>
          {importMsg && (
            <span className={`import-msg import-msg-${importMsg.type}`}>
              {importMsg.text}
            </span>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`modal-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="modal-body">
          {activeTab === 'overview'    && <OverviewTab    data={formData} onChange={patchForm} />}
          {activeTab === 'marketsize'  && <MarketSizeTab  data={formData} onChange={patchForm} />}
          {activeTab === 'capacity'    && <CapacityTab    data={formData} onChange={patchForm} />}
          {activeTab === 'sourcing'    && <SourcingTab    data={formData} onChange={patchForm} />}
          {activeTab === 'insights'    && <InsightsTab    data={formData} onChange={patchForm} />}
          {activeTab === 'rates'       && <RatesTab       data={formData} onChange={patchForm} />}
          {activeTab === 'methodology' && <MethodologyTab data={formData} onChange={patchForm} />}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="modal-btn modal-btn-danger" onClick={handleReset}>
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-btn modal-btn-apply" onClick={handleApply}>
              <Check size={14} />
              Apply Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
