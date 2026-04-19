import React from 'react'
import { BLOCK_REGISTRY, type BlockDefinition } from './BlockRegistry'
import * as LucideIcons from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

const DraggableBlock: React.FC<{ block: BlockDefinition }> = ({ block }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `catalog-${block.type}`,
    data: {
      type: block.type,
      isCatalogItem: true
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const Icon = (LucideIcons as any)[block.icon] || LucideIcons.Square

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center justify-center p-3 h-20 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-blue-500/50 cursor-grab transition-all group ${
        isDragging ? 'opacity-50 z-50 scale-95' : ''
      }`}
    >
      <div className="bg-neutral-950 p-2 rounded-lg mb-2 group-hover:text-blue-500 transition-colors">
        <Icon size={18} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-tighter text-center line-clamp-1 opacity-60 group-hover:opacity-100">{block.label}</span>
    </div>
  )
}

const BlockPanel: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(BLOCK_REGISTRY).map((block) => (
        <DraggableBlock key={block.type} block={block} />
      ))}
    </div>
  )
}

export default BlockPanel
