import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'
import { useData } from './context/DataContext'
import { downloadExcelTemplate } from './utils/excelTemplate'
import { exportDashboardPdf } from './utils/exportPdf'
import { useAIInsight } from './hooks/useAIInsight'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import KPICard from './components/KPICard'
import MarketSizeChart from './components/MarketSizeChart'
import MarketCapacity from './components/MarketCapacity'
import SourcingOutlook from './components/SourcingOutlook'
import MarketRateBenchmark from './components/MarketRateBenchmark'
import KeyInsights from './components/KeyInsights'
import SearchMethodology from './components/SearchMethodology'
import DataModal from './components/DataModal'
import AIInsightCard from './components/AIInsightCard'
import APIKeyModal from './components/APIKeyModal'
import './App.css'

function Dashboard() {
  const { data } = useData()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [pdfStatus,    setPdfStatus]    = useState(null)

  const { summary, loading, error, generate, apiKey, updateApiKey } = useAIInsight(data)

  function handleDownloadTemplate() {
    downloadExcelTemplate(data)
  }

  async function handleExportPdf() {
    try {
      await exportDashboardPdf(data.reportMeta, setPdfStatus)
    } catch (err) {
      console.error('PDF export failed:', err)
      setPdfStatus(null)
    }
  }

  return (
    <div className="app">
      <Header
        onEditData={() => setModalOpen(true)}
        onDownloadTemplate={handleDownloadTemplate}
        onExportPdf={handleExportPdf}
        onOpenKeyModal={() => setKeyModalOpen(true)}
        pdfStatus={pdfStatus}
      />

      <div className="app-body">
        <Sidebar />

        <main className="main-content" id="pdf-export-root">

          {/* AI Market Overview — full width, top of content */}
          <section className="section" id="ai-overview-section">
            <AIInsightCard
              summary={summary}
              loading={loading}
              error={error}
              onRegenerate={() => generate()}
              onOpenKeyModal={() => setKeyModalOpen(true)}
            />
          </section>

          {/* KPI Overview */}
          <section id="kpi" className="section">
            <div className="kpi-grid">
              {(data.kpiData || []).map((k) => (
                <KPICard key={k.label} {...k} />
              ))}
            </div>
          </section>

          {/* Market Size + Market Capacity */}
          <section className="section two-col">
            <MarketSizeChart />
            <MarketCapacity />
          </section>

          {/* Sourcing Outlook */}
          <section className="section">
            <SourcingOutlook />
          </section>

          {/* Key Insights + Market Rate */}
          <section className="section two-col insights-benchmark">
            <KeyInsights />
            <MarketRateBenchmark />
          </section>

          {/* Search Methodology */}
          <section className="section">
            <SearchMethodology />
          </section>

        </main>
      </div>

      {/* Modals */}
      {modalOpen    && <DataModal   onClose={() => setModalOpen(false)} />}
      {keyModalOpen && (
        <APIKeyModal
          currentKey={apiKey}
          onSave={(key) => updateApiKey(key)}
          onClose={() => setKeyModalOpen(false)}
        />
      )}

      {/* PDF progress overlay */}
      {pdfStatus && (
        <div className="pdf-progress-overlay">
          <div className="pdf-progress-box">
            <div className="pdf-spinner" />
            <span>{pdfStatus}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Dashboard />
      </DataProvider>
    </ThemeProvider>
  )
}
