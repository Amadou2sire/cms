import React from 'react'
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react'

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
  const addItem = (parentItems: MenuItem[], path: number[] = []) => {
    const newItems = [...items]
    let current = newItems
    
    // Navigate to the correct nesting level
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]].children
    }
    
    current.push({ label: 'Nouveau lien', href: '#', children: [] })
    onChange(newItems)
  }

  const removeItem = (path: number[]) => {
    const newItems = [...items]
    let current = newItems
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].children
    }
    
    current.splice(path[path.length - 1], 1)
    onChange(newItems)
  }

  const updateItem = (path: number[], field: keyof MenuItem, value: string) => {
    const newItems = [...items]
    let current: any = newItems
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].children
    }
    
    current[path[path.length - 1]][field] = value
    onChange(newItems)
  }

  const renderItem = (item: MenuItem, path: number[], level: number) => {
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
               placeholder="Label"
             />
              <div className="flex items-center gap-1 w-1/2">
                <input 
                  type="text" 
                  value={item.href}
                  onChange={(e) => updateItem(path, 'href', e.target.value)}
                  className="flex-1 bg-neutral-900/50 border border-neutral-700 rounded-l px-2 py-1 text-[10px] font-mono text-neutral-400 focus:border-blue-500 outline-none"
                  placeholder="URL ou /slug"
                />
                <select
                  className="bg-neutral-800 border-y border-r border-neutral-700 rounded-r px-1 py-1 text-[9px] font-bold text-blue-400 focus:outline-none cursor-pointer max-w-[80px]"
                  onChange={(e) => {
                    if (e.target.value) {
                      updateItem(path, 'href', `/${e.target.value}`)
                      // If label is still default, update it too
                      if (item.label === 'Nouveau lien') {
                        const page = availablePages.find(p => p.slug === e.target.value)
                        if (page) updateItem(path, 'label', page.title)
                      }
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>Lier une page...</option>
                  {availablePages.map(p => (
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

        {item.children.length > 0 && (
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
