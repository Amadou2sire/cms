import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import client from '../api/client'
import { useProject } from '../contexts/ProjectContext'
import MenuEditor from '../builder/components/MenuEditor'
import { BLOCK_REGISTRY, type PropDefinition } from '../builder/BlockRegistry'

interface ComponentItem {
  id: string
  name: string
  type: string
  default_props: Record<string, any>
}

const ComponentEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentProject } = useProject()
  const [components, setComponents] = useState<ComponentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cloneFromId, setCloneFromId] = useState<string>((location.state as any)?.cloneFromId || '')
  const [form, setForm] = useState({
    name: '',
    type: '',
    defaultProps: {} as Record<string, any>
  })

  const builderTypes = useMemo(
    () => Object.values(BLOCK_REGISTRY).filter((block) => block.type !== 'globalComponent'),
    []
  )
  const selectedType = builderTypes.find((block) => block.type === form.type)

  const getTypeDefaults = (type: string) => {
    const block = builderTypes.find((blockItem) => blockItem.type === type)
    return block ? { ...block.defaultProps } : {}
  }

  const fetchComponents = async () => {
    if (!currentProject) return
    try {
      const res = await client.get('/components/')
      setComponents(res.data)
    } catch (error) {
      console.error('Failed to fetch components', error)
    }
  }

  useEffect(() => {
    fetchComponents()
  }, [currentProject])

  useEffect(() => {
    if (!currentProject) return
    if (id) {
      setLoading(true)
      client
        .get(`/components/${id}`)
        .then((res) => {
          setForm({
            name: res.data.name,
            type: res.data.type,
            defaultProps: { ...res.data.default_props }
          })
        })
        .catch((error) => {
          console.error('Failed to load component', error)
          alert('Impossible de charger le composant')
          navigate('/dashboard/components')
        })
        .finally(() => setLoading(false))
    }
  }, [id, currentProject, navigate])

  useEffect(() => {
    if (!id && cloneFromId && components.length) {
      const cloned = components.find((component) => component.id === cloneFromId)
      if (cloned) {
        setForm({
          name: `${cloned.name}-copie`,
          type: cloned.type,
          defaultProps: { ...cloned.default_props }
        })
      }
    }
  }, [cloneFromId, components, id])

  const renderConfigField = (key: string, prop: PropDefinition) => {
    const value = form.defaultProps[key] ?? prop.default

    const handleChange = (nextValue: any) => {
      setForm({
        ...form,
        defaultProps: { ...form.defaultProps, [key]: nextValue }
      })
    }

    const renderFieldInput = (value: any, prop: PropDefinition, onChange: (nextValue: any) => void) => {
      switch (prop.type) {
        case 'string':
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
            />
          )
        case 'richtext':
          return (
            <textarea
              rows={4}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full min-h-[120px] resize-none bg-black border border-neutral-800 rounded px-3 py-2 text-white"
            />
          )
        case 'select':
          return (
            <select
              value={value || prop.default}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
            >
              {prop.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )
        case 'color':
          return (
            <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded px-3 py-2">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-12 rounded border-none p-0"
              />
              <input
                type="text"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm font-mono text-white focus:outline-none"
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
          return (
            <div className="space-y-3">
              {value && typeof value === 'string' && (
                <img src={value} alt="Preview" className="w-full h-24 object-cover rounded border border-neutral-800" />
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="URL de l'image"
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
                        try {
                          const res = await client.post('/media/upload', formData)
                          onChange(res.data.url)
                        } catch (uploadError) {
                          console.error('Media upload failed', uploadError)
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )
        case 'menu':
          return (
            <MenuEditor
              items={Array.isArray(value) ? value : []}
              onChange={(items) => onChange(items)}
            />
          )
        case 'list':
          return (
            <textarea
              rows={4}
              value={value ? JSON.stringify(value, null, 2) : ''}
              onChange={(e) => {
                try {
                  onChange(JSON.parse(e.target.value || '[]'))
                } catch {
                  onChange([])
                }
              }}
              className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
            />
          )
        default:
          return (
            <textarea
              rows={4}
              value={value ? JSON.stringify(value, null, 2) : ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
            />
          )
      }
    }

    const renderListField = () => {
      const valueList = Array.isArray(value) ? value : []
      return (
        <div className="space-y-4">
          {valueList.map((item, idx) => (
            <div key={idx} className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="bg-neutral-800/50 px-3 py-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-neutral-500">#{idx + 1}</span>
                <button
                  onClick={() => {
                    const newList = [...valueList]
                    newList.splice(idx, 1)
                    handleChange(newList)
                  }}
                  className="text-neutral-500 hover:text-red-500 transition-colors"
                >
                  Supprimer
                </button>
              </div>
              <div className="p-3 space-y-3">
                {prop.itemSchema && Object.entries(prop.itemSchema).map(([itemKey, itemProp]) => (
                  <div key={itemKey} className="space-y-1">
                    <label className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">{itemProp.label}</label>
                    {renderFieldInput(
                      item[itemKey],
                      itemProp as PropDefinition,
                      (nextValue) => {
                        const newList = [...valueList]
                        newList[idx] = { ...newList[idx], [itemKey]: nextValue }
                        handleChange(newList)
                      }
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const nextItem = Object.entries(prop.itemSchema || {}).reduce((acc, [itemKey, itemProp]) => {
                acc[itemKey] = itemProp.default
                return acc
              }, {} as Record<string, any>)
              handleChange([...valueList, nextItem])
            }}
            className="w-full py-3 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 hover:text-blue-400 hover:border-blue-500/50 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            + Ajouter
          </button>
        </div>
      )
    }

    switch (prop.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
          />
        )
      case 'richtext':
        return (
          <textarea
            rows={4}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full min-h-[120px] resize-none bg-black border border-neutral-800 rounded px-3 py-2 text-white"
          />
        )
      case 'select':
        return (
          <select
            value={value || prop.default}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
          >
            {prop.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'color':
        return (
          <div className="flex items-center gap-3 bg-black border border-neutral-800 rounded px-3 py-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="h-10 w-12 rounded border-none p-0"
            />
            <input
              type="text"
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm font-mono text-white focus:outline-none"
            />
          </div>
        )
      case 'spacing':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="ex: 10px 20px 10px 20px"
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none"
          />
        )
      case 'media':
        return (
          <div className="space-y-3">
            {value && typeof value === 'string' && (
              <img src={value} alt="Preview" className="w-full h-24 object-cover rounded border border-neutral-800" />
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="URL de l'image"
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
                      try {
                        const res = await client.post('/media/upload', formData)
                        handleChange(res.data.url)
                      } catch (uploadError) {
                        console.error('Media upload failed', uploadError)
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )
      case 'list':
        return renderListField()
      case 'menu':
        return (
          <MenuEditor
            items={Array.isArray(value) ? value : []}
            onChange={(items) => handleChange(items)}
          />
        )
      default:
        return (
          <textarea
            rows={4}
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white"
          />
        )
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.type) {
      alert('Le nom et le type du composant sont obligatoires.')
      return
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      default_props: { ...form.defaultProps }
    }

    setSaving(true)
    try {
      if (id) {
        await client.put(`/components/${id}`, payload)
        await client.post(`/components/${id}/revisions`, payload).catch(() => {})
      } else {
        await client.post('/components/', payload)
        await client.post(`/components/${payload.name}/revisions`, payload).catch(() => {})
      }
      navigate('/dashboard/components')
    } catch (error) {
      console.error('Failed to save component', error)
      alert('Erreur lors de l’enregistrement du composant')
    } finally {
      setSaving(false)
    }
  }

  if (!currentProject) {
    return <p className="text-neutral-500">Sélectionnez un projet pour gérer les composants.</p>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Chargement…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col gap-4 mb-12">
          <Link
            to="/dashboard/components"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Retour à la liste des composants
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">{id ? 'Modifier un composant' : 'Créer un composant'}</p>
              <h1 className="text-3xl font-black uppercase tracking-tighter">{id ? `Composant ${form.name || '...'}` : 'Nouveau composant'}</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save size={16} /> {id ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </header>

        <div className="space-y-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Type de composant</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const nextType = e.target.value
                  setForm({
                    ...form,
                    type: nextType,
                    defaultProps: nextType === form.type ? form.defaultProps : getTypeDefaults(nextType)
                  })
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl px-4 py-3 text-white"
              >
                <option value="">Sélectionner un type</option>
                {builderTypes.map((block) => (
                  <option key={block.type} value={block.type}>
                    {block.label} ({block.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Nom du composant</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du composant"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl px-4 py-3 text-white"
              />
            </div>
          </div>

          {!id && components.length > 0 && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Cloner un composant existant</label>
              <select
                value={cloneFromId}
                onChange={(e) => setCloneFromId(e.target.value)}
                className="w-full mt-3 bg-neutral-900 border border-neutral-800 rounded-3xl px-4 py-3 text-white"
              >
                <option value="">Choisir un composant</option>
                {components.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.name} ({component.type})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-500 mt-2">Le composant choisi remplira automatiquement le formulaire.</p>
            </div>
          )}

          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.3em] font-black text-neutral-400">Configuration des props</div>
            {selectedType ? (
              <div className="space-y-6">
                {Object.entries(selectedType.propSchema).map(([key, prop]) => (
                  <div key={key} className="space-y-2">
                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                      {prop.label}
                      {prop.i18n && <span className="text-[8px] uppercase tracking-[0.3em] text-blue-400">i18n</span>}
                    </label>
                    {renderConfigField(key, prop)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-500">
                Sélectionnez un type de composant pour afficher les options de configuration.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComponentEditPage
