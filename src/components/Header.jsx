import ThemeSwitcher from './ThemeSwitcher'
import { useData } from '../context/DataContext'
import { Edit2, Download, FileDown, KeyRound } from 'lucide-react'

export default function Header({
  onEditData,
  onDownloadTemplate,
  onExportPdf,
  onOpenKeyModal,
  pdfStatus,
}) {
  const { data, isCustom } = useData()
  const { reportMeta } = data
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="header-logo">
          <span className="header-logo-dot" />
          <span className="header-logo-dot" style={{ opacity: 0.6 }} />
          <span className="header-logo-dot" style={{ opacity: 0.3 }} />
        </div>
        <div>
          <h1 className="header-title">{reportMeta.title}</h1>
          <p className="header-subtitle">
            <span className="role-tag">{reportMeta.role}</span>
            <span className="header-meta"> · {reportMeta.company} · {dateStr}</span>
            {isCustom && <span className="custom-data-badge">Custom Data</span>}
          </p>
        </div>
      </div>

      <div className="header-right">
        <span className="prepared-by">
          Prepared by <strong>{reportMeta.preparedBy}</strong>
        </span>

        <button
          className="header-btn header-btn-ai"
          onClick={onOpenKeyModal}
          title="Configure Gemini AI key"
        >
          <KeyRound size={14} /> AI Key
        </button>

        <button
          className="header-btn header-btn-secondary"
          onClick={onDownloadTemplate}
          title="Download Excel template"
        >
          <Download size={14} /> Template
        </button>

        <button
          className="header-btn header-btn-pdf"
          onClick={onExportPdf}
          disabled={!!pdfStatus}
          title="Export dashboard as PDF"
        >
          <FileDown size={14} />
          {pdfStatus ? pdfStatus : 'Export PDF'}
        </button>

        <button
          className="header-btn header-btn-primary"
          onClick={onEditData}
          title="Edit dashboard data"
        >
          <Edit2 size={14} /> Edit Data
        </button>

        <ThemeSwitcher />
      </div>
    </header>
  )
}
