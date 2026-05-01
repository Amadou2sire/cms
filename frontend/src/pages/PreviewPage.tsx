import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import BlockRenderer from '../builder/BlockRenderer'
import type { PageData } from '../builder/store/builderStore'
import { ArrowLeft, EyeOff } from 'lucide-react'

const PreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState<PageData | null>(null)
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [footerConfig, setFooterConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      Promise.all([
        client.get(`/pages/${id}`),
        client.get('/settings')
      ]).then(([pageRes, settingsRes]) => {
        setPage(pageRes.data)
        setHeaderConfig(settingsRes.data.header_config)
        setFooterConfig(settingsRes.data.footer_config)
        setLoading(false)
      }).catch(err => {
        console.error("Preview load failed", err)
        setLoading(false)
      })
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <EyeOff size={48} className="text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-800">Page non trouvée</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Floating Toolbar for Preview Mode */}
      <div className="fixed top-6 left-6 z-[100] group">
        <button
          onClick={() => navigate(`/builder/${id}`)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-full shadow-2xl hover:bg-neutral-800 transition-all border border-white/10"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Retour à l'édition</span>
        </button>
      </div>

      <div className="absolute top-6 right-6 z-[100]">
        <div className="bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/20 backdrop-blur-md">
          Mode Prévisualisation
        </div>
      </div>

      {/* Actual Content */}
      <div className="w-full min-h-screen">
        {/* Render Global Header if not already in schema */}
        {page.schema.root.children.every(b => b.type !== 'header') && headerConfig && (
          <BlockRenderer 
            node={{ 
              id: 'global-header', 
              type: 'header', 
              props: headerConfig, 
              children: [] 
            }} 
            mode="preview" 
          />
        )}
        
        {page.schema.root.children.map((block) => {
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

        {/* Render Global Footer if not already in schema */}
        {page.schema.root.children.every(b => b.type !== 'footer') && footerConfig && (
          <BlockRenderer 
            node={{ 
              id: 'global-footer', 
              type: 'footer', 
              props: footerConfig, 
              children: [] 
            }} 
            mode="preview" 
          />
        )}
      </div>

      {/* Selection Styles override to hide outlines in preview */}
      <style>{`
        .ring-2, .ring-1, .group-hover\\:ring-1 {
          display: none !important;
        }
        .cursor-pointer {
          cursor: default !important;
        }
        button[title="Supprimer ce bloc"] {
            display: none !important;
        }
      `}</style>
    </div>
  )
}

export default PreviewPage
