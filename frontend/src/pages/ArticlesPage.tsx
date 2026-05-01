import React, { useEffect, useState } from 'react'
import client from '../api/client'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Newspaper, Image as ImageIcon, Trash, Edit3, Globe, Lock, ArrowLeft } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  image_url: string | null
  content: string
  status: string
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  email: string
  role: string
}

const ArticlesPage: React.FC = () => {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)

  const fetchUser = async () => {
    try {
      const res = await client.get('/auth/me')
      setUser(res.data)
    } catch (err) {
      console.error("Failed to fetch user", err)
    }
  }

  const fetchArticles = async () => {
    try {
      const res = await client.get('/articles/')
      setArticles(res.data)
    } catch (err) {
      console.error("Failed to fetch articles", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchArticles()
    }
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return
    try {
      await client.delete(`/articles/${id}`)
      fetchArticles()
    } catch (err) {
      console.error("Failed to delete article", err)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col gap-4">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Retour au Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-500">Actualités</h1>
              <p className="text-neutral-500 text-sm mt-1">Gérez vos articles et contenus éditoriaux</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => navigate('/dashboard/articles/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} /> Nouvel Article
            </button>
          )}
        </header>

        {loading ? (
          <div className="py-20 text-center text-neutral-600 animate-pulse uppercase tracking-widest text-xs">
            Chargement des articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-600">
            <p className="uppercase tracking-widest text-xs">Aucun article pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <div key={article.id} className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all flex flex-col">
                {article.image_url ? (
                  <div className="h-56 overflow-hidden relative">
                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg ${
                        article.status === 'published' ? 'bg-green-500/90 text-white' : 'bg-orange-500/90 text-white'
                      }`}>
                        {article.status === 'published' ? 'En ligne' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-56 bg-neutral-900 flex items-center justify-center text-neutral-800 relative">
                    <Newspaper size={60} />
                    <div className="absolute top-4 left-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg ${
                        article.status === 'published' ? 'bg-green-500/90 text-white' : 'bg-orange-500/90 text-white'
                      }`}>
                        {article.status === 'published' ? 'En ligne' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-4">
                    {new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <h2 className="text-xl font-black mb-6 line-clamp-2 leading-tight tracking-tight group-hover:text-blue-400 transition-colors">{article.title}</h2>
                  
                  <div className="mt-auto pt-6 border-t border-neutral-800 flex gap-3">
                    <button 
                      onClick={() => navigate(`/dashboard/articles/edit/${article.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-white hover:text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Edit3 size={14} /> Modifier
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(article.id)}
                        className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticlesPage
