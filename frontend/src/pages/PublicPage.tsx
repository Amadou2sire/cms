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
      setPage(pageRes.data)
      setHeaderConfig(settingsRes.data.header_config)
      setFooterConfig(settingsRes.data.footer_config)
      setLoading(false)
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
        {page.schema.root.children.map((block: any) => (
          <BlockRenderer key={block.id} node={block} mode="preview" />
        ))}
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
