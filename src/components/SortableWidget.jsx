import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil } from 'lucide-react'

export default function SortableWidget({ id, children, className = '', onEdit }) {
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
    position: 'relative',
    zIndex: isDragging ? 2 : 'auto',
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-widget ${isDragging ? 'is-dragging' : ''} ${className}`}
    >
      {/* Controls — shown on hover: edit button + drag handle */}
      <div className="widget-controls no-pdf">
        {onEdit && (
          <button
            className="widget-edit-btn"
            onClick={onEdit}
            title="Edit this section's data"
            type="button"
          >
            <Pencil size={13} />
          </button>
        )}
        <div
          ref={setActivatorNodeRef}
          className="drag-handle"
          {...listeners}
          {...attributes}
          title="Drag to reorder"
          role="button"
          aria-roledescription="sortable"
          tabIndex={0}
        >
          <GripVertical size={15} />
        </div>
      </div>

      {children}
    </div>
  )
}
