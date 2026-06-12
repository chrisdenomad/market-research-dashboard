import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
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
import SortableWidget from './components/SortableWidget'
import WidgetManager, { ALL_WIDGETS } from './components/WidgetManager'
import './App.css'

// ── Default widget order (all visible) ─────────────────────────
const DEFAULT_WIDGETS = ALL_WIDGETS.map((w) => w.id)

// Section IDs must match navItems ids in Sidebar.jsx
const SECTION_IDS = {
  'ai-overview':     'ai-overview-section',
  'kpi':             'kpi',
  'market-size':     'market-size',
  'market-capacity': 'capacity',
  'sourcing':        'sourcing',
  'key-insights':    'insights',
  'benchmark':       'benchmark',
  'methodology':     'methodology',
}

const ORDER_KEY   = 'dashboard-widget-order'
const HIDDEN_KEY  = 'dashboard-widget-hidden'

function loadWidgetOrder() {
  try {
    const saved = localStorage.getItem(ORDER_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const merged = parsed.filter((id) => DEFAULT_WIDGETS.includes(id))
      DEFAULT_WIDGETS.forEach((id) => { if (!merged.includes(id)) merged.push(id) })
      return merged
    }
  } catch (_) { /* ignore */ }
  return [...DEFAULT_WIDGETS]
}

function loadHiddenWidgets() {
  try {
    const saved = localStorage.getItem(HIDDEN_KEY)
    if (saved) return JSON.parse(saved)
  } catch (_) { /* ignore */ }
  return []
}

// ── Widget content renderer ─────────────────────────────────────
function WidgetContent({ id, data, summary, loading, error, generate, customInstruction, updateInstruction, mode, setMode, manualOutput, manualLoading, manualError, generateManual, onOpenKeyModal }) {
  const sectionId = SECTION_IDS[id]
  switch (id) {
    case 'ai-overview':
      return (
        <section className="section" id={sectionId}>
          <AIInsightCard
            summary={summary} loading={loading} error={error}
            onRegenerate={generate} onOpenKeyModal={onOpenKeyModal}
            customInstruction={customInstruction}
            onInstructionChange={updateInstruction}
            onGenerate={(instruction) => generate(undefined, instruction)}
            mode={mode}
            onModeChange={setMode}
            manualOutput={manualOutput}
            manualLoading={manualLoading}
            manualError={manualError}
            onManualGenerate={generateManual}
          />
        </section>
      )
    case 'kpi':
      return (
        <section id={sectionId} className="section">
          <div className="kpi-grid">
            {(data.kpiData || []).map((k) => <KPICard key={k.label} {...k} />)}
          </div>
        </section>
      )
    case 'market-size':
      return <section className="section" id={sectionId}><MarketSizeChart /></section>
    case 'market-capacity':
      return <section className="section" id={sectionId}><MarketCapacity /></section>
    case 'sourcing':
      return <section className="section" id={sectionId}><SourcingOutlook /></section>
    case 'key-insights':
      return <section className="section" id={sectionId}><KeyInsights /></section>
    case 'benchmark':
      return <section className="section" id={sectionId}><MarketRateBenchmark /></section>
    case 'methodology':
      return <section className="section" id={sectionId}><SearchMethodology /></section>
    default:
      return null
  }
}

function Dashboard() {
  const { data } = useData()
  const [modalOpen,       setModalOpen]       = useState(false)
  const [keyModalOpen,    setKeyModalOpen]    = useState(false)
  const [widgetMgrOpen,   setWidgetMgrOpen]   = useState(false)
  const [pdfStatus,       setPdfStatus]       = useState(null)
  const [widgetOrder,     setWidgetOrder]     = useState(loadWidgetOrder)
  const [hiddenWidgets,   setHiddenWidgets]   = useState(loadHiddenWidgets)
  const [activeId,        setActiveId]        = useState(null)

  const {
    summary, loading, error, generate,
    apiKey, updateApiKey,
    customInstruction, updateInstruction,
    mode, setMode,
    manualOutput, manualLoading, manualError, generateManual,
  } = useAIInsight(data)

  // Widgets that are currently visible (order preserved, hidden ones excluded)
  const visibleWidgets = widgetOrder.filter((id) => !hiddenWidgets.includes(id))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart({ active }) { setActiveId(active.id) }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    setWidgetOrder((prev) => {
      // Reorder within the full order array (including hidden ones)
      const visOld = visibleWidgets.indexOf(active.id)
      const visNew = visibleWidgets.indexOf(over.id)
      const reorderedVisible = arrayMove(visibleWidgets, visOld, visNew)
      // Rebuild full order: place visible in new order, keep hidden in their relative spots
      const hidden = prev.filter((id) => hiddenWidgets.includes(id))
      const next = [...reorderedVisible, ...hidden]
      localStorage.setItem(ORDER_KEY, JSON.stringify(next))
      return next
    })
  }

  function handleDragCancel() { setActiveId(null) }

  // Toggle a widget's visibility
  function handleToggleWidget(id) {
    setHiddenWidgets((prev) => {
      const next = prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next))
      return next
    })
  }

  // Reset to all visible, default order
  function handleResetWidgets() {
    setWidgetOrder([...DEFAULT_WIDGETS])
    setHiddenWidgets([])
    localStorage.removeItem(ORDER_KEY)
    localStorage.removeItem(HIDDEN_KEY)
  }

  const widgetProps = {
    data, summary, loading, error, generate,
    customInstruction, updateInstruction,
    mode, setMode,
    manualOutput, manualLoading, manualError, generateManual,
    onOpenKeyModal: () => setKeyModalOpen(true),
  }

  return (
    <div className="app">
      <Header
        onEditData={() => setModalOpen(true)}
        onDownloadTemplate={() => downloadExcelTemplate(data)}
        onManageWidgets={() => setWidgetMgrOpen(true)}
        onExportPdf={async () => {
          try { await exportDashboardPdf(data.reportMeta, setPdfStatus) }
          catch (err) { console.error('PDF export failed:', err); setPdfStatus(null) }
        }}
        onOpenKeyModal={() => setKeyModalOpen(true)}
        pdfStatus={pdfStatus}
      />

      <div className="app-body">
        <Sidebar />

        <main className="main-content" id="pdf-export-root">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={visibleWidgets} strategy={verticalListSortingStrategy}>
              {visibleWidgets.map((id) => (
                <SortableWidget key={id} id={id}>
                  <WidgetContent id={id} {...widgetProps} />
                </SortableWidget>
              ))}
            </SortableContext>

            <DragOverlay
              modifiers={[restrictToVerticalAxis]}
              dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}
            >
              {activeId ? (
                <div className="drag-overlay-ghost">
                  <WidgetContent id={activeId} {...widgetProps} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      {/* Widget manager panel */}
      {widgetMgrOpen && (
        <WidgetManager
          visibleWidgets={visibleWidgets}
          onToggle={handleToggleWidget}
          onReset={handleResetWidgets}
          onClose={() => setWidgetMgrOpen(false)}
        />
      )}

      {modalOpen    && <DataModal onClose={() => setModalOpen(false)} />}
      {keyModalOpen && (
        <APIKeyModal
          currentKey={apiKey}
          onSave={(key) => updateApiKey(key)}
          onClose={() => setKeyModalOpen(false)}
        />
      )}

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
