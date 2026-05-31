import React, { useEffect, useState } from 'react'
import client from '../api/client'
import { X, RotateCcw, Clock, GitCompare, ArrowLeft, CheckCircle2, CircleDashed, CircleDot } from 'lucide-react'

interface Revision {
  id: string
  component_id: string
  name?: string
  created_by?: string
  created_at: string
  default_props?: Record<string, any>
}

interface RevisionDetail extends Revision {
  default_props: Record<string, any>
}

interface DiffChange {
  path: string
  type: 'added' | 'removed' | 'changed'
  from?: any
  to?: any
  value?: any
}

interface DiffSummary {
  added: number
  removed: number
  changed: number
}

interface ComponentRevisionPanelProps {
  componentId: string
  onClose: () => void
}

// Helper to clean path names for the UI
const getPathLabel = (path: string) => {
  if (!path) return ''
  return path
    .replace(/_/g, ' ')
    .replace(/\./g, ' > ')
    .replace(/root > /, '')
}

// Helper to render a value cleanly without exposing raw JSON
const renderValue = (value: any, colorClass = 'text-neutral-300') => {
  if (value === null || value === undefined) return <span className="italic text-neutral-500">null</span>

  if (typeof value === 'string') {
    // If it looks like a hex color, show a color swatch
    if (value.match(/^#([0-9A-F]{3}){1,2}$/i)) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-neutral-600" style={{ backgroundColor: value }} />
          <span className={colorClass}>{value}</span>
        </div>
      )
    }
    if (value.startsWith('http')) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[150px] inline-block">
          {value}
        </a>
      )
    }
    return <span className={`${colorClass} break-all`}>{value}</span>
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className={colorClass}>{String(value)}</span>
  }

  if (Array.isArray(value)) {
    return <span className="text-neutral-500">[{value.length} éléments]</span>
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    // For simple flat objects (3 or fewer properties, no nested objects)
    if (entries.length <= 3 && !entries.some(([, v]) => typeof v === 'object')) {
      return (
        <div className="space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-neutral-500 text-[10px]">{k}:</span>
              <span className="text-neutral-300 text-[10px] break-all">{String(v)}</span>
            </div>
          ))}
        </div>
      )
    }
    return <span className="text-neutral-500">Objet complexe ({entries.length} propriétés)</span>
  }

  return <span className={colorClass}>{String(value)}</span>
}

