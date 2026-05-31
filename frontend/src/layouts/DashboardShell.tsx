import React, { useRef, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import client from '../api/client'
import { Globe, Briefcase, ChevronDown, FileText, Menu, Newspaper, Box, ClipboardList, Users, Zap, Settings } from 'lucide-react'

const DashboardShell: React.FC = () => {
  const { projects, currentProject, setCurrentProject, defaultLanguage } = useProject()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Placeholder handlers for export/import – no‑op for now
  const handleExport = () => {}
  const handleImport = () => {}

  // Sync browser tab title and favicon with current project
  useEffect(() => {
    if (currentProject?.name) {
      document.title = `${currentProject.name} | CMS Dashboard`
    } else {
      document.title = 'CMS Dashboard'
    }

    if (currentProject?.id) {
      client.get(`/settings/?project_id=${currentProject.id}`)
        .then(res => {
          const favicon = res.data.header_config?.faviconUrl || ''
          let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = favicon || '/5069fav.ico'
        })
        .catch(err => {
          console.error("Failed to fetch site settings in DashboardShell", err)
        })
    } else {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
      if (link) {
        link.href = '/5069fav.ico'
      }
    }
  }, [currentProject])

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-neutral-950 border-r border-neutral-900 flex flex-col h-screen sticky top-0 justify-between p-6 z-10 shrink-0 select-none">
        <div className="flex flex-col gap-8 overflow-y-auto pr-1">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-inner">
              <Globe size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest block">Plateforme CMS</span>
              <span className="text-base font-black uppercase tracking-tighter text-white">{currentProject?.name || 'SaaS Panel'}</span>
            </div>
          </div>

          {/* Project Selector Box */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block px-1">Projet Actif</label>
              <div className="relative">
                <select
                  value={currentProject?.id || ''}
                  onChange={(e) => {
                    const p = projects.find(p => p.id === e.target.value)
                    if (p) setCurrentProject(p)
                  }}
                  className="w-full bg-black border border-neutral-850 text-white text-xs font-bold uppercase tracking-widest px-4 py-3 pr-8 rounded-xl appearance-none focus:outline-none focus:border-blue-500 cursor-pointer transition-all hover:border-neutral-700"
                >
                  <option value="" disabled>Sélectionner...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            <button
              onClick={() => {/* open create project modal – not implemented in shell */}}
              className="w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-400 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-green-500/20 hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              <Briefcase size={14} /> Nouveau Projet
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block px-2">Navigation</span>
            <nav className="flex flex-col gap-1">
              <Link to="/dashboard" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard' ? 'bg-blue-600/20 text-white' : 'bg-blue-600/10 text-blue-400'} border border-blue-500/20 text-left transition-all duration-200`}>
                <FileText size={16} /> Pages du Site
              </Link>
              <Link to="/dashboard/nav-footer" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard/nav-footer' ? 'bg-blue-600/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <Menu size={16} className="text-blue-500" /> Nav & Footer
              </Link>
              <Link to="/dashboard/articles" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname.startsWith('/dashboard/articles') ? 'bg-blue-600/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <Newspaper size={16} className="text-orange-500" /> Actualités
              </Link>
              <Link to="/dashboard/components" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard/components' ? 'bg-blue-600/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <Box size={16} className="text-purple-500" /> Composants
              </Link>
              <Link to="/dashboard/forms" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard/forms' ? 'bg-blue-600/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <ClipboardList size={16} className="text-pink-500" /> Formulaires
              </Link>
              <Link to="/dashboard/team" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard/team' ? 'bg-blue-600/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <Users size={16} className="text-purple-500" /> Équipe
              </Link>
              <Link to="/dashboard/webhooks" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard/webhooks' ? 'bg-blue-600/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <Zap size={16} className="text-yellow-500" /> Webhooks
              </Link>
            </nav>
          </div>

          {/* Site Settings */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block px-2">Configuration</span>
            <nav className="flex flex-col gap-1">
              <Link to="/dashboard/site-settings" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${location.pathname === '/dashboard/site-settings' ? 'bg-indigo-600/20 text-white border border-indigo-500/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1'} transition-all duration-200`}>
                <Settings size={16} className="text-indigo-400" /> Paramètres du Site
              </Link>
            </nav>
          </div>

          {/* Import / Export – placeholder only */}
          {currentProject && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block px-2">Transfert</span>
              <nav className="flex flex-col gap-1">
                <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1 transition-all duration-200">
                  Export Projet
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-900/60 hover:translate-x-1 transition-all duration-200">
                  Import Projet
                </button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Profile */}
        <div className="pt-4 border-t border-neutral-900/60">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs uppercase text-neutral-400">A</div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block">Administrateur</span>
              <span className="text-[9px] text-neutral-600 block">CMS Session</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content rendered by nested routes */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardShell
