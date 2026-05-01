import React, { useEffect, useState } from 'react'
import client from '../api/client'
import BlockRenderer from '../builder/BlockRenderer'
import { Calendar, Newspaper, ArrowRight } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  image_url: string | null
  content: string
  created_at: string
  category: string
}

const CATEGORIES = [
  "Tous",
  "RSE",
  "Partenariat",
  "Teambuilding",
  "Etudes",
  "Panel",
  "News"
]

const NewsListingPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [footerConfig, setFooterConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Tous')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, settingsRes] = await Promise.all([
          client.get('/articles/public/'),
          client.get('/settings')
        ])
        setArticles(articlesRes.data)
        setHeaderConfig(settingsRes.data.header_config)
        setFooterConfig(settingsRes.data.footer_config)
      } catch (err) {
        console.error("Failed to fetch news data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    document.title = "Actualités | Fondinor"
  }, [])

  const filteredArticles = activeCategory === 'Tous' 
    ? articles 
    : articles.filter(a => a.category === activeCategory)

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-black font-['Inter',sans-serif]">
      {/* Global Header */}
      {headerConfig && (
        <BlockRenderer 
          node={{ id: 'global-header', type: 'header', props: headerConfig, children: [] }} 
          mode="preview" 
        />
      )}

      {/* Hero Header matching the image */}
      <section className="pt-44 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400">News / Actualités</span>
            <div className="w-12 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 my-4" />
            <h1 className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tight">
              Retrouvez ici toutes nos actualités
            </h1>
          </div>
        </div>
      </section>

      {/* Category Filter Bar - Removed sticky to avoid conflicts with global header */}
      <div className="bg-white border-b border-neutral-100 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeCategory === cat 
                  ? 'text-black' 
                  : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <div className="absolute -bottom-2 left-0 w-full h-[3px] bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {filteredArticles.map((article) => (
              <a 
                key={article.id} 
                href={`/articles/${article.slug}`} 
                className="group flex flex-col h-full overflow-hidden transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-[2rem] bg-neutral-100 relative shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  {article.image_url ? (
                    <img 
                      src={article.image_url} 
                      alt={article.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <Newspaper size={60} strokeWidth={1} />
                    </div>
                  )}
                  {/* Category Pill - Top Left */}
                  <div className="absolute top-6 left-6">
                    <span className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-black shadow-sm">
                      {article.category}
                    </span>
                  </div>
                </div>
                
                <div className="pt-8 pb-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                    <Calendar size={14} className="text-neutral-300" />
                    {new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <h2 className="text-2xl font-black text-neutral-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 uppercase tracking-tighter">
                    {article.title}
                  </h2>
                  <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300 group-hover:text-black transition-colors">
                    Découvrir l'article
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center">
            <Newspaper size={80} className="mx-auto text-neutral-100 mb-6" />
            <h3 className="text-2xl font-bold text-neutral-300 uppercase tracking-widest">Aucun article dans cette catégorie</h3>
            <button 
              onClick={() => setActiveCategory('Tous')}
              className="mt-6 text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline"
            >
              Voir tous les articles
            </button>
          </div>
        )}
      </main>

      {/* Global Footer */}
      {footerConfig && (
        <BlockRenderer 
          node={{ id: 'global-footer', type: 'footer', props: footerConfig, children: [] }} 
          mode="preview" 
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      `}</style>
    </div>
  )
}

export default NewsListingPage
