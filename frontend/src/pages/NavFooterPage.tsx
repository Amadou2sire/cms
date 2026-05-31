import React, { useEffect, useState } from 'react'
import client from '../api/client'
import { Link } from 'react-router-dom'
import MenuEditor from '../builder/components/MenuEditor'
import { useProject } from '../contexts/ProjectContext'
import { Plus, FileText, Globe, Search, Copy, Edit3, Trash, Settings, Menu, Upload, Newspaper, Briefcase, ChevronDown, X, Box, Database, ClipboardList, Download, Users, Zap, ArrowLeft } from 'lucide-react'

interface Page {
  id: string
  title: string
  slug: string
  status: string
  is_home: boolean
  updated_at: string
}

const NavFooterPage: React.FC = () => {
  const { currentProject, defaultLanguage } = useProject()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [footerConfig, setFooterConfig] = useState<any>(null)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

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
    if (currentProject) {
      fetchPages()
      fetchSettings()
    }
  }, [currentProject])

  const handleUpdateSettings = async () => {
    try {
      await Promise.all([
        client.put('/settings/header', headerConfig),
        client.put('/settings/footer', footerConfig)
      ])
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

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          <header className="mb-10 pb-6 border-b border-neutral-900">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Configuration Navigation</h1>
              <p className="text-neutral-500 text-sm mt-1">Will be automatically added to new pages</p>
            </div>
          </header>

          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Configuration Navigation</h3>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase">Sera automatiquement ajouté aux nouvelles pages</p>
              </div>
              <button
                onClick={handleUpdateSettings}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Enregistrer Globalement
              </button>
            </div>

            <div className="p-8 space-y-10 custom-scrollbar">
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
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-850">
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Header Fixe (Fixed)</span>
                          <span className="text-[8px] text-neutral-600 uppercase block">Flotte en haut de l'écran lors du défilement</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHeaderConfig({...headerConfig, sticky: headerConfig?.sticky === 'true' ? 'false' : 'true'})}
                          className={`
                            w-10 h-5 rounded-full transition-colors duration-205 relative shrink-0
                            ${headerConfig?.sticky === 'true' ? 'bg-blue-600' : 'bg-neutral-800'}
                          `}
                        >
                          <div className={`
                            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-205
                            ${headerConfig?.sticky === 'true' ? 'translate-x-5' : 'translate-x-0.5'}
                          `} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-850">
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Alignement des liens</span>
                          <span className="text-[8px] text-neutral-600 uppercase block">Positionnement des liens dans la barre</span>
                        </div>
                        <select
                          value={headerConfig?.alignMenu || 'left'}
                          onChange={(e) => setHeaderConfig({...headerConfig, alignMenu: e.target.value})}
                          className="bg-black border border-neutral-800 rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none cursor-pointer font-bold uppercase tracking-wider"
                        >
                          <option value="left">Gauche</option>
                          <option value="center">Milieu</option>
                          <option value="right">Droite</option>
                        </select>
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
                    onChange={(newItems: any) => setHeaderConfig({...headerConfig, menuItems: newItems})}
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
                        onChange={(newCols: any) => setFooterConfig({...footerConfig, columns: newCols})}
                        availablePages={pages.map(p => ({ title: p.title, slug: p.slug }))}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Notification */}
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
    </div>
  )
}

export default NavFooterPage
