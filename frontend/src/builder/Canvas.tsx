import React, { useState } from 'react'
import { useBuilderStore } from './store/builderStore'
import { BLOCK_REGISTRY } from './BlockRegistry'
import * as LucideIcons from 'lucide-react'
import { Plus, X } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import BlockRenderer from './BlockRenderer'

const AddBlockModal: React.FC<{ onClose: () => void; onAdd: (type: string) => void }> = ({ onClose, onAdd }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Ajouter un bloc</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
          {Object.values(BLOCK_REGISTRY).map((block) => {
            const Icon = (LucideIcons as any)[block.icon] || LucideIcons.Square
            return (
              <button
                key={block.type}
                onClick={() => onAdd(block.type)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-blue-600 hover:border-blue-500 hover:text-white group transition-all"
              >
                <div className="p-3 rounded-full bg-neutral-800 group-hover:bg-blue-500 mb-3 transition-colors">
                  <Icon size={24} className="text-neutral-400 group-hover:text-white" />
                </div>
                <span className="text-xs font-semibold">{block.label}</span>
              </button>
            )
          })}
        </div>
        
        <div className="p-4 bg-neutral-950/50 text-[10px] text-neutral-500 text-center uppercase tracking-tighter">
          Cliquez sur un bloc pour l'ajouter à la fin de votre page
        </div>
      </div>
    </div>
  )
}

const Canvas: React.FC = () => {
  const page = useBuilderStore((state) => state.page)
  const addBlock = useBuilderStore((state) => state.addBlock)
  const [showModal, setShowModal] = useState(false)
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
  })
  
  const handleAddBlock = (type: string) => {
    addBlock(null, type)
    setShowModal(false)
  }

  return (
    <div className="relative group/canvas">
      <div 
        ref={setNodeRef}
        className={`max-w-5xl mx-auto bg-white min-h-[800px] shadow-2xl rounded-sm text-black p-0 overflow-hidden transition-all border border-neutral-200 ${
          isOver ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/10' : ''
        }`}
      >
        {!page?.schema?.root?.children?.length && (
          <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 m-8 rounded-lg text-neutral-400">
            <p className="text-sm mb-4">Votre page est vide</p>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
            >
              <Plus size={16} /> Ajouter mon premier bloc
            </button>
          </div>
        )}
        
        <div className="space-y-0">
          {/* 1. All blocks EXCEPT footer */}
          {page?.schema?.root?.children?.filter(b => b.type !== 'footer').map((block) => (
            <BlockRenderer key={block.id} node={block} />
          ))}

          {/* 2. Middle Add Button (if content exists) */}
          {page?.schema?.root?.children?.length > 0 && (
            <div className="py-20 flex justify-center bg-neutral-50/30 border-y border-neutral-100/50 group/add">
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-3 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-600 px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center"
              >
                <Plus size={20} className="group-hover/add:rotate-90 transition-transform duration-300" /> 
                Insérer un nouveau bloc ici
              </button>
            </div>
          )}

          {/* 3. Finally the Footer (rendered last but always at the bottom) */}
          {page?.schema?.root?.children?.filter(b => b.type === 'footer').map((block) => (
            <BlockRenderer key={block.id} node={block} />
          ))}
        </div>
      </div>

      {showModal && (
        <AddBlockModal 
          onClose={() => setShowModal(false)} 
          onAdd={handleAddBlock} 
        />
      )}
    </div>
  )
}

export default Canvas
