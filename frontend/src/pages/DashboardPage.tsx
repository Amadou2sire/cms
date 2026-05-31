import React, { useEffect, useState, useRef } from 'react'
import client from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import MenuEditor from '../builder/components/MenuEditor'
import { useProject } from '../contexts/ProjectContext'
import { Plus, FileText, Globe, Search, Copy, Edit3, Trash, Settings, Menu, Upload, Newspaper, Briefcase, ChevronDown, X, Box, Database, ClipboardList, Download, Users, Zap } from 'lucide-react'

interface Page {
  id: string
  title: string
  slug: string
  status: string
  is_home: boolean
  updated_at: string
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // remove accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove all non-word chars
    .replace(/\-\-+/g, '-') // replace multiple - with single -
}

const DashboardPage: React.FC = () => {
  const { projects, currentProject, setCurrentProject, refreshProjects } = useProject()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, pageId: string } | null>(null)
  const [renamingPage, setRenamingPage] = useState<Page | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [footerConfig, setFooterConfig] = useState<any>(null)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showSettings, setShowSettings] = useState(false)
  const [createProjectModal, setCreateProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectSlug, setNewProjectSlug] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [templates, setTemplates] = useState<{id: string, name: string, description: string}[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const fetchPages = async () => {
    try {
      const response = await client.get('/pages/', {
        headers: { 'X-Project-ID': currentProject?.id }
      })
      setPages(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await client.get('/settings/')
      setHeaderConfig(response.data.header_config)
      setFooterConfig(response.data.footer_config)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    // Fetch pages and settings when component mounts or currentProject changes
    if (currentProject) {
      fetchPages()
      fetchSettings()
    }

    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [currentProject])

  useEffect(() => {
    // Load templates from public endpoint (no auth required)
    client.get('/projects/templates-public').catch(() => {})
  }, [])

  const handleCreatePage = async () => {
    try {
      const title = 'Nouvelle Page'
      const slug = `page-${Date.now()}`
      const payload = {
        title,
        slug,
        status: 'draft',
        schema: {
          root: {
            id: 'canvas-root',
            type: 'root',
            props: {},
            children: [
              {
                id: `header-${Date.now()}`,
                type: 'header',
                props: headerConfig || {},
                children: []
              },
              {
                id: `footer-${Date.now()}`,
                type: 'footer',
                props: footerConfig || {},
                children: []
              }
            ]
          },
          meta: { title: 'Nouvelle Page', description: '', lang: 'fr' }
        }
      }
      const response = await client.post('/pages/', payload, {
        headers: { 'X-Project-ID': currentProject?.id }
      })
      navigate(`/builder/${response.data.id}`)
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la création de la page.")
    }
  }

  const handleUpdateSettings = async () => {
    try {
      await Promise.all([
        client.put('/settings/header', headerConfig),
        client.put('/settings/footer', footerConfig)
      ])
      setShowSettings(false)
      setNotification({ message: "Paramètres mis à jour !", type: 'success' })
    } catch (err) {
      console.error(err)
      setNotification({ message: "Erreur lors de la mise à jour", type: 'error' })
    }
  }


  const handleFooterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData()
      formData.append('file', e.target.files[0])
      try {
        const res = await client.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setFooterConfig({...footerConfig, logo: res.data.url})
      } catch (err) {
        console.error(err)
        alert("Erreur lors de l'upload du logo footer")
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.pageX, y: e.pageY, pageId })
  }

  const handleDuplicate = async (pageId: string) => {
    try {
      // Fetch full page data
      const res = await client.get(`/pages/${pageId}`)
      const sourcePage = res.data
      
      const payload = {
        title: `${sourcePage.title} (Copie)`,
        slug: `${sourcePage.slug}-copy-${Date.now()}`,
        status: 'draft',
        schema: sourcePage.schema
      }
      
      await client.post('/pages', payload)
      fetchPages()
    } catch (err) {
      console.error("Duplication failed", err)
    }
  }

  const handleRename = async () => {
    if (!renamingPage || !newTitle.trim()) return
    try {
      const newSlug = slugify(newTitle)
      await client.put(`/pages/${renamingPage.id}`, { 
        title: newTitle,
        slug: newSlug 
      })
      setRenamingPage(null)
      fetchPages()
    } catch (err) {
      console.error("Rename failed", err)
    }
  }

  const handleDelete = async (pageId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette page ?")) return
    try {
      await client.delete(`/pages/${pageId}`)
      fetchPages()
    } catch (err) {
      console.error("Delete failed", err)
    }
  }

  const handleSetHome = async (pageId: string) => {
    try {
      await client.put(`/pages/${pageId}`, { is_home: true })
      fetchPages()
      setContextMenu(null)
    } catch (err) {
      console.error("Set home failed", err)
      alert("Erreur lors de la définition de la page d'accueil")
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectSlug.trim()) {
      alert("Veuillez remplir le nom et le slug du projet")
      return
    }
    try {
      const response = await client.post('/projects/', {
        name: newProjectName,
        slug: newProjectSlug,
        description: newProjectDesc,
      })

      // Apply template if selected
      if (selectedTemplate) {
        await client.post(`/projects/${response.data.id}/apply-template`, {
          template_id: selectedTemplate,
        })
      }

      await refreshProjects()
      setCurrentProject(response.data)
      setCreateProjectModal(false)
      setNewProjectName('')
      setNewProjectSlug('')
      setNewProjectDesc('')
      setSelectedTemplate('')
      setNotification({ message: 'Projet créé avec succès !', type: 'success' })
    } catch (err: any) {
      console.error(err)
      setNotification({ message: err.response?.data?.detail || "Erreur lors de l'initialisation du projet", type: 'error' })
    }
  }

  const handleExport = async () => {
    if (!currentProject) return
    try {
      const res = await client.get(`/projects/${currentProject.id}/export`)
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${currentProject.slug}.json`
      a.click()
      URL.revokeObjectURL(url)
      setNotification({ message: `Projet exporté : ${currentProject.name}`, type: 'success' })
    } catch (err) {
      console.error(err)
      setNotification({ message: "Erreur lors de l'export", type: 'error' })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await client.post('/projects/import', { data }, {
        headers: { 'X-Project-ID': currentProject?.id }
      })
      await refreshProjects()
      setCurrentProject(res.data.project)
      setNotification({ message: `Projet importé : ${res.data.project.name}`, type: 'success' })
    } catch (err: any) {
      console.error(err)
      setNotification({ message: err.response?.data?.detail || "Erreur lors de l'import", type: 'error' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-neutral-900">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Pages du Site</h1>
            <div className="flex items-center gap-2 mt-1">
              {currentProject ? (
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">Projet : {currentProject.name}</span>
              ) : (
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">Aucun projet sélectionné</span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleCreatePage}
            disabled={!currentProject}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              currentProject 
                ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 text-white cursor-pointer' 
                : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
          >
            <Plus size={16} /> Nouvelle Page
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-neutral-600 animate-pulse uppercase tracking-widest text-xs">
              Chargement des contenus...
            </div>
          ) : pages.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-850 rounded-3xl text-neutral-600">
              <p className="uppercase tracking-widest text-xs font-bold">Aucune page créée pour le moment</p>
            </div>
          ) : (
            pages.map((page) => (
              <div 
                key={page.id} 
                onContextMenu={(e) => handleContextMenu(e, page.id)}
                className="relative"
              >
                <Link 
                  to={`/builder/${page.id}`}
                  className="block group bg-neutral-900/50 border border-neutral-850 p-6 rounded-2xl hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/5 duration-300 hover:bg-neutral-900"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-black rounded-xl border border-neutral-850 group-hover:border-blue-500/30 transition-all">
                      <FileText size={20} className="text-neutral-400 group-hover:text-blue-400" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      page.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {page.status}
                    </span>
                    {page.is_home && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-lg border border-blue-500 animate-in zoom-in duration-300" title="Page d'accueil">
                        <Plus size={12} className="rotate-45" /> {/* Just a visual marker, or use Home icon if imported */}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold mb-1 truncate group-hover:text-blue-400 transition-colors">{page.title}</h2>
                  <p className="text-neutral-500 text-xs font-mono mb-6 italic">/{page.slug}</p>
                  
                  <div className="flex gap-4 pt-4 border-t border-neutral-850/50">
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="text-neutral-600" />
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">SEO</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Search size={12} className="text-neutral-600" />
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">GEO</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 w-48 animate-in fade-in zoom-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              const p = pages.find(p => p.id === contextMenu.pageId)
              if (p) {
                setRenamingPage(p)
                setNewTitle(p.title)
              }
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Edit3 size={14} /> Renommer
          </button>
          <button 
            onClick={() => {
              handleDuplicate(contextMenu.pageId)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Copy size={14} /> Dupliquer
          </button>
          <div className="h-px bg-neutral-800 my-1" />
          <button 
            onClick={() => handleSetHome(contextMenu.pageId)}
            className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-blue-500 hover:text-white hover:bg-blue-600 transition-all"
          >
            <Plus size={14} className="rotate-45" /> Home Page
          </button>
          <div className="h-px bg-neutral-800 my-1" />
          <button 
            onClick={() => {
              handleDelete(contextMenu.pageId)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-white hover:bg-red-600 transition-colors"
          >
            <Trash size={14} /> Supprimer
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renamingPage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-6">Renommer la page</h3>
            <input 
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white mb-6 focus:border-blue-500 outline-none transition-all"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRenamingPage(null)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleRename}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0a] border border-neutral-800 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Configuration Navigation</h3>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase">Sera automatiquement ajouté aux nouvelles pages</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white">Fermer</button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
              {/* Section 1: Identité Visuelle */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-neutral-800 pb-2">Identité Visuelle</h4>
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Logo du site</label>
                    <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4">
                      {headerConfig?.logo && (
                        <div className="h-16 w-full bg-neutral-900/50 rounded-xl flex items-center justify-center p-2 border border-neutral-800/50">
                          <img src={headerConfig.logo} alt="Logo" className="max-h-full object-contain" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={headerConfig?.logo || ''}
                          onChange={(e) => setHeaderConfig({...headerConfig, logo: e.target.value})}
                          placeholder="URL du logo"
                          className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[10px] text-white focus:border-blue-500 outline-none transition-all"
                        />
                        <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all active:scale-95 whitespace-nowrap">
                          <Upload size={12} className="mr-2" /> Upload
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const formData = new FormData()
                                formData.append('file', e.target.files[0])
                                try {
                                  const res = await client.post('/media/upload', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                  })
                                  setHeaderConfig({...headerConfig, logo: res.data.url})
                                } catch (err) { console.error(err) }
                              }
                            }} 
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Taille</span>
                        <input 
                          type="text"
                          value={headerConfig?.logoHeight || '40px'}
                          onChange={(e) => setHeaderConfig({...headerConfig, logoHeight: e.target.value})}
                          className="w-20 bg-black border border-neutral-800 rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-neutral-800 pb-2">Palette de Couleurs</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-4 space-y-4">
                      <div>
                        <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Arrière-plan Header</label>
                        <div className="flex gap-2">
                          <input 
                            type="color"
                            value={headerConfig?.bg || '#ffffff'}
                            onChange={(e) => setHeaderConfig({...headerConfig, bg: e.target.value})}
                            className="h-10 w-12 bg-black border border-neutral-800 rounded-lg p-1 cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={headerConfig?.bg || ''}
                            onChange={(e) => setHeaderConfig({...headerConfig, bg: e.target.value})}
                            className="flex-1 bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white text-[10px] font-mono focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Couleur des Liens</label>
                        <div className="flex gap-2">
                          <input 
                            type="color"
                            value={headerConfig?.textColor || '#000000'}
                            onChange={(e) => setHeaderConfig({...headerConfig, textColor: e.target.value})}
                            className="h-10 w-12 bg-black border border-neutral-800 rounded-lg p-1 cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={headerConfig?.textColor || ''}
                            onChange={(e) => setHeaderConfig({...headerConfig, textColor: e.target.value})}
                            className="flex-1 bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white text-[10px] font-mono focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Navigation */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-neutral-800 pb-2">Structure de Navigation</h4>
                <div className="bg-neutral-900/20 border border-neutral-800 rounded-3xl p-6">
                  <MenuEditor 
                    items={headerConfig?.menuItems || []} 
                    onChange={(newItems) => setHeaderConfig({...headerConfig, menuItems: newItems})}
                    availablePages={pages.map(p => ({ title: p.title, slug: p.slug }))}
                  />
                </div>
              </section>

              {/* Section 3: Appel à l'action */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-neutral-800 pb-2">Bouton CTA</h4>
                <div className="bg-black/50 border border-neutral-800 rounded-3xl p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Libellé du bouton</label>
                      <input 
                        type="text"
                        value={headerConfig?.buttonLabel || ''}
                        onChange={(e) => setHeaderConfig({...headerConfig, buttonLabel: e.target.value})}
                        className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                        placeholder="Ex: Contact"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Lien de redirection</label>
                      <input 
                        type="text"
                        value={headerConfig?.buttonHref || ''}
                        onChange={(e) => setHeaderConfig({...headerConfig, buttonHref: e.target.value})}
                        className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                        placeholder="/contact"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800/50">
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Couleur de fond</label>
                      <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-lg p-1">
                        <input 
                          type="color"
                          value={headerConfig?.btnBg || '#2563eb'}
                          onChange={(e) => setHeaderConfig({...headerConfig, btnBg: e.target.value})}
                          className="h-8 w-12 bg-transparent border-none cursor-pointer p-0"
                        />
                        <input 
                          type="text"
                          value={headerConfig?.btnBg || ''}
                          onChange={(e) => setHeaderConfig({...headerConfig, btnBg: e.target.value})}
                          className="flex-1 bg-transparent border-none text-white text-[10px] font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Couleur du texte</label>
                      <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-lg p-1">
                        <input 
                          type="color"
                          value={headerConfig?.btnColor || '#ffffff'}
                          onChange={(e) => setHeaderConfig({...headerConfig, btnColor: e.target.value})}
                          className="h-8 w-12 bg-transparent border-none cursor-pointer p-0"
                        />
                        <input 
                          type="text"
                          value={headerConfig?.btnColor || ''}
                          onChange={(e) => setHeaderConfig({...headerConfig, btnColor: e.target.value})}
                          className="flex-1 bg-transparent border-none text-white text-[10px] font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Pied de page (Footer) */}
              <section className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-neutral-800 pb-2">Configuration Footer</h4>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Logo & Couleurs</label>
                      <div className="bg-black/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
                      <div className="flex flex-col gap-4">
                        {footerConfig?.logo && (
                          <div className="h-16 w-full bg-neutral-900/50 rounded-xl flex items-center justify-center p-2 border border-neutral-800/50">
                            <img src={footerConfig.logo} alt="Footer Logo" className="max-h-full object-contain" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={footerConfig?.logo || ''}
                            onChange={(e) => setFooterConfig({...footerConfig, logo: e.target.value})}
                            placeholder="URL du logo footer"
                            className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[10px] text-white focus:border-blue-500 outline-none transition-all"
                          />
                          <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all active:scale-95 whitespace-nowrap">
                            <Upload size={12} className="mr-2" /> Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={handleFooterLogoUpload} 
                            />
                          </label>
                        </div>
                      </div>
                        <div className="grid grid-cols-2 gap-6 pt-2">
                          <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-lg p-1.5">
                            <input type="color" value={footerConfig?.bg || '#111111'} onChange={(e) => setFooterConfig({...footerConfig, bg: e.target.value})} className="h-8 w-10 bg-transparent border-none cursor-pointer" />
                            <span className="text-[10px] text-neutral-400 font-mono">Fond</span>
                          </div>
                          <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-lg p-1.5">
                            <input type="color" value={footerConfig?.textColor || '#ffffff'} onChange={(e) => setFooterConfig({...footerConfig, textColor: e.target.value})} className="h-8 w-10 bg-transparent border-none cursor-pointer" />
                            <span className="text-[10px] text-neutral-400 font-mono">Texte</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Informations</label>
                      <div className="bg-black/50 border border-neutral-800 rounded-2xl p-6 h-full">
                        <label className="text-[8px] font-bold text-neutral-600 uppercase mb-2 block">Texte de Copyright</label>
                        <input 
                          type="text"
                          value={footerConfig?.copyright || ''}
                          onChange={(e) => setFooterConfig({...footerConfig, copyright: e.target.value})}
                          className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-xs text-white focus:border-blue-500 outline-none"
                          placeholder="© 2024 Votre Entreprise..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Structure des colonnes de liens</label>
                    <div className="bg-neutral-900/20 border border-neutral-800 rounded-3xl p-8">
                      <div className="flex items-start gap-4 mb-6 bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                        <div className="mt-0.5 bg-blue-500/20 p-1.5 rounded-md text-blue-400">
                          <Settings size={14} />
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                          <strong className="text-blue-400 uppercase tracking-tighter mr-1">Astuce :</strong> 
                          Créez des éléments de premier niveau pour les titres de colonnes (ex: "Produits", "Légal"), puis ajoutez des sous-liens à l'intérieur pour remplir les colonnes.
                        </p>
                      </div>
                      <MenuEditor 
                        items={footerConfig?.columns || []} 
                        onChange={(newCols) => setFooterConfig({...footerConfig, columns: newCols})}
                        availablePages={pages.map(p => ({ title: p.title, slug: p.slug }))}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-neutral-800 flex justify-end gap-3">
               <button onClick={() => setShowSettings(false)} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">Annuler</button>
               <button 
                onClick={handleUpdateSettings}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
               >
                 Enregistrer Globalement
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-center transform animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${notification.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {notification.type === 'success' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{notification.type === 'success' ? 'Félicitations !' : 'Oups !'}</h3>
            <p className="text-neutral-500 text-sm font-medium mb-10 leading-relaxed">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
                notification.type === 'success'
                ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20'
                : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
              }`}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {createProjectModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest">Créer un projet</h3>
              <button onClick={() => setCreateProjectModal(false)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nom du projet</label>
                <input type="text" className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Mon Site" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Slug</label>
                <input type="text" className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="mon-site" value={newProjectSlug} onChange={(e) => setNewProjectSlug(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Description</label>
                <textarea className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Description du projet..." value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Template de départ</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                >
                  <option value="">Page vierge (aucun template)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCreateProjectModal(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Annuler</button>
              <button onClick={handleCreateProject} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all">Créer le projet</button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default DashboardPage
