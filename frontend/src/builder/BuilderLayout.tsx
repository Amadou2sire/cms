import React, { useEffect, useState } from 'react'
import BlockPanel from './BlockPanel'
import Canvas from './Canvas'
import PropsPanel from './PropsPanel'
import { DndContext, type DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useBuilderStore } from './store/builderStore'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'

import { Undo2, Redo2, Save, Eye, LayoutDashboard, Globe } from 'lucide-react'
import ProfessionalModal from './components/ProfessionalModal'
import type { ModalType } from './components/ProfessionalModal'

const BuilderLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const loadPage = useBuilderStore((state) => state.loadPage)
  const addBlock = useBuilderStore((state) => state.addBlock)
  
  const page = useBuilderStore((state) => state.page)
  const undo = useBuilderStore((state) => state.undo)
  const redo = useBuilderStore((state) => state.redo)
  const canUndo = useBuilderStore((state) => state.past.length > 0)
  const canRedo = useBuilderStore((state) => state.future.length > 0)
  const isDirty = useBuilderStore((state) => state.isDirty)

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  useEffect(() => {
    if (id) {
      client.get(`/pages/${id}`).then(res => {
        loadPage(res.data)
      })
    }
  }, [id, loadPage])

  const handleSave = async () => {
    if (!page || !id || isSaving) return
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      await client.put(`/pages/${id}`, {
        title: page.title,
        slug: page.slug,
        status: page.status,
        schema: page.schema
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      console.error('Save failed', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!page || !id) return
    
    setModal({
      isOpen: true,
      title: 'Publication',
      message: 'Voulez-vous publier cette page ? Elle sera visible publiquement.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          setIsSaving(true)
          await client.put(`/pages/${id}`, {
            ...page,
            status: 'published'
          })
          loadPage({ ...page, status: 'published' })
          setModal({
            isOpen: true,
            title: 'Succès',
            message: 'Votre page est maintenant en ligne !',
            type: 'success'
          })
        } catch (err) {
          setModal({
            isOpen: true,
            title: 'Erreur',
            message: 'Impossible de publier la page.',
            type: 'error'
          })
        } finally {
          setIsSaving(false)
        }
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    const type = active.data.current?.type
    if (!type) return

    const overId = over.id as string

    if (overId === 'canvas-root') {
      addBlock(null, type)
    } else if (overId.includes('__col_')) {
      // Column droppable zone: format is `{parentBlockId}__col_{colIndex}`
      const parentId = overId.split('__col_')[0]
      addBlock(parentId, type)
    } else {
      // Any other parent block (section, banner...)
      addBlock(overId, type)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Center: Canvas (Drag & Drop Zone) */}
      <main className="flex-1 bg-neutral-900 relative flex flex-col">
        <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-950">
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors mr-2 flex items-center gap-2"
              title="Retour au Dashboard"
            >
              <LayoutDashboard size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-neutral-800 mr-2" />
            <button 
              onClick={undo}
              disabled={!canUndo}
              className={`p-2 rounded transition-colors ${canUndo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'}`}
              title="Annuler (Undo)"
            >
              <Undo2 size={18} />
            </button>
            <button 
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded transition-colors ${canRedo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'}`}
              title="Rétablir (Redo)"
            >
              <Redo2 size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest animate-pulse">✓ Sauvegardé</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">✗ Erreur</span>
            )}
            {isDirty && saveStatus === 'idle' && (
              <span className="w-2 h-2 rounded-full bg-orange-400" title="Modifications non sauvegardées" />
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                isSaving || !isDirty
                  ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Save size={14} />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>

            <Link
              to={`/preview/${id}`}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors text-neutral-300 hover:text-white border border-neutral-700"
            >
              <Eye size={14} />
              Aperçu
            </Link>

            <button
              onClick={handlePublish}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-1.5 rounded text-xs font-black uppercase tracking-[0.15em] transition-all shadow-lg ${
                page?.status === 'published'
                  ? 'bg-green-600/20 text-green-500 border border-green-500/30'
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
              }`}
            >
              <Globe size={14} />
              {page?.status === 'published' ? 'En Ligne' : 'Publier'}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Canvas />
        </div>
      </main>

      {/* Right Panel: Settings (Props, SEO, GEO) */}
      <aside className="w-96 border-l border-neutral-800 flex flex-col bg-neutral-950">
        <PropsPanel />
      </aside>

      <ProfessionalModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
    </DndContext>
  )
}

export default BuilderLayout
