import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import client from '../api/client'
import BlockRenderer from '../builder/BlockRenderer'

const PublicPage: React.FC<{ isHome?: boolean }> = ({ isHome = false }) => {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<any>(null)
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [footerConfig, setFooterConfig] = useState<any>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pageUrl = isHome ? '/pages/public/site/home' : `/pages/public/${slug}`
    
    Promise.all([
      client.get(pageUrl),
      client.get('/settings')
    ]).then(([pageRes, settingsRes]) => {
      const pageData = pageRes.data
      setPage(pageData)
      setHeaderConfig(settingsRes.data.header_config)
      setFooterConfig(settingsRes.data.footer_config)
      setLoading(false)

      // Apply SEO settings
      const seo = pageData.schema?.seo
      if (seo) {
        document.title = seo.metaTitle || pageData.title || 'Mon Site'
        
        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]')
        if (!metaDesc) {
          metaDesc = document.createElement('meta')
          metaDesc.setAttribute('name', 'description')
          document.head.appendChild(metaDesc)
        }
        metaDesc.setAttribute('content', seo.metaDescription || '')

        // Robots (noindex)
        let metaRobots = document.querySelector('meta[name="robots"]')
        if (seo.noIndex) {
          if (!metaRobots) {
            metaRobots = document.createElement('meta')
            metaRobots.setAttribute('name', 'robots')
            document.head.appendChild(metaRobots)
          }
          metaRobots.setAttribute('content', 'noindex, nofollow')
        } else if (metaRobots) {
          metaRobots.setAttribute('content', 'index, follow')
        }
      }

      // Apply GEO settings (JSON-LD for AI Engines)
      const geo = pageData.schema?.geo
      if (geo) {
        let geoScript = document.getElementById('geo-ld-json')
        if (!geoScript) {
          geoScript = document.createElement('script')
          geoScript.id = 'geo-ld-json'
          geoScript.setAttribute('type', 'application/ld+json')
          document.head.appendChild(geoScript)
        }
        
        const geoData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": seo?.metaTitle || pageData.title,
          "description": seo?.metaDescription,
          "abstract": geo.aiSummary,
          "keywords": geo.aiKeyFacts?.join(', '),
          "mentions": {
            "@type": "CreativeWork",
            "text": geo.aiSummary,
            "keywords": geo.aiKeyFacts
          },
          "speakable": {
            "@type": "SpeakableSpecification",
            "xpath": ["/html/head/title", "/html/head/meta[@name='description']/@content"]
          }
        }
        geoScript.textContent = JSON.stringify(geoData)
      }

      // FAQ Schema (if FAQ block exists)
      const faqBlocks = pageData.schema.root.children.filter((b: any) => b.type === 'faq')
      if (faqBlocks.length > 0) {
        let faqScript = document.getElementById('faq-ld-json')
        if (!faqScript) {
          faqScript = document.createElement('script')
          faqScript.id = 'faq-ld-json'
          faqScript.setAttribute('type', 'application/ld+json')
          document.head.appendChild(faqScript)
        }

        const allQuestions = faqBlocks.flatMap((b: any) => b.props.items || [])
        const faqData = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": allQuestions.map((q: any) => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": q.answer.replace(/<[^>]*>/g, '') // Strip HTML for the schema
            }
          }))
        }
        faqScript.textContent = JSON.stringify(faqData)
      }
    }).catch(err => {
      console.error("Public page load failed", err)
      setError(true)
      setLoading(false)
    })
  }, [slug, isHome])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
  
  if (error || !page) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-black mb-4">404</h1>
      <p className="text-neutral-500 uppercase tracking-widest text-sm">Page introuvable ou non publiée</p>
      <a href="/" className="mt-8 text-blue-500 hover:underline text-xs font-bold uppercase tracking-widest">Retourner à l'accueil</a>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      {/* 1. Header Global si absent du schema */}
      {page.schema.root.children.every((b: any) => b.type !== 'header') && headerConfig && (
        <BlockRenderer 
          node={{ id: 'global-header', type: 'header', props: headerConfig, children: [] }} 
          mode="preview" 
        />
      )}

      {/* 2. Contenu de la page */}
      <div className="flex flex-col">
        {page.schema.root.children.map((block: any) => {
          // Override local header/footer props with global settings
          let finalBlock = block
          if (block.type === 'header' && headerConfig) {
            finalBlock = { ...block, props: { ...block.props, ...headerConfig } }
          }
          if (block.type === 'footer' && footerConfig) {
            finalBlock = { ...block, props: { ...block.props, ...footerConfig } }
          }
          return <BlockRenderer key={block.id} node={finalBlock} mode="preview" />
        })}
      </div>

      {/* 3. Footer Global si absent du schema */}
      {page.schema.root.children.every((b: any) => b.type !== 'footer') && footerConfig && (
        <BlockRenderer 
          node={{ id: 'global-footer', type: 'footer', props: footerConfig, children: [] }} 
          mode="preview" 
        />
      )}
    </div>
  )
}

export default PublicPage
