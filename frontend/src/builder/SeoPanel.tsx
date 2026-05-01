import React from 'react'
import { useBuilderStore } from './store/builderStore'

const SeoPanel: React.FC = () => {
  const page = useBuilderStore((state) => state.page)
  const updateSeo = useBuilderStore((state) => state.updateSeo)
  const seo = page?.schema.seo || {}

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-800">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">SEO Settings</h3>
        <p className="text-[10px] text-neutral-600 mt-1">Optimisez votre visibilité sur les moteurs de recherche</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Meta Title</label>
          <input
            type="text"
            value={seo.metaTitle || ''}
            onChange={(e) => updateSeo({ metaTitle: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Meta Description</label>
          <textarea
            value={seo.metaDescription || ''}
            onChange={(e) => updateSeo({ metaDescription: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Canonical URL</label>
          <input
            type="text"
            value={seo.canonical || ''}
            onChange={(e) => updateSeo({ canonical: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">No Index</label>
          <input
            type="checkbox"
            checked={!!seo.noIndex}
            onChange={(e) => updateSeo({ noIndex: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-800 bg-neutral-900"
          />
        </div>
      </div>
    </div>
  )
}

export default SeoPanel
