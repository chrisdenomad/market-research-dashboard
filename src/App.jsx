import { useState, lazy, Suspense, memo } from 'react'
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
import AIInsightCard from './components/AIInsightCard'
import SortableWidget from './components/SortableWidget'
import GeographicDistribution from './components/GeographicDistribution'

// Heavy modals — loaded on demand only when user opens them
const DataModal     = lazy(() => import('./components/DataModal'))
const APIKeyModal   = lazy(() => import('./components/APIKeyModal'))
const WidgetManager = lazy(() => import('./components/WidgetManager'))

import './App.css'

// Lightweight label map for the drag overlay ghost — pulled eagerly
// because WidgetManager is now lazy but we still need ALL_WIDGETS here.
// We duplicate the list to avoid importing the full lazy component.
const ALL_WIDGET_DEFS = [
  { id: 'ai-overview',        label: 'AI Overview' },
  { id: 'kpi',                label: 'Metrics Summary' },
  { id: 'market-size',        label: 'Market Size' },
  { id: 'market-capacity',    label: 'Market Capacity' },
  { id: 'geo-distribution',   label: 'Geographic Distribution' },
  { id: 'sourcing',           label: 'Sourcing Outlook' },
  { id: 'key-insights',       label: 'Key Insights' },
  { id: 'benchmark',          label: 'Rate Benchmark' },
  { id: 'methodology',        label: 'Methodology' },
]
const WIDGET_LABELS  = Object.fromEntries(ALL_WIDGET_DEFS.map((w) => [w.id, w.label]))
const DEFAULT_WIDGETS = ALL_WIDGET_DEFS.map((w) => w.id)

// Maps widget id → DataModal accordion section id
const WIDGET_SECTION = {
  'ai-overview':      'report',
  'kpi':              'report',
  'market-size':      'marketsize',
  'market-capacity':  'capacity',
  'geo-distribution': 'geo',
  'sourcing':         'sourcing',
  'key-insights':     'insights',
  'benchmark':        'rates',
  'methodology':      'methodology',
}

// Section IDs must match navItems ids in Sidebar.jsx
const SECTION_IDS = {
  'ai-overview':       'ai-overview-section',
  'kpi':               'kpi',
  'market-size':       'market-size',
  'market-capacity':   'capacity',
  'geo-distribution':  'geo-distribution',
  'sourcing':          'sourcing',
  'key-insights':      'insights',
  'benchmark':         'benchmark',
  'methodology':       'methodology',
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
const WidgetContent = memo(function WidgetContent({ id, data, summary, loading, error, generate, hasKey, customInstruction, updateInstruction, mode, setMode, manualOutput, manualLoading, manualError, generateManual, onOpenKeyModal }) {
  const sectionId = SECTION_IDS[id]
  switch (id) {
    case 'ai-overview':
      return (
        <section className="section" id={sectionId}>
          <AIInsightCard
            summary={summary} loading={loading} error={error}
            onRegenerate={generate} onOpenKeyModal={onOpenKeyModal}
            hasKey={hasKey}
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
    case 'geo-distribution':
      return <section className="section" id={sectionId}><GeographicDistribution /></section>
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
})

function Dashboard() {
  const { data } = useData()
  const [modalOpen,       setModalOpen]       = useState(false)
  const [editSection,     setEditSection]     = useState(null)
  const [keyModalOpen,    setKeyModalOpen]    = useState(false)
  const [widgetMgrOpen,   setWidgetMgrOpen]   = useState(false)
  const [pdfStatus,       setPdfStatus]       = useState(null)
  const [widgetOrder,     setWidgetOrder]     = useState(loadWidgetOrder)
  const [hiddenWidgets,   setHiddenWidgets]   = useState(loadHiddenWidgets)
  const [activeId,        setActiveId]        = useState(null)

  const {
    summary, loading, error, generate,
    apiKey, updateApiKey, hasKey,
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

  // Open the data modal, optionally jumping to a specific section
  function openEditModal(section = null) {
    setEditSection(section)
    setModalOpen(true)
  }

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
    hasKey,
    customInstruction, updateInstruction,
    mode, setMode,
    manualOutput, manualLoading, manualError, generateManual,
    onOpenKeyModal: () => setKeyModalOpen(true),
  }

  return (
    <div className="app" id="pdf-export-root">
      <Header
        onEditData={() => openEditModal()}
        onDownloadTemplate={() => downloadExcelTemplate(data)}
        onExportPdf={async () => {
          try { await exportDashboardPdf(data.reportMeta, setPdfStatus) }
          catch (err) { console.error('PDF export failed:', err); setPdfStatus(null) }
        }}
        pdfStatus={pdfStatus}
      />

      <div className="app-body">
        <Sidebar
          visibleWidgets={visibleWidgets}
          onOpenKeyModal={() => setKeyModalOpen(true)}
          onManageWidgets={() => setWidgetMgrOpen(true)}
        />

        <main className="main-content">
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
                <SortableWidget
                  key={id}
                  id={id}
                  onEdit={() => openEditModal(WIDGET_SECTION[id] ?? null)}
                >
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
                  <div className="drag-overlay-label">
                    {WIDGET_LABELS[activeId] || activeId}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      {/* Widget manager panel — lazy loaded */}
      <Suspense fallback={null}>
        {widgetMgrOpen && (
          <WidgetManager
            visibleWidgets={visibleWidgets}
            onToggle={handleToggleWidget}
            onReset={handleResetWidgets}
            onClose={() => setWidgetMgrOpen(false)}
          />
        )}

        {modalOpen    && <DataModal initialSection={editSection} onClose={() => { setModalOpen(false); setEditSection(null) }} />}
        {keyModalOpen && (
          <APIKeyModal
            currentKey={apiKey}
            onSave={(key) => updateApiKey(key)}
            onClose={() => setKeyModalOpen(false)}
          />
        )}
      </Suspense>

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
