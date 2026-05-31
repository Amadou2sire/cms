import React, { useEffect, useState } from 'react'
import client from '../api/client'
import { useBuilderStore } from './store/builderStore'
import { History, RotateCcw, X, Clock, GitCompare, ArrowLeft, CheckCircle2, CircleDashed, CircleDot } from 'lucide-react'

interface Revision {
  id: string
  page_id: string
  title?: string
  created_by?: string
  created_at: string
}

interface RevisionDetail extends Revision {
  schema: any
}

interface DiffChange {
  path: string
  type: 'added' | 'removed' | 'changed' | 'length_changed'
  value?: any
  from?: any
  to?: any
}

interface DiffSummary {
  added: number
  removed: number
  changed: number
}

interface RevisionPanelProps {
  pageId: string
}

const RevisionPanel: React.FC<RevisionPanelProps> = ({ pageId }) => {
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
  const loadPage = useBuilderStore((state) => state.loadPage)

  const fetchRevisions = async () => {
    setLoading(true)
    try {
      const res = await client.get(`/pages/${pageId}/revisions`)
      setRevisions(res.data)
    } catch (err) {
      console.error('Failed to fetch revisions', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pageId) fetchRevisions()
  }, [pageId])

  const handleView = async (revId: string) => {
    try {
      const res = await client.get(`/pages/${pageId}/revisions/${revId}`)
      setSelectedRevision(res.data)
    } catch (err) {
      console.error('Failed to fetch revision', err)
    }
  }

  const handleRestore = async (revId: string) => {
    if (!window.confirm('Restaurer cette version ? La version actuelle sera sauvegardée automatiquement.')) return
    setRestoring(revId)
    try {
      const res = await client.post(`/pages/${pageId}/revisions/${revId}/restore`)
      loadPage({ ...res.data.schema, id: pageId })
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
      const page = useBuilderStore.getState().page
      if (!page) return
      await client.post(`/pages/${pageId}/revisions`, {
        title: page.title
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
        `/pages/${pageId}/revisions/compare?revision_id_1=${revision1Id}&revision_id_2=${revision2Id}`
      )
      setDiffResult(res.data)
    } catch (err) {
      console.error('Failed to compare revisions', err)
      alert('Erreur lors de la comparaison')
    }
  }

  const getPathLabel = (path: string) => {
    // Clean up path for display
    return path
      .replace(/\.props\./g, '.')
      .split('.')
      .slice(0, 3)
      .join('.')
  }

  if (compareMode && diffResult) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
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
        </div>

        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Version 1</p>
              <p className="text-xs font-bold text-neutral-300">{diffResult.revision_1.title || 'Sans titre'}</p>
              <p className="text-[10px] text-neutral-600">
                {new Date(diffResult.revision_1.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <GitCompare className="text-neutral-600" size={20} />
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Version 2</p>
              <p className="text-xs font-bold text-neutral-300">{diffResult.revision_2.title || 'Sans titre'}</p>
              <p className="text-[10px] text-neutral-600">
                {new Date(diffResult.revision_2.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500/20 border border-green-500 rounded"></span>
              <span className="text-[10px] text-neutral-400">+ {diffResult.summary.added} ajoutés</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></span>
              <span className="text-[10px] text-neutral-400">- {diffResult.summary.removed} supprimés</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500/20 border border-yellow-500 rounded"></span>
              <span className="text-[10px] text-neutral-400">~ {diffResult.summary.changed} modifiés</span>
            </div>
          </div>
        </div>

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
                <div className="flex items-center gap-2 mb-2">
                  {change.type === 'added' && <CheckCircle2 size={14} className="text-green-500" />}
                  {change.type === 'removed' && <CircleDashed size={14} className="text-red-500" />}
                  {change.type === 'changed' && <CircleDot size={14} className="text-yellow-500" />}
                  {change.type === 'length_changed' && <CircleDot size={14} className="text-yellow-500" />}
                  <span className="font-bold text-neutral-300 uppercase tracking-wide">
                    {change.type === 'added' && 'AJOUTÉ'}
                    {change.type === 'removed' && 'SUPPRIMÉ'}
                    {change.type === 'changed' && 'MODIFIÉ'}
                    {change.type === 'length_changed' && 'TAILLE MODIFIÉE'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 mb-2 font-mono">{getPathLabel(change.path)}</p>

                {change.type === 'added' && change.value !== undefined && (
                  <div className="bg-neutral-900 rounded p-2 text-green-400">
                    <pre className="text-[10px] overflow-hidden text-ellipsis">
                      {JSON.stringify(change.value, null, 2).slice(0, 200)}
                    </pre>
                  </div>
                )}

                {change.type === 'removed' && change.value !== undefined && (
                  <div className="bg-neutral-900 rounded p-2 text-red-400">
                    <pre className="text-[10px] overflow-hidden text-ellipsis">
                      {JSON.stringify(change.value, null, 2).slice(0, 200)}
                    </pre>
                  </div>
                )}

                {change.type === 'changed' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-neutral-900 rounded p-2 text-red-400">
                      <p className="text-[10px] text-neutral-600 mb-1">AVANT</p>
                      <pre className="text-[10px] overflow-hidden text-ellipsis">
                        {JSON.stringify(change.from, null, 2).slice(0, 100)}
                      </pre>
                    </div>
                    <div className="bg-neutral-900 rounded p-2 text-green-400">
                      <p className="text-[10px] text-neutral-600 mb-1">APRÈS</p>
                      <pre className="text-[10px] overflow-hidden text-ellipsis">
                        {JSON.stringify(change.to, null, 2).slice(0, 100)}
                      </pre>
                    </div>
                  </div>
                )}

                {change.type === 'length_changed' && (
                  <div className="text-neutral-400">
                    <span>De {change.from} à {change.to} éléments</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (selectedRevision && !compareMode) {
    return (
      <div className="p-4 space-y-4">
        <button
          onClick={() => {
            setSelectedRevision(null)
            setDiffResult(null)
          }}
          className="flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <X size={14} /> Retour
        </button>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
            {selectedRevision.title || 'Sans titre'}
          </p>
          <p className="text-[10px] text-neutral-600">
            {new Date(selectedRevision.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
        <button
          onClick={() => handleRestore(selectedRevision.id)}
          disabled={restoring === selectedRevision.id}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          {restoring === selectedRevision.id ? 'Restauration...' : 'Restaurer cette version'}
        </button>
      </div>
    )
  }

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
        <span className="text-[10px] text-neutral-500">{revisions.length} version{revisions.length !== 1 ? 's' : ''}</span>
      </div>

      {compareMode && revisions.length >= 2 && (
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/30">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Comparer deux versions</p>
          <div className="flex items-center gap-2 mb-3">
            <select
              value={revision1Id || ''}
              onChange={(e) => setRevision1Id(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300"
            >
              <option value="">Version 1</option>
              {revisions.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.title || `Version ${revisions.length - revisions.indexOf(rev)}`} - {new Date(rev.created_at).toLocaleDateString('fr-FR')}
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
                  {rev.title || `Version ${revisions.length - revisions.indexOf(rev)}`} - {new Date(rev.created_at).toLocaleDateString('fr-FR')}
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
                    {rev.title || `Version ${revisions.length - idx}`}
                  </p>
                  <p className="text-[10px] text-neutral-600 mt-1">
                    {new Date(rev.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRestore(rev.id) }}
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

export default RevisionPanel