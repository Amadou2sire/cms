import React, { useState, useEffect, useRef } from 'react'
import { useProject } from '../contexts/ProjectContext'
import client from '../api/client'
import {
  Settings,
  Globe,
  Type,
  Save,
  CheckCircle,
  AlertCircle,
  Languages,
  Info,
  ImageIcon,
  Upload,
  X,
  Link as LinkIcon,
} from 'lucide-react'

const AVAILABLE_LANGUAGES = [
  { code: 'fr', label: 'Français', abbr: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'English', abbr: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', abbr: 'AR', flag: '🇸🇦' },
]

const SiteSettingsPage: React.FC = () => {
  const { currentProject, refreshProjects } = useProject()

  // Project fields
  const [siteName, setSiteName] = useState('')
  const [defaultLanguage, setDefaultLanguage] = useState('fr')
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(['fr'])

  // Favicon
  const [faviconUrl, setFaviconUrl] = useState('')
  const [faviconInput, setFaviconInput] = useState('')   // URL saisie manuellement
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [faviconMode, setFaviconMode] = useState<'url' | 'upload'>('upload')
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Existing header_config (to preserve other fields when saving favicon)
  const [headerConfig, setHeaderConfig] = useState<any>({})

  // Save state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load project + settings
  useEffect(() => {
    if (currentProject) {
      setSiteName(currentProject.name || '')
      setDefaultLanguage(currentProject.default_language || 'fr')
      setEnabledLanguages(currentProject.languages || ['fr'])

      // Fetch current site settings (header_config contains faviconUrl)
      client.get(`/settings/?project_id=${currentProject.id}`)
        .then(res => {
          const config = res.data.header_config || {}
          setHeaderConfig(config)
          const existingFavicon = config.faviconUrl || ''
          setFaviconUrl(existingFavicon)
          setFaviconInput(existingFavicon)
        })
        .catch(() => {})
    }
  }, [currentProject])

  const toggleLanguage = (code: string) => {
    if (code === defaultLanguage) return
    setEnabledLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    )
  }

  const handleDefaultLanguageChange = (code: string) => {
    setDefaultLanguage(code)
    if (!enabledLanguages.includes(code)) {
      setEnabledLanguages(prev => [...prev, code])
    }
  }

  // Upload favicon file
  const handleFaviconFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentProject) return

    // Accept image/* and .ico
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      setError('Le favicon doit être une image (PNG, ICO, SVG…).')
      return
    }

    setFaviconUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await client.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFaviconUrl(res.data.url)
      setFaviconInput(res.data.url)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Échec de l'upload du favicon.")
    } finally {
      setFaviconUploading(false)
      if (faviconInputRef.current) faviconInputRef.current.value = ''
    }
  }

  const handleApplyUrlFavicon = () => {
    setFaviconUrl(faviconInput.trim())
  }

  const handleRemoveFavicon = () => {
    setFaviconUrl('')
    setFaviconInput('')
  }

  // Apply favicon to browser in real-time preview
  const applyFaviconToBrowser = (url: string) => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url || '/favicon.ico'
  }

  useEffect(() => {
    if (faviconUrl) applyFaviconToBrowser(faviconUrl)
  }, [faviconUrl])

  const handleSave = async () => {
    if (!currentProject) return
    if (!siteName.trim()) {
      setError('Le nom du site ne peut pas être vide.')
      return
    }
    if (enabledLanguages.length === 0) {
      setError('Vous devez activer au moins une langue.')
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      // 1. Update project (name + languages)
      await client.put(`/projects/${currentProject.id}`, {
        name: siteName.trim(),
        default_language: defaultLanguage,
        languages: enabledLanguages,
      })

      // 2. Update header_config with faviconUrl (preserve other fields)
      const newHeaderConfig = { ...headerConfig, faviconUrl: faviconUrl }
      await client.put('/settings/header', newHeaderConfig)
      setHeaderConfig(newHeaderConfig)

      await refreshProjects()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Info size={40} className="text-neutral-600 mx-auto" />
          <p className="text-neutral-400 text-sm font-medium">
            Aucun projet sélectionné. Choisissez un projet dans la barre latérale.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Settings size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Paramètres du Site
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Nom, favicon et langue par défaut du site public
            </p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {saved && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-green-400 shrink-0" />
          <span className="text-green-400 text-xs font-bold">
            Paramètres sauvegardés avec succès !
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-xs font-bold">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Card: Site Name */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/60">
          <Type size={16} className="text-blue-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">
            Nom du Site
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">
            Nom affiché dans la barre de navigation
          </label>
          <input
            type="text"
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            placeholder="Ex: Mon Entreprise"
            className="w-full bg-black border border-neutral-800 text-white text-sm font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-700"
          />
          <p className="text-[11px] text-neutral-600 px-1">
            Ce nom apparaît dans la barre latérale du dashboard et dans l'onglet du navigateur.
          </p>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">
            Aperçu sidebar
          </label>
          <div className="bg-black border border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3">
            {faviconUrl ? (
              <img src={faviconUrl} alt="favicon" className="w-7 h-7 rounded-lg object-contain bg-neutral-900 border border-neutral-800 p-0.5" />
            ) : (
              <div className="w-7 h-7 bg-blue-600/10 rounded-lg border border-blue-500/25 flex items-center justify-center">
                <Globe size={14} className="text-blue-400" />
              </div>
            )}
            <div>
              <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest block">
                Plateforme CMS
              </span>
              <span className="text-sm font-black uppercase tracking-tighter text-white">
                {siteName || 'Nom du site...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card: Favicon */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/60">
          <ImageIcon size={16} className="text-orange-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">
            Favicon
          </h2>
          <span className="ml-auto text-[10px] text-neutral-600 font-medium">
            Icône de l'onglet du navigateur
          </span>
        </div>

        {/* Current favicon preview */}
        <div className="flex items-center gap-5">
          {/* Preview box */}
          <div className="shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-black border-2 border-dashed border-neutral-800 flex items-center justify-center overflow-hidden relative group">
              {faviconUrl ? (
                <>
                  <img
                    src={faviconUrl}
                    alt="Favicon"
                    className="w-12 h-12 object-contain"
                    onError={() => setFaviconUrl('')}
                  />
                  <button
                    onClick={handleRemoveFavicon}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X size={18} className="text-red-400" />
                  </button>
                </>
              ) : (
                <ImageIcon size={24} className="text-neutral-700" />
              )}
            </div>
            <p className="text-[9px] text-neutral-600 text-center mt-1.5 uppercase tracking-wider">
              {faviconUrl ? 'Actuel' : 'Aucun'}
            </p>
          </div>

          {/* Tab simulation */}
          <div className="flex-1 space-y-2">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
              Aperçu onglet navigateur
            </p>
            <div className="bg-neutral-900 rounded-lg px-3 py-2 flex items-center gap-2 border border-neutral-800 w-fit max-w-[220px]">
              {faviconUrl ? (
                <img src={faviconUrl} alt="" className="w-4 h-4 object-contain shrink-0"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <Globe size={14} className="text-neutral-600 shrink-0" />
              )}
              <span className="text-[11px] text-neutral-300 font-medium truncate">
                {siteName || 'Mon Site'}
              </span>
              <X size={10} className="text-neutral-600 shrink-0 ml-1" />
            </div>
            <p className="text-[11px] text-neutral-600">
              Format recommandé : PNG ou ICO, 32×32 ou 64×64 px
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setFaviconMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              faviconMode === 'upload'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-black border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Upload size={12} /> Importer un fichier
          </button>
          <button
            onClick={() => setFaviconMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              faviconMode === 'url'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-black border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <LinkIcon size={12} /> Saisir une URL
          </button>
        </div>

        {/* Upload mode */}
        {faviconMode === 'upload' && (
          <div>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/*,.ico"
              className="hidden"
              onChange={handleFaviconFile}
            />
            <button
              onClick={() => faviconInputRef.current?.click()}
              disabled={faviconUploading}
              className={`
                w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 transition-all duration-200
                ${faviconUploading
                  ? 'border-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'border-neutral-800 hover:border-orange-500/40 hover:bg-orange-500/5 text-neutral-500 hover:text-orange-400 cursor-pointer'
                }
              `}
            >
              {faviconUploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-neutral-600 border-t-orange-400 rounded-full animate-spin" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Chargement…</span>
                </>
              ) : (
                <>
                  <Upload size={22} />
                  <div className="text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Cliquer pour uploader
                    </span>
                    <span className="text-[10px] text-neutral-700">PNG, ICO, SVG, WebP</span>
                  </div>
                </>
              )}
            </button>
          </div>
        )}

        {/* URL mode */}
        {faviconMode === 'url' && (
          <div className="flex gap-2">
            <input
              type="url"
              value={faviconInput}
              onChange={e => setFaviconInput(e.target.value)}
              placeholder="https://example.com/favicon.ico"
              className="flex-1 bg-black border border-neutral-800 text-white text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500/60 transition-colors placeholder:text-neutral-700"
            />
            <button
              onClick={handleApplyUrlFavicon}
              disabled={!faviconInput.trim()}
              className="px-4 py-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>

      {/* Card: Languages */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/60">
          <Languages size={16} className="text-purple-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">
            Langues du Site
          </h2>
        </div>

        {/* Default Language */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">
            Langue par défaut
          </label>
          <div className="grid grid-cols-3 gap-3">
            {AVAILABLE_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleDefaultLanguageChange(lang.code)}
                className={`
                  relative flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border font-bold transition-all duration-200
                  ${defaultLanguage === lang.code
                    ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white'
                  }
                `}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-base font-black tracking-widest">{lang.abbr}</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider">{lang.label}</span>
                {defaultLanguage === lang.code && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-600 px-1">
            La langue par défaut sera utilisée pour les visiteurs sans préférence de langue détectée.
          </p>
        </div>

        {/* Enabled Languages */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">
            Langues actives sur le site
          </label>
          <div className="space-y-2">
            {AVAILABLE_LANGUAGES.map(lang => {
              const isDefault = lang.code === defaultLanguage
              const isEnabled = enabledLanguages.includes(lang.code)
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  disabled={isDefault}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200
                    ${isEnabled
                      ? 'bg-green-500/5 border-green-500/30 text-white'
                      : 'bg-black border-neutral-800 text-neutral-500'
                    }
                    ${isDefault ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-600'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black tracking-widest">{lang.abbr}</span>
                        <span className="text-[10px] text-neutral-500 font-medium">{lang.label}</span>
                      </div>
                      <span className="text-[10px] text-neutral-600">
                        {isDefault ? 'Langue par défaut' : ''}
                      </span>
                    </div>
                  </div>
                  {/* Toggle */}
                  <div className={`
                    w-10 h-5 rounded-full transition-colors duration-200 relative
                    ${isEnabled ? 'bg-green-500' : 'bg-neutral-800'}
                  `}>
                    <div className={`
                      absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                      ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}
                    `} />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-neutral-600 px-1">
            La langue par défaut est toujours active et ne peut pas être désactivée.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200
            ${saving
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20'
            }
          `}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save size={14} />
              Sauvegarder les paramètres
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default SiteSettingsPage
