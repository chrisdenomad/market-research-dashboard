import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function SortableWidget({ id, children, className = '' }) {
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
    // Use translate-only so the widget stays in-flow while dragging
    transform: CSS.Transform.toString(transform),
    // Only apply transition when NOT dragging — during drag we want
    // immediate response; transition comes back on drop
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
      {/* Grip handle — visible on hover, used as the drag activator */}
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

      {children}
    </div>
  )
}
