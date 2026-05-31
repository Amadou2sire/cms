import React, { useEffect, useState } from 'react'
import BlockPanel from './BlockPanel'
import Canvas from './Canvas'
import PropsPanel from './PropsPanel'
import { DndContext, type DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useBuilderStore } from './store/builderStore'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'

import { Undo2, Redo2, Save, Eye, LayoutDashboard, Globe, History, Languages, Link as LinkIcon, Calendar, Share2, X } from 'lucide-react'
import ProfessionalModal from './components/ProfessionalModal'
import RevisionPanel from './RevisionPanel'
import type { ModalType } from './components/ProfessionalModal'
import { useProject } from '../contexts/ProjectContext'

const BuilderLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const loadPage = useBuilderStore((state) => state.loadPage)
  const addBlock = useBuilderStore((state) => state.addBlock)
  const loadSettings = useBuilderStore((state) => state.loadSettings)

  const page = useBuilderStore((state) => state.page)
  const undo = useBuilderStore((state) => state.undo)
  const redo = useBuilderStore((state) => state.redo)
  const canUndo = useBuilderStore((state) => state.past.length > 0)
  const canRedo = useBuilderStore((state) => state.future.length > 0)
  const isDirty = useBuilderStore((state) => state.isDirty)
  const currentLang = useBuilderStore((state) => state.currentLang)
  const setCurrentLang = useBuilderStore((state) => state.setCurrentLang)
  const { languages, defaultLanguage } = useProject()

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [showRevisions, setShowRevisions] = useState(false)
  const [showPreviewMenu, setShowPreviewMenu] = useState(false)
  const [previewLinks, setPreviewLinks] = useState<any[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
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

  // Load settings first, then page
  useEffect(() => {
    client.get('/settings/').then(async (res) => {
      const { header_config, footer_config } = res.data;
      loadSettings(header_config, footer_config);
      // After settings are loaded, fetch the page if id exists
      if (id) {
        const pageRes = await client.get(`/pages/${id}`);
        loadPage(pageRes.data);
      }
    }).catch(err => console.error('Failed to load settings or page', err));
  }, [id, loadSettings, loadPage]);

  // Remove previous separate useEffect for page loading
  // useEffect(() => {
  //   if (id) {
  //     client.get(`/pages/${id}`).then(res => {
  //       loadPage(res.data);
  //     })
  //   }
  // }, [id, loadPage]);

  // Initialize language from project default
  useEffect(() => {
    setCurrentLang(defaultLanguage)
  }, [defaultLanguage, setCurrentLang])

  const handleSave = async () => {
    if (!page || !id || isSaving) return
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const headerBlock = page.schema.root.children.find((b: any) => b.type === 'header')
      const footerBlock = page.schema.root.children.find((b: any) => b.type === 'footer')

      const promises: Promise<any>[] = [
        client.put(`/pages/${id}`, {
          title: page.title,
          slug: page.slug,
          status: page.status,
          schema: page.schema
        })
      ]

      if (headerBlock) {
        promises.push(client.put('/settings/header', headerBlock.props))
      }
      if (footerBlock) {
        promises.push(client.put('/settings/footer', footerBlock.props))
      }

      await Promise.all(promises)
      // Auto-snapshot: create a revision after successful save
      client.post(`/pages/${id}/revisions`, { title: page.title }).catch(() => {})

      if (headerBlock || footerBlock) {
        const currentHeader = headerBlock ? headerBlock.props : useBuilderStore.getState().headerConfig
        const currentFooter = footerBlock ? footerBlock.props : useBuilderStore.getState().footerConfig
        loadSettings(currentHeader, currentFooter)
      }

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

  const handleCreatePreviewLink = async () => {
    if (!id) return
    try {
      const res = await client.post(`/pages/${id}/preview-links`, {
        resource_type: 'page',
        resource_id: id,
        expires_at: null
      })
      setPreviewLinks([...previewLinks, res.data])
      setModal({
        isOpen: true,
        title: 'Lien de prévisualisation créé',
        message: `${window.location.origin}/preview/${res.data.token}`,
        type: 'info'
      })
    } catch (err) {
      setModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de créer le lien de prévisualisation.',
        type: 'error'
      })
    }
  }

  const handleListPreviewLinks = async () => {
    if (!id) return
    try {
      const res = await client.get(`/pages/${id}/preview-links`)
      setPreviewLinks(res.data)
      setShowPreviewMenu(true)
    } catch (err) {
      console.error('Failed to fetch preview links', err)
    }
  }

  const handleDeletePreviewLink = async (token: string) => {
    try {
      await client.delete(`/pages/preview-links/${token}`)
      setPreviewLinks(previewLinks.filter(l => l.token !== token))
    } catch (err) {
      console.error('Failed to delete preview link', err)
    }
  }

  const handleSchedulePublish = async () => {
    if (!id || !scheduledDate) return
    try {
      await client.post(`/pages/${id}/schedule-publish`, {
        scheduled_at: scheduledDate
      })
      setModal({
        isOpen: true,
        title: 'Publication planifiée',
        message: `La page sera publiée le ${new Date(scheduledDate).toLocaleString('fr-FR')}`,
        type: 'success'
      })
      setShowScheduleModal(false)
      setScheduledDate('')
    } catch (err) {
      setModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de planifier la publication.',
        type: 'error'
      })
    }
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
              onClick={() => setShowRevisions(!showRevisions)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                showRevisions
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <History size={14} />
              Historique
            </button>

            {/* Preview Links MenusubmitComment
              onClick={() => setShowPreviewMenu(!showPreviewMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                showPreviewMenu
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <Share2 size={14} />
              Partager
              {previewLinks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 rounded-full text-[9px]">{previewLinks.length}</span>
              )}
            </button>

            {/* Preview Links Dropdown */}
            {showPreviewMenu && (
              <div className="absolute right-48 mt-12 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 p-3">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Liens de prévisualisation</p>
                {previewLinks.length === 0 ? (
                  <p className="text-xs text-neutral-600 mb-2">Aucun lien créé</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-2 mb-2">
                    {previewLinks.map((link) => (
                      <div key={link.token} className="flex items-center justify-between bg-neutral-800 rounded p-2">
                        <a
                          href={`${window.location.origin}/preview/${link.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline truncate flex-1 mr-2"
                        >
                          {link.token.slice(0, 8)}...
                        </a>
                        <button
                          onClick={() => handleDeletePreviewLink(link.token)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { handleCreatePreviewLink(); setShowPreviewMenu(false); }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs font-bold uppercase tracking-wider"
                >
                  Créer un lien
                </button>
              </div>
            )}

            {languages.length > 1 && (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                  title="Changer de langue"
                >
                  <Languages size={14} />
                  <span className="hidden lg:inline">{currentLang.toUpperCase()}</span>
                </button>
                <div className="absolute right-0 mt-1 w-28 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  {languages.map((lang: string) => (
                    <button
                      key={lang}
                      onClick={() => setCurrentLang(lang)}
                      className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                        currentLang === lang
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Publish Dropdown with Schedule Option */}
            <div className="relative group">
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
              <button
                onClick={() => setShowScheduleModal(true)}
                className="absolute right-0 top-0 h-6 w-6 flex items-center justify-center bg-green-700/50 text-white rounded-r-none rounded-bl-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                title="Planifier la publication"
              >
                <Calendar size={10} />
              </button>
            </div>

            {/* Schedule Publish Modal */}
            {showScheduleModal && (
              <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-sm">Planifier la publication</h3>
                    <button onClick={() => setShowScheduleModal(false)} className="text-neutral-500 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">Choisissez la date et l'heure de publication automatique</p>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm mb-4"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 text-xs font-bold uppercase text-neutral-500 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSchedulePublish}
                      disabled={!scheduledDate}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-4 py-2 rounded text-xs font-bold uppercase"
                    >
                      Planifier
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Canvas />
        </div>
      </main>

      {/* Right Panel: Settings (Props, SEO, GEO) or Revisions */}
      <aside className="w-96 border-l border-neutral-800 flex flex-col bg-neutral-950">
        {showRevisions && page ? (
          <RevisionPanel pageId={page.id} />
        ) : (
          <PropsPanel />
        )}
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
