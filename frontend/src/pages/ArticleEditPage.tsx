import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { Save, X, Upload, ArrowLeft } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      client.get(`/articles/${id}`)
        .then(res => {
          setArticle(res.data)
          setLoading(false)
        })
        .catch(err => {
          console.error("Failed to fetch article", err)
          setLoading(false)
        })
    }
  }, [id])

  const handleSave = async () => {
    if (!article.title) {
      alert("Le titre est obligatoire")
      return
    }

    try {
      if (id) {
        await client.put(`/articles/${id}`, article)
      } else {
        await client.post('/articles/', article)
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

          {/* Editeur */}
          <div className="space-y-4 quill-editor-container">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Contenu de l'article</label>
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden min-h-[500px]">
              <ReactQuill 
                theme="snow"
                value={article.content || ''}
                onChange={(content) => setArticle(prev => ({ ...prev, content }))}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
                className="h-full text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        .quill-editor-container .ql-toolbar {
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
          min-height: 450px;
          padding: 2rem;
          padding-bottom: 150px;
          color: #fff;
          line-height: 1.8;
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
