import React, { useState } from 'react'
import { useBuilderStore, type BlockNode } from './store/builderStore'
import { BLOCK_REGISTRY } from './BlockRegistry'
import SeoPanel from './SeoPanel'
import GeoPanel from './GeoPanel'
import client from '../api/client'

const PropsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'props' | 'seo' | 'geo'>('props')
  const selectedId = useBuilderStore((state) => state.selectedId)
  const page = useBuilderStore((state) => state.page)
  const updateProps = useBuilderStore((state) => state.updateProps)

  const findBlock = (node: BlockNode, id: string): BlockNode | null => {
    if (node.id === id) return node
    for (const child of node.children) {
      const found = findBlock(child, id)
      if (found) return found
    }
    return null
  }

  const selectedBlock = selectedId && page ? findBlock(page.schema.root, selectedId) : null
  const definition = selectedBlock ? BLOCK_REGISTRY[selectedBlock.type] : null

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
              <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
                <p className="text-xs text-center px-10 leading-relaxed uppercase tracking-tighter">
                  Sélectionnez un élément sur le canvas pour modifier ses styles
                </p>
              </div>
            ) : (
              <>
                <div className="pb-4 border-b border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    {definition?.label || selectedBlock.type}
                  </h3>
                  <p className="text-[10px] text-neutral-600 font-mono mt-1">{selectedBlock.id}</p>
                </div>
                
                <div className="space-y-5">
                  {definition && Object.entries(definition.propSchema).map(([key, prop]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                        {prop.label}
                      </label>
                      
                      {prop.type === 'string' && (
                        <input
                          type="text"
                          value={selectedBlock.props[key] || ''}
                          onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                      )}

                      {prop.type === 'richtext' && (
                        <textarea
                          value={selectedBlock.props[key] || ''}
                          onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                          rows={6}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none leading-relaxed"
                          placeholder="Votre texte ici..."
                        />
                      )}
                      
                      {prop.type === 'media' && (
                        <div className="space-y-2">
                          {selectedBlock.props[key] && (
                            <img src={selectedBlock.props[key]} alt="Preview" className="w-full h-24 object-cover rounded border border-neutral-800" />
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={selectedBlock.props[key] || ''}
                              onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                              placeholder="URL de l'image"
                              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                            />
                            <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded text-xs font-bold flex items-center justify-center transition-colors">
                              Upload
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const formData = new FormData()
                                    formData.append('file', e.target.files[0])
                                    try {
                                      const res = await client.post('/media/upload', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                      })
                                      updateProps(selectedId!, { [key]: res.data.url })
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
                      )}
                      
                      {prop.type === 'select' && (
                        <select
                          value={selectedBlock.props[key] || prop.default}
                          onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none transition-all appearance-none"
                        >
                          {prop.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      
                      {prop.type === 'color' && (
                        <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded-xl p-2">
                          <input
                            type="color"
                            value={selectedBlock.props[key] || '#000000'}
                            onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                            className="h-10 w-12 bg-transparent border-none rounded cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={selectedBlock.props[key] || '#000000'}
                            onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                            className="flex-1 bg-transparent border-none text-[10px] font-mono text-white focus:outline-none"
                          />
                        </div>
                      )}

                      {prop.type === 'spacing' && (
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            value={selectedBlock.props[key] || ''}
                            onChange={(e) => updateProps(selectedId!, { [key]: e.target.value })}
                            placeholder="ex: 10px 20px 10px 20px"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none transition-all"
                          />
                          <div className="flex justify-between text-[8px] text-neutral-600 uppercase tracking-tighter px-1">
                            <span>Haut</span>
                            <span>Droite</span>
                            <span>Bas</span>
                            <span>Gauche</span>
                          </div>
                        </div>
                      )}

                      {prop.type === 'menu' && (
                        <div className="space-y-2">
                          <textarea
                            value={JSON.stringify(selectedBlock.props[key], null, 2)}
                            onChange={(e) => {
                              try {
                                const val = JSON.parse(e.target.value)
                                updateProps(selectedId!, { [key]: val })
                              } catch (err) {}
                            }}
                            rows={12}
                            className="w-full bg-black border border-neutral-800 rounded p-3 text-[10px] font-mono leading-tight focus:border-blue-500 outline-none"
                          />
                          <p className="text-[9px] text-neutral-600 uppercase tracking-tighter italic">
                            Éditez le JSON pour gérer les 3 niveaux de menu
                          </p>
                        </div>
                      )}

                      {prop.type === 'list' && (
                        <div className="space-y-4">
                          {(selectedBlock.props[key] || []).map((item: any, idx: number) => (
                            <div key={idx} className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                              <div className="bg-neutral-800/50 px-3 py-2 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-neutral-500">Élément #{idx + 1}</span>
                                <button 
                                  onClick={() => {
                                    const newList = [...selectedBlock.props[key]]
                                    newList.splice(idx, 1)
                                    updateProps(selectedId!, { [key]: newList })
                                  }}
                                  className="text-neutral-500 hover:text-red-500 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                              </div>
                              <div className="p-4 space-y-4">
                                {prop.itemSchema && Object.entries(prop.itemSchema).map(([fKey, fProp]) => (
                                  <div key={fKey} className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">{fProp.label}</label>
                                    
                                    {fProp.type === 'string' && (
                                      <input
                                        type="text"
                                        value={item[fKey] || ''}
                                        onChange={(e) => {
                                          const newList = [...selectedBlock.props[key]]
                                          newList[idx] = { ...newList[idx], [fKey]: e.target.value }
                                          updateProps(selectedId!, { [key]: newList })
                                        }}
                                        className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white focus:border-blue-500 outline-none"
                                      />
                                    )}

                                    {fProp.type === 'media' && (
                                      <div className="space-y-2">
                                        {item[fKey] && <img src={item[fKey]} className="w-full h-20 object-cover rounded border border-neutral-800" />}
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={item[fKey] || ''}
                                            onChange={(e) => {
                                              const newList = [...selectedBlock.props[key]]
                                              newList[idx] = { ...newList[idx], [fKey]: e.target.value }
                                              updateProps(selectedId!, { [key]: newList })
                                            }}
                                            placeholder="URL"
                                            className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                                          />
                                          <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded text-[10px] font-bold flex items-center justify-center">
                                            Up
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              className="hidden"
                                              onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                  const formData = new FormData()
                                                  formData.append('file', e.target.files[0])
                                                  try {
                                                    const res = await client.post('/media/upload', formData, {
                                                      headers: { 'Content-Type': 'multipart/form-data' }
                                                    })
                                                    const newList = [...selectedBlock.props[key]]
                                                    newList[idx] = { ...newList[idx], [fKey]: res.data.url }
                                                    updateProps(selectedId!, { [key]: newList })
                                                  } catch (err) { console.error(err) }
                                                }
                                              }} 
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {fProp.type === 'richtext' && (
                                      <textarea
                                        value={item[fKey] || ''}
                                        onChange={(e) => {
                                          const newList = [...selectedBlock.props[key]]
                                          newList[idx] = { ...newList[idx], [fKey]: e.target.value }
                                          updateProps(selectedId!, { [key]: newList })
                                        }}
                                        rows={3}
                                        className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white focus:border-blue-500 outline-none resize-none"
                                      />
                                    )}
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
                              const newList = [...(selectedBlock.props[key] || []), newItem]
                              updateProps(selectedId!, { [key]: newList })
                            }}
                            className="w-full py-3 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            + Ajouter un élément
                          </button>
                        </div>
                      )}
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
