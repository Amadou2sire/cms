import React, { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import client from '../api/client'
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react'
import BlockRenderer from '../builder/BlockRenderer'
import { useProject } from '../contexts/ProjectContext'

interface Article {
  id: string
  title: string
  slug: string
  image_url: string | null
  content: string
  created_at: string
}

const sanitizeHtmlContent = (content: string) =>
  content
    .replace(/\u00A0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00AD/g, '')

const ArticleDetailPage: React.FC = () => {
  const { slug, lang } = useParams<{ slug: string; lang?: string }>()
  const { defaultLanguage } = useProject()
  const effectiveLang = lang || defaultLanguage
  const [article, setArticle] = useState<Article | null>(null)
  const [otherArticles, setOtherArticles] = useState<Article[]>([])
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [footerConfig, setFooterConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModular, setIsModular] = useState(false)
  const [blocks, setBlocks] = useState<any[]>([])

  useEffect(() => {
    const fetchArticleAndSettings = async () => {
      try {
        const [articleRes, allRes, settingsRes] = await Promise.all([
          client.get(`/articles/public/slug/${slug}/?lang=${effectiveLang}`),
          client.get(`/articles/public/?lang=${effectiveLang}`),
          client.get('/settings/')
        ])
        
        const rawContent = articleRes.data.content || ''
        let parsedBlocks = null
        let relatedArticleIds: string[] = []
        try {
          const trimmed = rawContent.trim()
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const parsed = JSON.parse(trimmed)
            if (parsed && parsed.version === 2 && Array.isArray(parsed.blocks)) {
              parsedBlocks = parsed.blocks
              relatedArticleIds = Array.isArray(parsed.related_article_ids) ? parsed.related_article_ids : []
            }
          }
        } catch (e) {
          // not JSON
        }

        if (parsedBlocks) {
          setIsModular(true)
          setBlocks(parsedBlocks)
          setArticle(articleRes.data)
        } else {
          setIsModular(false)
          setBlocks([])
          setArticle({
            ...articleRes.data,
            content: sanitizeHtmlContent(rawContent)
          })
        }

        // Selected related articles or automatic fallback
        let others: Article[] = []
        if (relatedArticleIds.length > 0) {
          others = relatedArticleIds
            .map((recId: string) => allRes.data.find((a: Article) => a.id === recId))
            .filter((a: Article | undefined): a is Article => a !== undefined && a.slug !== slug)
            .slice(0, 4)
        } else {
          others = allRes.data
            .filter((a: Article) => a.slug !== slug)
            .slice(0, 3)
        }
        setOtherArticles(others)
        setHeaderConfig(settingsRes.data.header_config)
        setFooterConfig(settingsRes.data.footer_config)
      } catch (err) {
        console.error("Failed to fetch article data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchArticleAndSettings()
  }, [slug])

  // Apply Article SEO
  useEffect(() => {
    if (article) {
      // @ts-ignore
      document.title = article.meta_title || article.title || 'Actualité'
      
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      // @ts-ignore
      metaDesc.setAttribute('content', article.meta_description || '')
    }
  }, [article])

  // Automatically make all links in the content open in a new tab
  useEffect(() => {
    if (article) {
      // Small timeout to ensure content is rendered in the DOM
      const timer = setTimeout(() => {
        const links = document.querySelectorAll('.prose a')
        links.forEach(link => {
          link.setAttribute('target', '_blank')
          link.setAttribute('rel', 'noopener noreferrer')
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [article])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-black tracking-tighter text-neutral-900">ARTICLE NON TROUVÉ</h1>
        <Link to="/" className="text-blue-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-blue-500 selection:text-white">
      {/* Import Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        .prose,
        .prose * {
          font-family: 'Inter', sans-serif;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          line-height: 1.8;
          font-size: 1.1rem;
          /* Disable automatic hyphenation and avoid unexpected cuts */
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
        
        .prose h2 { 
          margin-top: 1.2em; 
          margin-bottom: 0.8em; 
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #000;
          line-height: 1.2;
          /* Prevent breaking inside words for headings */
          word-break: normal;
          overflow-wrap: break-word;
          hyphens: none;
        }

        @media (max-width: 768px) {
          .prose h2 {
            font-size: 1.75rem;
          }
          .prose {
            font-size: 1rem;
          }
        }

        .prose p { margin-bottom: 1.5em; color: #000000; }
        
        /* Custom List Bullets */
        .prose ul { 
          list-style: none !important; 
          padding-left: 0 !important; 
          margin-bottom: 2em !important; 
        }
        .prose ul li { 
          position: relative !important; 
          padding-left: 1.5em !important; 
          margin-bottom: 0.75em !important;
          color: #000000;
        }
        .prose ul li::before {
          content: '›' !important;
          position: absolute !important;
          left: 0 !important;
          color: #9ca3af !important;
          font-weight: bold !important;
          font-size: 1.2em !important;
          line-height: 1 !important;
        }
        
        .prose a {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 700;
        }
        
        .prose strong {
          font-weight: 900;
          color: #000;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          overflow-x: auto;
          display: table;
        }
        .prose th,
        .prose td {
          border: 1px solid #d1d5db;
          padding: 1rem 1.15rem;
          text-align: left;
          vertical-align: top;
        }
        .prose th {
          background: #f8fafc;
          font-weight: 700;
        }
        .prose tr:nth-child(even) td {
          background: #f9fafb;
        }
      `}</style>

      {/* Global Header */}
      {headerConfig && (
        <BlockRenderer 
          node={{ id: 'global-header', type: 'header', props: headerConfig, children: [] }} 
          mode="preview" 
        />
      )}

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32 w-full overflow-x-hidden min-h-[60vh]">
        {/* 1. Title */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-[2px] bg-neutral-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Actualités</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 leading-[1.1] tracking-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-6 mt-8 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-500" />
              {new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* 2. Main Image */}
        <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl shadow-neutral-200">
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full object-cover max-h-[600px]"
            />
          ) : (
            <div className="w-full aspect-video bg-neutral-50 flex items-center justify-center">
              <Newspaper size={80} className="text-neutral-100" />
            </div>
          )}
        </div>

        {/* 3. Article Content */}
        {isModular ? (
          <div className="space-y-12">
            {blocks.map((block) => {
              if (block.type === 'richtext') {
                return (
                  <div 
                    key={block.id}
                    className="prose prose-lg md:prose-xl prose-neutral max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.data.html || '') }}
                  />
                )
              } else {
                return (
                  <div key={block.id} className="w-full">
                    <BlockRenderer 
                      node={{ id: block.id, type: block.type, props: block.data, children: [] }} 
                      mode="preview"
                      lang={effectiveLang}
                    />
                  </div>
                )
              }
            })}
          </div>
        ) : (
          <div 
            className="prose prose-lg md:prose-xl prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* 4. Lire aussi Section */}
        {otherArticles.length > 0 && (
          <section className="mt-32 pt-16 border-t border-neutral-100">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-sm font-black uppercase tracking-[0.4em] text-neutral-900">Lire aussi</span>
              <div className="flex-1 h-[1px] bg-neutral-100" />
            </div>
            <div className={`grid grid-cols-1 ${
              otherArticles.length === 4 
                ? 'md:grid-cols-4' 
                : otherArticles.length === 2 
                ? 'md:grid-cols-2' 
                : 'md:grid-cols-3'
            } gap-8`}>
              {otherArticles.map((other) => (
                <Link 
                  key={other.id} 
                  to={`/${effectiveLang}/articles/${other.slug}`}
                  className="group block space-y-4 no-underline"
                >
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-50 shadow-sm border border-neutral-100">
                    {other.image_url ? (
                      <img src={other.image_url} alt={other.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-200">
                        <Newspaper size={32} />
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-neutral-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {other.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Global Footer */}
      {footerConfig && (
        <BlockRenderer 
          node={{ id: 'global-footer', type: 'footer', props: footerConfig, children: [] }} 
          mode="preview" 
        />
      )}
    </div>
  )
}

export default ArticleDetailPage
