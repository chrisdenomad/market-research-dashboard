import { useData } from '../context/DataContext'
import { Edit2, Sheet, FileDown } from 'lucide-react'

export default function Header({
  onEditData,
  onDownloadTemplate,
  onExportPdf,
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

        {/* Icon-only buttons */}
        <button
          className="header-icon-btn header-icon-btn-excel"
          onClick={onDownloadTemplate}
          title="Download Excel template"
        >
          <Sheet size={15} />
        </button>

        <button
          className="header-icon-btn header-icon-btn-pdf"
          onClick={onExportPdf}
          disabled={!!pdfStatus}
          title={pdfStatus || 'Export dashboard as PDF'}
        >
          <FileDown size={15} />
        </button>

        {/* Primary action */}
        <button
          className="header-icon-btn header-icon-btn-edit"
          onClick={onEditData}
          title="Edit dashboard data"
        >
          <Edit2 size={15} />
        </button>
      </div>
    </header>
  )
}