const ComponentRevisionPanel: React.FC<ComponentRevisionPanelProps> = ({ componentId, onClose }) => {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [selectedRevision, setSelectedRevision] = useState<RevisionDetail | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [revision1Id, setRevision1Id] = useState<string | null>(null)
  const [revision2Id, setRevision2Id] = useState<string | null>(null)
  const [diffResult, setDiffResult] = useState<{
    diff: DiffChange[]
    summary: DiffSummary
    revision_1: any
    revision_2: any
  } | null>(null)

  const fetchRevisions = async () => {
    setLoading(true)
    try {
      const res = await client.get(`/components/${componentId}/revisions`)
      setRevisions(res.data)
    } catch (err) {
      console.error('Failed to fetch revisions', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevisions()
  }, [componentId])

  const handleView = async (revId: string) => {
    try {
      const res = await client.get(`/components/${componentId}/revisions/${revId}`)
      setSelectedRevision(res.data)
    } catch (err) {
      console.error('Failed to fetch revision', err)
    }
  }

  const handleRestore = async (revId: string) => {
    if (!window.confirm('Restaurer cette version ?')) return
    setRestoring(revId)
    try {
      await client.post(`/components/${componentId}/revisions/${revId}/restore`)
      await fetchRevisions()
      setSelectedRevision(null)
      setRevision1Id(null)
      setRevision2Id(null)
      setDiffResult(null)
    } catch (err) {
      console.error('Failed to restore revision', err)
      alert('Erreur lors de la restauration')
    } finally {
      setRestoring(null)
    }
  }

  const handleCreateSnapshot = async () => {
    try {
      const component = await client.get(`/components/${componentId}`)
      await client.post(`/components/${componentId}/revisions`, {
        name: component.data.name,
        default_props: component.data.default_props
      })
      await fetchRevisions()
    } catch (err) {
      console.error('Failed to create snapshot', err)
    }
  }

  const handleCompare = async () => {
    if (!revision1Id || !revision2Id) return
    try {
      const res = await client.get(
        `/components/${componentId}/revisions/compare?revision_id_1=${revision1Id}&revision_id_2=${revision2Id}`
      )
      setDiffResult(res.data)
    } catch (err) {
      console.error('Failed to compare revisions', err)
      alert('Erreur lors de la comparaison')
    }
  }

  // --- VIEW: SELECTED REVISION DETAILS ---
  if (selectedRevision && !compareMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <button
            onClick={() => setSelectedRevision(null)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <X size={14} /> Fermer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Snapshot metadata */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <p className="text-sm font-bold text-neutral-200">
              {selectedRevision.name || 'Sans titre'}
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">
              {new Date(selectedRevision.created_at).toLocaleString('fr-FR')}
            </p>
          </div>

          {/* Props list instead of raw JSON */}
          <div>
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Propriétés du composant</h4>
            <div className="bg-neutral-900 rounded-lg p-3 max-h-40 overflow-y-auto border border-neutral-800">
              {selectedRevision.default_props && Object.entries(selectedRevision.default_props).length > 0 ? (
                Object.entries(selectedRevision.default_props).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between text-xs py-1.5 border-b border-neutral-800 last:border-b-0 gap-2"
                  >
                    <span className="text-neutral-500 font-medium capitalize whitespace-nowrap">{getPathLabel(k)}</span>
                    <span className="text-neutral-200 text-right min-w-0">{renderValue(v)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-neutral-600 italic">Aucune propriété définie</p>
              )}
            </div>
          </div>

          <button
            onClick={() => handleRestore(selectedRevision.id)}
            disabled={restoring === selectedRevision.id}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            {restoring === selectedRevision.id ? 'Restauration...' : 'Restaurer cette version'}
          </button>
        </div>
      </div>
    )
  }

  // --- VIEW: COMPARE RESULTS ---
  if (compareMode && diffResult) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <button
            onClick={() => {
              setCompareMode(false)
              setDiffResult(null)
              setRevision1Id(null)
              setRevision2Id(null)
            }}
            className="flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        </div>

        <div className="p-4 border-b border-neutral-800 bg-neutral-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 flex-1">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Version 1</p>
              <p className="text-xs font-bold text-neutral-300 truncate">
                {diffResult.revision_1?.name || 'Sans titre'}
              </p>
              <p className="text-[10px] text-neutral-600">
                {new Date(diffResult.revision_1.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <GitCompare className="text-neutral-600" size={20} />
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 flex-1">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Version 2</p>
              <p className="text-xs font-bold text-neutral-300 truncate">
                {diffResult.revision_2?.name || 'Sans titre'}
              </p>
              <p className="text-[10px] text-neutral-600">
                {new Date(diffResult.revision_2.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500/20 border border-green-500 rounded"></span>
              <span className="text-[10px] text-neutral-400">+ {diffResult.summary.added}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></span>
              <span className="text-[10px] text-neutral-400">- {diffResult.summary.removed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500/20 border border-yellow-500 rounded"></span>
              <span className="text-[10px] text-neutral-400">~ {diffResult.summary.changed}</span>
            </div>
          </div>
        </div>

        {/* Diff list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {diffResult.diff.length === 0 ? (
            <div className="text-center py-12 text-neutral-600 text-xs uppercase tracking-widest">
              Aucune différence trouvée
            </div>
          ) : (
            diffResult.diff.map((change, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-3 text-xs ${
                  change.type === 'added'
                    ? 'border-green-500/30 bg-green-500/5'
                    : change.type === 'removed'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-yellow-500/30 bg-yellow-500/5'
                }`}
              >
                {/* Badge */}
                <div className="flex items-center gap-2 mb-2">
                  {change.type === 'added' && <CheckCircle2 size={14} className="text-green-500" />}
                  {change.type === 'removed' && <CircleDashed size={14} className="text-red-500" />}
                  {change.type === 'changed' && <CircleDot size={14} className="text-yellow-500" />}
                  <span className="font-bold text-neutral-300 uppercase tracking-wide">
                    {change.type === 'added' && 'AJOUTÉ'}
                    {change.type === 'removed' && 'SUPPRIMÉ'}
                    {change.type === 'changed' && 'MODIFIÉ'}
                  </span>
                </div>

                {/* Property path */}
                <p className="text-[10px] text-neutral-500 mb-2 font-mono">{getPathLabel(change.path)}</p>

                {/* Added */}
                {change.type === 'added' && (change.value !== undefined || change.to !== undefined) && (
                  <div className="bg-neutral-900 rounded p-2">
                    {renderValue(change.value || change.to, 'text-green-400')}
                  </div>
                )}

                {/* Removed */}
                {change.type === 'removed' && (change.value !== undefined || change.from !== undefined) && (
                  <div className="bg-neutral-900 rounded p-2">
                    {renderValue(change.value || change.from, 'text-red-400')}
                  </div>
                )}

                {/* Changed */}
                {change.type === 'changed' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-neutral-900 rounded p-2">
                      <p className="text-[10px] text-neutral-600 mb-1">AVANT</p>
                      {renderValue(change.from, 'text-red-400')}
                    </div>
                    <div className="bg-neutral-900 rounded p-2">
                      <p className="text-[10px] text-neutral-600 mb-1">APRÈS</p>
                      {renderValue(change.to, 'text-green-400')}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // --- MAIN VIEW: LIST OF REVISIONS ---
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateSnapshot}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <Clock size={12} /> Snap
          </button>
          {revisions.length >= 2 && (
            <button
              onClick={() => setCompareMode(true)}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <GitCompare size={12} /> Diff
            </button>
          )}
        </div>
        <span className="text-[10px] text-neutral-500">
          {revisions.length} version{revisions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {compareMode && revisions.length >= 2 && (
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/30">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Comparer deux versions
          </p>
          <div className="flex items-center gap-2 mb-3">
            <select
              value={revision1Id || ''}
              onChange={(e) => setRevision1Id(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300"
            >
              <option value="">Version 1</option>
              {revisions.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.name || `Version ${revisions.length - revisions.indexOf(rev)}`} -{' '}
                  {new Date(rev.created_at).toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
            <span className="text-neutral-600">→</span>
            <select
              value={revision2Id || ''}
              onChange={(e) => setRevision2Id(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300"
            >
              <option value="">Version 2</option>
              {revisions.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.name || `Version ${revisions.length - revisions.indexOf(rev)}`} -{' '}
                  {new Date(rev.created_at).toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={!revision1Id || !revision2Id}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-all"
          >
            Comparer
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-neutral-600 text-xs animate-pulse">Chargement...</div>
        ) : revisions.length === 0 ? (
          <div className="text-center py-12 text-neutral-600 text-xs uppercase tracking-widest">
            Aucune version sauvegardée
          </div>
        ) : (
          revisions.map((rev, idx) => (
            <div
              key={rev.id}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 hover:border-blue-500/30 transition-all cursor-pointer group"
              onClick={() => handleView(rev.id)}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-300 truncate">
                    {rev.name || `Version ${revisions.length - idx}`}
                  </p>
                  <p className="text-[10px] text-neutral-600 mt-1">
                    {new Date(rev.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRestore(rev.id)
                  }}
                  disabled={restoring === rev.id}
                  className="p-1.5 rounded bg-neutral-800 hover:bg-blue-600 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all ml-2"
                  title="Restaurer"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ComponentRevisionPanel