import React, { useEffect, useState } from 'react'
import { useBuilderStore, getLocalizedValue, type BlockNode } from './store/builderStore'
import { BLOCK_REGISTRY, type PropDefinition } from './BlockRegistry'
import SeoPanel from './SeoPanel'
import GeoPanel from './GeoPanel'
import client from '../api/client'
import { useProject } from '../contexts/ProjectContext'

const PropsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'props' | 'seo' | 'geo'>('props')
  const selectedId = useBuilderStore((state) => state.selectedId)
  const page = useBuilderStore((state) => state.page)
  const updateProps = useBuilderStore((state) => state.updateProps)
  const currentLang = useBuilderStore((state) => state.currentLang)
  const { defaultLanguage } = useProject()

  const findBlock = (node: BlockNode, id: string): BlockNode | null => {
    if (node.id === id) return node
    for (const child of node.children) {
      const found = findBlock(child, id)
      if (found) return found
    }
    return null
  }

  const [globalComponents, setGlobalComponents] = useState<{ id: string; name: string }[]>([])
  const selectedBlock = selectedId && page ? findBlock(page.schema.root, selectedId) : null
  const definition = selectedBlock ? BLOCK_REGISTRY[selectedBlock.type] : null

  useEffect(() => {
    const fetchGlobalComponents = async () => {
      try {
        const res = await client.get('/components/')
        setGlobalComponents(res.data.map((comp: any) => ({ id: comp.id, name: comp.name })))
      } catch (err) {
        console.error('Impossible de charger les composants globaux', err)
      }
    }

    if (selectedBlock?.type === 'globalComponent') {
      fetchGlobalComponents()
    }
  }, [selectedBlock?.type])

  /** Get the display value respecting i18n */
  const getFieldValue = (key: string, props: PropDefinition): any => {
    if (!selectedBlock) return ''
    if (props.i18n && currentLang !== defaultLanguage) {
      return getLocalizedValue(selectedBlock.props, key, currentLang)
    }
    return selectedBlock.props[key]
  }

  /** Handle change, storing in i18n if needed */
  const handleFieldChange = (key: string, prop: PropDefinition, val: any) => {
    if (!selectedId) return
    if (prop.i18n && currentLang !== defaultLanguage) {
      const i18n = { ...(selectedBlock?.props?.i18n || {}) }
      if (!i18n[currentLang]) i18n[currentLang] = {}
      i18n[currentLang] = { ...i18n[currentLang], [key]: val }
      updateProps(selectedId, { i18n })
    } else {
      updateProps(selectedId, { [key]: val })
    }
  }

  const renderField = (key: string, prop: PropDefinition, value: any, onChange: (val: any) => void) => {
    if (key === 'componentId' && selectedBlock?.type === 'globalComponent') {
      return (
        <div className="space-y-3">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Sélectionnez un composant global</option>
            {globalComponents.map((comp) => (
              <option key={comp.id} value={comp.id}>{comp.name}</option>
            ))}
          </select>
          <div className="text-[10px] text-neutral-500">Si vous souhaitez utiliser un ID personnalisé, saisissez-le ci-dessous.</div>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ID du composant global"
            className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
        </div>
      )
    }

    switch (prop.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
        )
      case 'richtext':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all resize-none"
          />
        )
      case 'select':
        return (
          <select
            value={value || prop.default}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all"
          >
            {prop.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'color':
        return (
          <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-xl p-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-12 bg-transparent border-none rounded cursor-pointer p-0"
            />
            <input
              type="text"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-transparent border-none text-[10px] font-mono text-white focus:outline-none"
            />
          </div>
        )
      case 'spacing':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ex: 10px 20px 10px 20px"
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none"
          />
        )
      case 'media':
        const isVideo = typeof value === 'string' && (
          value.toLowerCase().endsWith('.mp4') || 
          value.toLowerCase().endsWith('.webm') || 
          value.toLowerCase().endsWith('.ogg') || 
          value.toLowerCase().endsWith('.mov') ||
          value.includes('/uploads/') && !value.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg|ico)$/)
        )
        return (
          <div className="space-y-2">
            {value && (
              isVideo ? (
                <video src={value} className="w-full h-24 object-cover rounded border border-neutral-800" muted playsInline />
              ) : (
                <img src={value} alt="Preview" className="w-full h-24 object-cover rounded border border-neutral-800" />
              )
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="URL du média"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs focus:border-blue-500 outline-none"
              />
              <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded text-[10px] font-bold flex items-center justify-center">
                Up
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const formData = new FormData()
                      formData.append('file', e.target.files[0])
                      const res = await client.post('/media/upload', formData)
                      onChange(res.data.url)
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )
      case 'list':
        return (
          <div className="space-y-4">
            {(value || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="bg-neutral-800/50 px-3 py-2 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-neutral-500">#{idx + 1}</span>
                  <button 
                    onClick={() => {
                      const newList = [...(value || [])]
                      newList.splice(idx, 1)
                      onChange(newList)
                    }}
                    className="text-neutral-500 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  {prop.itemSchema && Object.entries(prop.itemSchema).map(([fKey, fProp]) => (
                    <div key={fKey} className="space-y-1">
                      <label className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">{fProp.label}</label>
                      {renderField(fKey, fProp, item[fKey], (val) => {
                        const newList = [...(value || [])]
                        newList[idx] = { ...newList[idx], [fKey]: val }
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
                onChange([...(value || []), newItem])
              }}
              className="w-full py-2 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-600 hover:text-blue-500 hover:border-blue-500/50 transition-all text-[9px] font-black uppercase tracking-widest"
            >
              + Ajouter
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800">
      <div className="flex border-b border-neutral-800 bg-neutral-900/50">
        {(['props', 'seo', 'geo'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {activeTab === 'props' && (
          <div className="space-y-6">
            {!selectedBlock ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-600 text-[10px] uppercase tracking-widest text-center opacity-50 px-10 leading-relaxed">
                Sélectionnez un élément pour le modifier
              </div>
            ) : (
              <>
                <div className="pb-4 border-b border-neutral-800">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                    {definition?.label || selectedBlock.type}
                  </h3>
                  <p className="text-[9px] text-neutral-700 font-mono mt-1">{selectedBlock.id}</p>
                </div>
                
                <div className="space-y-6">
                  {definition && Object.entries(definition.propSchema).map(([key, prop]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block flex items-center gap-2">
                        {prop.label}
                        {prop.i18n && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                            {currentLang}
                          </span>
                        )}
                      </label>
                      {renderField(key, prop, getFieldValue(key, prop), (val) => {
                        handleFieldChange(key, prop, val)
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'seo' && <SeoPanel />}
        {activeTab === 'geo' && <GeoPanel />}
      </div>
    </div>
  )
}

export default PropsPanel
