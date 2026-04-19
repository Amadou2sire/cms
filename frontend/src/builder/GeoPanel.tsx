import React from 'react'
import { useGeoStore } from './store/geoStore'

const GeoPanel: React.FC = () => {
  const geo = useGeoStore()
  const updateGeo = useGeoStore((state) => state.updateGeo)

  // GEO Score calculation (Simplified version of section 8.6)
  const calculateScore = () => {
    let score = 0
    if (geo.aiSummary.length >= 50) score += 20
    if (geo.aiKeyFacts.length >= 3) score += 15
    if (geo.enabled) score += 15
    return score
  }

  const score = calculateScore()
  const scoreColor = score >= 40 ? 'text-green-500' : score >= 20 ? 'text-orange-500' : 'text-red-500'

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-800 flex justify-between items-start">
        <div>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">IA Settings (GEO)</h3>
          <p className="text-[10px] text-neutral-600 mt-1">Generative Engine Optimization</p>
        </div>
        <div className={`text-xl font-black ${scoreColor}`}>
          {score}%
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">AI Summary (aiSummary)</label>
          <textarea
            value={geo.aiSummary}
            onChange={(e) => updateGeo({ aiSummary: e.target.value })}
            placeholder="Résumé court pour les LLMs..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none min-h-[80px] resize-none"
          />
          <p className="text-[9px] text-neutral-600 text-right">{geo.aiSummary.length}/300</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">AI Key Facts (aiKeyFacts)</label>
          <div className="space-y-2">
            {geo.aiKeyFacts.map((fact, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={fact}
                  onChange={(e) => {
                    const newFacts = [...geo.aiKeyFacts]
                    newFacts[index] = e.target.value
                    updateGeo({ aiKeyFacts: newFacts })
                  }}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs focus:border-blue-500 outline-none"
                />
              </div>
            ))}
            <button 
              onClick={() => updateGeo({ aiKeyFacts: [...geo.aiKeyFacts, ''] })}
              className="w-full py-2 border border-dashed border-neutral-800 rounded text-[10px] uppercase font-bold text-neutral-500 hover:border-neutral-700 hover:text-neutral-400 transition-all"
            >
              + Ajouter un fait
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">AI Tone</label>
          <select
            value={geo.aiTone}
            onChange={(e) => updateGeo({ aiTone: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
          >
            <option value="factuel">Factuel</option>
            <option value="promotionnel">Promotionnel</option>
            <option value="éducatif">Éducatif</option>
            <option value="technique">Technique</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default GeoPanel
