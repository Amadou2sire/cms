import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import ReactQuill, { Quill } from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { Save, Upload, ArrowLeft, ArrowUp, ArrowDown, Settings, Trash, Plus, X } from 'lucide-react'
import { BLOCK_REGISTRY, type PropDefinition } from '../builder/BlockRegistry'
import BlockRenderer from '../builder/BlockRenderer'
import * as LucideIcons from 'lucide-react'

// Ensure table module is registered before the editor is used.
const TableModule = Quill.import('modules/table')
if (TableModule) {
  Quill.register('modules/table', TableModule, true)
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['blockquote', 'code-block', 'formula'],
    ['link', 'image', 'video', 'table'],
    ['clean']
  ],
  table: true,
  history: {
    delay: 500,
    maxStack: 100,
    userOnly: true
  }
}

const quillFormats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'script',
  'list',
  'bullet',
  'indent',
  'align',
  'blockquote',
  'code-block',
  'formula',
  'link',
  'image',
  'video',
  'table'
]

interface Article {
  id: string
  title: string
  slug: string
  image_url: string | null
  content: string
  status: string
  meta_title: string | null
  meta_description: string | null
  category: string
}

interface ContentBlock {
  id: string
  type: string
  data: Record<string, any>
}

const ALLOWED_ARTICLE_BLOCKS = [
  { type: 'richtext', label: 'Texte riche', icon: 'FileText' },
  { type: 'heading', label: 'Titre', icon: 'Heading' },
  { type: 'text', label: 'Texte', icon: 'AlignLeft' },
  { type: 'image', label: 'Image', icon: 'Image' },
  { type: 'button', label: 'Bouton', icon: 'MousePointerClick' },
  { type: 'gallery', label: 'Galerie', icon: 'Images' },
  { type: 'faq', label: 'FAQ', icon: 'HelpCircle' },
  { type: 'table', label: 'Tableau', icon: 'Table' },
  { type: 'testimonial', label: 'Témoignage', icon: 'MessageCircle' },
  { type: 'about', label: 'À Propos', icon: 'Info' },
  { type: 'features', label: 'Grille d\'Excellence', icon: 'LayoutGrid' },
  { type: 'cta_split', label: 'CTA Split', icon: 'Split' },
  { type: 'innovation', label: 'Innovation', icon: 'Cpu' },
  { type: 'quality', label: 'Qualité', icon: 'Shield' },
  { type: 'lab', label: 'Laboratoire', icon: 'Activity' },
  { type: 'mission_vision', label: 'Mission & Vision', icon: 'Target' },
  { type: 'contact_banner', label: 'Bannière Contact', icon: 'Mail' },
  { type: 'map', label: 'Carte', icon: 'MapPin' },
  { type: 'stats', label: 'Statistiques', icon: 'BarChart3' }
]

const parseContentToBlocks = (content: string): { blocks: ContentBlock[], relatedArticleIds: string[] } => {
  if (!content) {
    return {
      blocks: [
        {
          id: 'default-richtext',
          type: 'richtext',
          data: { html: '' }
        }
      ],
      relatedArticleIds: []
    }
  }
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && parsed.version === 2 && Array.isArray(parsed.blocks)) {
      return {
        blocks: parsed.blocks,
        relatedArticleIds: Array.isArray(parsed.related_article_ids) ? parsed.related_article_ids : []
      }
    }
  } catch (e) {
    // Treat as HTML
  }
  return {
    blocks: [
      {
        id: 'default-richtext',
        type: 'richtext',
        data: { html: content }
      }
    ],
    relatedArticleIds: []
  }
}

const serializeBlocksToContent = (blocks: ContentBlock[], relatedArticleIds: string[]): string => {
  return JSON.stringify({
    version: 2,
    blocks,
    related_article_ids: relatedArticleIds
  })
}

const ArticleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    image_url: null,
    meta_title: '',
    meta_description: '',
    category: 'News'
  })
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [relatedArticleIds, setRelatedArticleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Block creation/modification state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [addingBlockAtIndex, setAddingBlockAtIndex] = useState<number | null>(null)
  const [blockSearchQuery, setBlockSearchQuery] = useState('')

  useEffect(() => {
    // Fetch all articles for recommendation selector
    client.get('/articles/')
      .then(res => {
        setAllArticles(res.data)
      })
      .catch(err => {
        console.error("Failed to fetch all articles", err)
      })

    if (id) {
      setLoading(true)
      client.get(`/articles/${id}`)
        .then(res => {
          setArticle(res.data)
          const parsed = parseContentToBlocks(res.data.content || '')
          setBlocks(parsed.blocks)
          setRelatedArticleIds(parsed.relatedArticleIds)
          setLoading(false)
        })
        .catch(err => {
          console.error("Failed to fetch article", err)
          setLoading(false)
        })
    } else {
      setBlocks([
        {
          id: 'default-richtext',
          type: 'richtext',
          data: { html: '' }
        }
      ])
      setRelatedArticleIds([])
    }
  }, [id])

  const handleSave = async () => {
    if (!article.title) {
      alert("Le titre est obligatoire")
      return
    }
    const generatedSlug = article.slug?.trim().length
      ? article.slug.trim()
      : `${article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}-${Date.now()}`
    
    const payload = { 
      ...article, 
      slug: generatedSlug,
      content: serializeBlocksToContent(blocks, relatedArticleIds)
    }

    try {
      if (id) {
        await client.put(`/articles/${id}`, payload)
      } else {
        await client.post('/articles/', payload)
      }
      navigate('/dashboard/articles')
    } catch (err) {
      console.error("Failed to save article", err)
      alert("Erreur lors de l'enregistrement")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', e.target.files[0])
      try {
        const res = await client.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setArticle(prev => ({ ...prev, image_url: res.data.url }))
      } catch (err) {
        console.error("Upload failed", err)
        alert("Erreur d'upload")
      } finally {
        setUploading(false)
      }
    }
  }

  // Block management helpers
  const addBlock = (type: string, index: number) => {
    const defaultProps = type === 'richtext' ? { html: '' } : { ...(BLOCK_REGISTRY[type]?.defaultProps || {}) }
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: defaultProps
    }
    const newBlocks = [...blocks]
    newBlocks.splice(index, 0, newBlock)
    setBlocks(newBlocks)
    setAddingBlockAtIndex(null)
    setBlockSearchQuery('')
    if (type !== 'richtext') {
      setEditingBlockId(newBlock.id)
    }
  }

  const deleteBlock = (blockId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce bloc ?")) {
      setBlocks(prev => prev.filter(b => b.id !== blockId))
      if (editingBlockId === blockId) {
        setEditingBlockId(null)
      }
    }
  }

  const moveBlockUp = (index: number) => {
    if (index === 0) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index - 1]
    newBlocks[index - 1] = temp
    setBlocks(newBlocks)
  }

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index + 1]
    newBlocks[index + 1] = temp
    setBlocks(newBlocks)
  }

  const updateBlockData = (blockId: string, newData: Record<string, any>) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          data: {
            ...block.data,
            ...newData
          }
        }
      }
      return block
    }))
  }

  const renderPropertyInput = (
    blockId: string,
    key: string,
    prop: PropDefinition,
    value: any,
    onChange: (val: any) => void
  ) => {
    const val = value !== undefined ? value : prop.default;

    switch (prop.type) {
      case 'string':
        return (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
        )
      case 'richtext':
        return (
          <textarea
            value={val || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all resize-none"
          />
        )
      case 'select':
        return (
          <select
            value={val}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
          >
            {prop.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'color':
        return (
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-2">
            <input
              type="color"
              value={val || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-12 bg-transparent border-none rounded cursor-pointer p-0"
            />
            <input
              type="text"
              value={val || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-transparent border-none text-[10px] font-mono text-white focus:outline-none"
            />
          </div>
        )
      case 'spacing':
        return (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ex: 10px 20px 10px 20px"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
        )
      case 'media':
        const isVideo = typeof val === 'string' && (
          val.toLowerCase().endsWith('.mp4') || 
          val.toLowerCase().endsWith('.webm') || 
          val.toLowerCase().endsWith('.ogg') || 
          val.toLowerCase().endsWith('.mov') ||
          (val.includes('/uploads/') && !val.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg|ico)$/))
        )
        return (
          <div className="space-y-2">
            {val && (
              isVideo ? (
                <video src={val} className="w-full h-24 object-cover rounded-xl border border-neutral-800" muted playsInline />
              ) : (
                <img src={val} alt="Preview" className="w-full h-24 object-cover rounded-xl border border-neutral-800" />
              )
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={val || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="URL du média"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:border-blue-500 outline-none"
              />
              <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-4 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center transition-colors">
                Up
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const formData = new FormData()
                      formData.append('file', e.target.files[0])
                      try {
                        const res = await client.post('/media/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        })
                        onChange(res.data.url)
                      } catch (err) {
                        console.error("Upload failed", err)
                        alert("Erreur lors de l'upload")
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )
      case 'list':
        return (
          <div className="space-y-4 col-span-1 md:col-span-2 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
            {(val || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="bg-neutral-850 px-3 py-2 flex items-center justify-between border-b border-neutral-800">
                  <span className="text-[9px] font-black uppercase text-neutral-500">#{idx + 1}</span>
                  <button 
                    onClick={() => {
                      const newList = [...(val || [])]
                      newList.splice(idx, 1)
                      onChange(newList)
                    }}
                    className="text-neutral-500 hover:text-red-500 transition-colors"
                  >
                    <Trash size={12} />
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  {prop.itemSchema && Object.entries(prop.itemSchema).map(([fKey, fProp]) => (
                    <div key={fKey} className="space-y-1">
                      <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{fProp.label}</label>
                      {renderPropertyInput(blockId, `${key}.${idx}.${fKey}`, fProp, item[fKey], (fieldVal) => {
                        const newList = [...(val || [])]
                        newList[idx] = { ...newList[idx], [fKey]: fieldVal }
                        onChange(newList)
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={() => {
                const newItem = Object.keys(prop.itemSchema || {}).reduce((acc: any, k) => {
                  acc[k] = prop.itemSchema![k].default
                  return acc
                }, {})
                onChange([...(val || []), newItem])
              }}
              className="w-full py-2.5 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 hover:text-blue-500 hover:border-blue-500/50 transition-all text-[9px] font-black uppercase tracking-widest"
            >
              + Ajouter un élément
            </button>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col gap-4">
            <Link 
              to="/dashboard/articles" 
              className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Retour à la liste
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              {id ? 'Modifier l\'article' : 'Nouvel Article'}
            </h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard/articles')}
              className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
            >
              <Save size={16} /> Enregistrer
            </button>
          </div>
        </header>

        <div className="space-y-12">
          {/* Titre */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Titre de l'article</label>
            <input 
              type="text"
              value={article.title || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4 text-white text-xl font-bold focus:border-blue-500 outline-none transition-all"
              placeholder="Entrez un titre accrocheur..."
            />
          </div>

          {/* Slug */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Slug (URL personnalisée)</label>
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4">
              <span className="text-neutral-600 text-sm font-mono">/articles/</span>
              <input 
                type="text"
                value={article.slug || ''}
                onChange={(e) => setArticle(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 bg-transparent text-white text-sm font-mono focus:outline-none"
                placeholder="mon-article-seo"
              />
            </div>
            <p className="text-[9px] text-neutral-600 uppercase tracking-widest italic">Laissez vide pour générer automatiquement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Image */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Image de couverture</label>
              <div className="relative aspect-video bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 group">
                {article.image_url ? (
                  <>
                    <img src={article.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-black px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                        Changer l'image
                        <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-800 transition-all">
                    <Upload size={40} className="text-neutral-700 mb-4" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Cliquer pour uploader</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Statut de publication</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setArticle(prev => ({ ...prev, status: 'draft' }))}
                  className={`flex-1 py-5 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${
                    article.status === 'draft' 
                    ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  Brouillon
                </button>
                <button 
                  onClick={() => setArticle(prev => ({ ...prev, status: 'published' }))}
                  className={`flex-1 py-5 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${
                    article.status === 'published' 
                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  Publié
                </button>
              </div>
            </div>

            {/* Catégorie */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Catégorie</label>
              <select
                value={article.category || 'News'}
                onChange={(e) => setArticle(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-[62px] bg-neutral-900 border border-neutral-800 rounded-2xl px-6 text-neutral-400 font-bold text-xs uppercase tracking-widest focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer hover:border-neutral-700"
              >
                <option value="Tous">Tous (Non recommandé)</option>
                <option value="RSE">RSE</option>
                <option value="Partenariat">Partenariat</option>
                <option value="Teambuilding">Teambuilding</option>
                <option value="Etudes">Etudes</option>
                <option value="Panel">Panel</option>
                <option value="News">News</option>
              </select>
            </div>
          </div>

          {/* SEO Section */}
          <div className="space-y-8 p-8 bg-neutral-900/30 rounded-[2.5rem] border border-neutral-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Paramètres SEO</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Meta Titre (SEO)</label>
                <input 
                  type="text"
                  value={article.meta_title || ''}
                  onChange={(e) => setArticle(prev => ({ ...prev, meta_title: e.target.value }))}
                  className="w-full bg-black border border-neutral-800 rounded-2xl px-6 py-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                  placeholder="Le titre qui apparaîtra dans Google..."
                />
                <p className="text-[9px] text-neutral-600 uppercase tracking-widest">Recommandé : 50-60 caractères</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Meta Description (SEO)</label>
                <textarea 
                  value={article.meta_description || ''}
                  onChange={(e) => setArticle(prev => ({ ...prev, meta_description: e.target.value }))}
                  className="w-full bg-black border border-neutral-800 rounded-2xl px-6 py-4 text-white text-sm focus:border-blue-500 outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Le résumé qui apparaîtra dans Google..."
                />
                <p className="text-[9px] text-neutral-600 uppercase tracking-widest">Recommandé : 150-160 caractères</p>
              </div>
            </div>
          </div>

          {/* Related Articles Selection */}
          <div className="space-y-6 p-8 bg-neutral-900/30 rounded-[2.5rem] border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Articles suggérés (Lire aussi)</h3>
              </div>
              <span className="text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full">
                {relatedArticleIds.length} / 4 Sélectionnés
              </span>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Sélectionnez manuellement jusqu'à 4 articles à suggérer à la fin de cette actualité. Si aucun article n'est coché, les articles les plus récents seront automatiquement affichés.
            </p>

            <div className="max-h-[300px] overflow-y-auto border border-neutral-800 rounded-2xl bg-black/40 p-4 divide-y divide-neutral-900 custom-scrollbar">
              {allArticles
                .filter(a => a.id !== id) // Exclude current article
                .map((art) => {
                  const isChecked = relatedArticleIds.includes(art.id)
                  const handleCheckChange = () => {
                    if (isChecked) {
                      setRelatedArticleIds(prev => prev.filter(item => item !== art.id))
                    } else {
                      if (relatedArticleIds.length >= 4) {
                        alert("Vous pouvez sélectionner un maximum de 4 articles suggérés.")
                        return
                      }
                      setRelatedArticleIds(prev => [...prev, art.id])
                    }
                  }

                  return (
                    <label 
                      key={art.id}
                      className="flex items-center justify-between py-3.5 px-2 hover:bg-neutral-900/40 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleCheckChange}
                          className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-black"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">{art.title}</span>
                          <span className="text-[9px] uppercase tracking-widest text-neutral-600 font-mono">{art.category || 'News'} — {art.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                        </div>
                      </div>
                      {isChecked && (
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Sélectionné</span>
                      )}
                    </label>
                  )
                })}
              {allArticles.filter(a => a.id !== id).length === 0 && (
                <div className="text-center py-8 text-neutral-600 text-xs uppercase tracking-widest">
                  Aucun autre article disponible
                </div>
              )}
            </div>
          </div>

          {/* Modular Blocks Editor */}
          <div className="space-y-6 quill-editor-container">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Contenu modulaire de l'article</label>
            
            <div className="space-y-6">
              {blocks.map((block, index) => {
                const isEditingProps = editingBlockId === block.id
                const blockDef = BLOCK_REGISTRY[block.type]
                const blockLabel = block.type === 'richtext' ? 'Texte riche' : (blockDef?.label || block.type)
                const blockIconName = block.type === 'richtext' ? 'FileText' : (blockDef?.icon || 'Square')
                const BlockIcon = (LucideIcons as any)[blockIconName] || LucideIcons.Square

                return (
                  <React.Fragment key={block.id}>
                    {/* Insert block button before this block */}
                    <div className="flex justify-center -my-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity relative z-10">
                      <button
                        onClick={() => setAddingBlockAtIndex(index)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md hover:scale-105"
                      >
                        <Plus size={12} /> Insérer un bloc ici
                      </button>
                    </div>

                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-6 hover:border-neutral-700 transition-all relative">
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-black rounded-xl border border-neutral-800 text-neutral-400">
                            <BlockIcon size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-300">{blockLabel}</span>
                            <span className="text-[9px] text-neutral-500 uppercase tracking-widest ml-3">Bloc #{index + 1}</span>
                          </div>
                        </div>
                        
                        {/* Card Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            disabled={index === 0}
                            onClick={() => moveBlockUp(index)}
                            className="p-2 bg-black hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Déplacer vers le haut"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            disabled={index === blocks.length - 1}
                            onClick={() => moveBlockDown(index)}
                            className="p-2 bg-black hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Déplacer vers le bas"
                          >
                            <ArrowDown size={14} />
                          </button>
                          
                          {block.type !== 'richtext' && (
                            <button
                              onClick={() => setEditingBlockId(isEditingProps ? null : block.id)}
                              className={`p-2 border rounded-xl transition-all ${
                                isEditingProps 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-black border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                              }`}
                              title="Paramètres du bloc"
                            >
                              <Settings size={14} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="p-2 bg-black hover:bg-red-950 border border-neutral-800 hover:border-red-900 rounded-xl text-neutral-400 hover:text-red-500 transition-colors"
                            title="Supprimer le bloc"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="space-y-6">
                        {block.type === 'richtext' ? (
                          <div className="bg-black border border-neutral-800 rounded-2xl overflow-visible min-h-[300px]">
                            <ReactQuill 
                              theme="snow"
                              value={block.data.html || ''}
                              onChange={(html) => updateBlockData(block.id, { html })}
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="Rédigez votre texte ici..."
                              className="h-full text-white"
                            />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Visual Preview */}
                            <div className="bg-white text-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner min-h-[50px]">
                              <div className="p-2 bg-neutral-100 border-b border-neutral-200 text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center justify-between">
                                <span>Prévisualisation</span>
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                              </div>
                              <div className="p-6">
                                <BlockRenderer 
                                  node={{ id: block.id, type: block.type, props: block.data, children: [] }} 
                                  mode="preview"
                                />
                              </div>
                            </div>

                            {/* Properties Editor Panel (Accordion style) */}
                            {isEditingProps && (
                              <div className="border border-neutral-800 bg-black/40 rounded-2xl p-6 space-y-6 animate-slide-down">
                                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                                  <Settings size={14} className="text-blue-500" />
                                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">Propriétés du composant</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {blockDef?.propSchema && Object.entries(blockDef.propSchema).map(([propKey, propDef]) => (
                                    <div key={propKey} className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                        {propDef.label}
                                      </label>
                                      {renderPropertyInput(block.id, propKey, propDef, block.data[propKey], (val) => {
                                        updateBlockData(block.id, { [propKey]: val })
                                      })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}

              {/* Add block button at the very end */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setAddingBlockAtIndex(blocks.length)}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <Plus size={14} /> Ajouter un bloc de contenu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Selector Modal */}
      {addingBlockAtIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-neutral-900 flex justify-between items-center bg-neutral-900/30">
              <h3 className="text-xl font-black uppercase tracking-tight">Ajouter un bloc</h3>
              <button 
                onClick={() => setAddingBlockAtIndex(null)}
                className="text-neutral-500 hover:text-white p-2 rounded-full hover:bg-neutral-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-6 border-b border-neutral-900">
              <input 
                type="text"
                placeholder="Rechercher un composant..."
                value={blockSearchQuery}
                onChange={(e) => setBlockSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-3.5 text-white text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Grid list of blocks */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {ALLOWED_ARTICLE_BLOCKS.filter(b => 
                b.label.toLowerCase().includes(blockSearchQuery.toLowerCase()) || 
                b.type.toLowerCase().includes(blockSearchQuery.toLowerCase())
              ).map((b) => {
                const Icon = (LucideIcons as any)[b.icon] || LucideIcons.Square
                return (
                  <button
                    key={b.type}
                    onClick={() => addBlock(b.type, addingBlockAtIndex)}
                    className="flex flex-col items-center justify-center p-6 rounded-3xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900 hover:border-blue-500 transition-all text-center group"
                  >
                    <div className="p-4 bg-neutral-950 rounded-2xl mb-4 group-hover:text-blue-500 transition-colors border border-neutral-900">
                      <Icon size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-300 group-hover:text-white">{b.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-down {
          animation: slideDown 0.25s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .quill-editor-container .ql-toolbar {
          position: sticky;
          top: 0;
          z-index: 20;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #262626 !important;
          background: #0a0a0a;
          padding: 1.5rem;
        }
        .quill-editor-container .ql-container {
          border: none !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 1.1rem;
        }
        .quill-editor-container .ql-editor {
          min-height: 250px;
          padding: 2rem;
          padding-bottom: 80px;
          color: #fff;
          line-height: 1.8;
          word-break: normal;
          overflow-wrap: break-word;
        }
        .quill-editor-container .ql-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          overflow-x: auto;
          display: table;
        }
        .quill-editor-container .ql-editor th,
        .quill-editor-container .ql-editor td {
          border: 1px solid #444;
          padding: 0.85rem;
        }
        .quill-editor-container .ql-editor th {
          background: rgba(255, 255, 255, 0.08);
        }
        .quill-editor-container .ql-stroke {
          stroke: #666 !important;
        }
        .quill-editor-container .ql-fill {
          fill: #666 !important;
        }
        .quill-editor-container .ql-picker {
          color: #666 !important;
        }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
      `}</style>
    </div>
  )
}

export default ArticleEditPage
