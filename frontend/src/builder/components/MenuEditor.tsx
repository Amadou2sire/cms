import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface MenuItem {
  label: string
  href: string
  children: MenuItem[]
}

interface MenuEditorProps {
  items: MenuItem[]
  onChange: (items: MenuItem[]) => void
  availablePages?: { title: string, slug: string }[]
}

const MenuEditor: React.FC<MenuEditorProps> = ({ items, onChange, availablePages = [] }) => {
  const addItem = (_: MenuItem[], path: number[] = []) => {
    const newItems = JSON.parse(JSON.stringify(items))
    let current = newItems
    
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]].children
    }
    
    current.push({ label: 'Nouveau lien', href: '#', children: [] })
    onChange(newItems)
  }

  const removeItem = (path: number[]) => {
    const newItems = JSON.parse(JSON.stringify(items))
    let current = newItems
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].children
    }
    
    current.splice(path[path.length - 1], 1)
    onChange(newItems)
  }

  const updateItem = (path: number[], field: keyof MenuItem, value: string) => {
    const newItems = JSON.parse(JSON.stringify(items))
    let current: any = newItems
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].children
    }
    
    current[path[path.length - 1]][field] = value
    onChange(newItems)
  }

  const renderItem = (item: MenuItem, path: number[], level: number) => {
    const systemPages = [
      { title: '🏠 Accueil', slug: '' },
      { title: '📰 Actualités', slug: 'actualites' },
    ]
    const allOptions = [...systemPages, ...availablePages]
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={path.join('-')} className="space-y-2">
        <div className="flex items-center gap-2 group">
          <div className="flex-1 flex items-center gap-2 bg-neutral-800/50 border border-neutral-700 rounded-lg p-2 hover:border-blue-500/50 transition-all">
             <div className="w-6 h-6 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-black text-neutral-500">
                {level + 1}
             </div>
             <input 
               type="text" 
               value={item.label}
               onChange={(e) => updateItem(path, 'label', e.target.value)}
               className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-neutral-600"
               placeholder="Libellé (ex: Boutique)"
             />
              <div className="flex items-center gap-1 w-3/5">
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-600 font-mono">URL:</span>
                  <input 
                    type="text" 
                    value={item.href}
                    onChange={(e) => updateItem(path, 'href', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-2 py-1.5 text-[10px] font-mono text-blue-400 focus:border-blue-500 outline-none"
                    placeholder="/votre-lien"
                  />
                </div>
                <select
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-[9px] font-bold text-neutral-400 focus:border-blue-500 outline-none cursor-pointer max-w-[100px]"
                  onChange={(e) => {
                    const slug = e.target.value
                    const link = slug === '' ? '/' : `/${slug}`
                    updateItem(path, 'href', link)
                    
                    if (item.label === 'Nouveau lien' || !item.label) {
                      const page = allOptions.find(p => p.slug === slug)
                      if (page) updateItem(path, 'label', page.title.replace(/^[^\s]+\s/, ''))
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>Lier...</option>
                  {allOptions.map(p => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
             <button 
               onClick={() => removeItem(path)}
               className="p-1.5 text-neutral-600 hover:text-red-500 transition-colors"
             >
               <Trash2 size={14} />
             </button>
          </div>
          {level < 2 && (
            <button 
              onClick={() => addItem(item.children, path)}
              className="p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
              title="Ajouter un sous-menu"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {hasChildren && (
          <div className="ml-8 pl-4 border-l border-neutral-800 space-y-2 pt-2">
            {item.children.map((child, idx) => renderItem(child, [...path, idx], level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => renderItem(item, [idx], 0))}
      <button 
        onClick={() => addItem(items)}
        className="w-full py-3 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Ajouter au menu principal
      </button>
    </div>
  )
}

export default MenuEditor
