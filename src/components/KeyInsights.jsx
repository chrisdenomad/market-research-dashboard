import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useData } from '../context/DataContext'

const tagStyles = {
  Opportunity: { bg: '#0d3327', color: '#10b981', border: '#10b981' },
  Risk:        { bg: '#3b1212', color: '#ef4444', border: '#ef4444' },
  Trend:       { bg: '#1e1f4a', color: 'var(--accent-light)', border: 'var(--accent)' },
  Watch:       { bg: '#3b2a0a', color: '#f59e0b', border: '#f59e0b' },
  Note:        { bg: '#1e2535', color: 'var(--text-secondary)', border: 'var(--border)' },
}

function SortableInsightCard({ insight, id }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  }

  const tagStyle = tagStyles[insight.tag] || tagStyles.Note

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`insight-card${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
    >
      {/* Drag handle */}
      <div
        ref={setActivatorNodeRef}
        className="insight-drag-handle no-pdf"
        {...listeners}
        title="Drag to reorder"
        role="button"
        tabIndex={0}
        aria-roledescription="sortable"
      >
        <GripVertical size={13} />
      </div>

      <span
        className="insight-tag"
        style={{ background: tagStyle.bg, color: tagStyle.color, borderColor: tagStyle.border }}
      >
        {insight.tag}
      </span>
      <h3 className="insight-title">{insight.title}</h3>
      <p className="insight-body">{insight.body}</p>
    </div>
  )
}

export default function KeyInsights() {
  const { data, applyData } = useData()
  const provided = data.providedSections
  if (!provided || !provided.includes('insights')) return null

  const keyInsightsData = data.keyInsightsData || []

  // Local order state — synced from context on external changes
  const [items, setItems] = useState(() => keyInsightsData.map((_, i) => i))

  useEffect(() => {
    setItems(keyInsightsData.map((_, i) => i))
  }, [keyInsightsData.length])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = items.indexOf(active.id)
    const newIndex = items.indexOf(over.id)
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)
    // Persist reordered insights to context/storage
    const reordered = newItems.map((i) => keyInsightsData[i])
    applyData({ ...data, keyInsightsData: reordered })
  }

  const sortedInsights = items.map((i) => keyInsightsData[i]).filter(Boolean)

  return (
    <div className="card" id="insights">
      <div className="card-header">
        <div>
          <h2 className="card-title">{(data.widgetTitles || {}).keyInsights || 'Key Insights'}</h2>
          <p className="card-subtitle">Critical findings from the market research</p>
        </div>
        <div className="tag-legend">
          {Object.entries(tagStyles).map(([tag, s]) => (
            <span key={tag} className="tag-legend-item" style={{ color: s.color }}>
              <span style={{ background: s.color, borderRadius: '50%', width: 6, height: 6, display: 'inline-block', marginRight: 4 }} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="insights-grid">
            {sortedInsights.map((insight, i) => (
              <SortableInsightCard key={items[i]} id={items[i]} insight={insight} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
