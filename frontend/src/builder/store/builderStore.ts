import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { BLOCK_REGISTRY } from '../BlockRegistry'

export interface BlockNode {
  id: string
  type: string
  props: Record<string, any>
  children: BlockNode[]
}

export interface PageData {
  id: string
  slug: string
  title: string
  status: string
  schema: {
    root: BlockNode
    meta: { title: string; lang: string; description: string }
    seo: Record<string, any>
    geo: Record<string, any>
  }
}

interface BuilderState {
  page: PageData | null
  selectedId: string | null
  isDirty: boolean

  // History
  past: PageData[]
  future: PageData[]

  // i18n
  currentLang: string

  // Settings
  headerConfig: any
  footerConfig: any
  loadSettings: (headerConfig: any, footerConfig: any) => void

  // Actions
  undo: () => void
  redo: () => void
  loadPage: (page: PageData) => void
  selectBlock: (id: string | null) => void
  addBlock: (parentId: string | null, type: string, position?: number) => void
  moveBlock: (blockId: string, targetParentId: string | null, position: number) => void
  updateProps: (blockId: string, props: Record<string, any>) => void
  updateSeo: (seo: Record<string, any>) => void
  updateGeo: (geo: Record<string, any>) => void
  deleteBlock: (blockId: string) => void
  setCurrentLang: (lang: string) => void
}

/**
 * Get a localized value from a block's props.
 * Reads `props.i18n?.[lang]?.[key]` first, falls back to `props[key]`.
 */
export function getLocalizedValue(props: Record<string, any>, key: string, lang: string): any {
  return props?.i18n?.[lang]?.[key] ?? props?.[key]
}

export const useBuilderStore = create<BuilderState>((set) => ({
  page: null,
  selectedId: null,
  isDirty: false,
  past: [],
  future: [],
  currentLang: 'fr',
  headerConfig: null,
  footerConfig: null,

  loadSettings: (headerConfig, footerConfig) => set((state) => {
    if (!state.page) return { headerConfig, footerConfig }
    const newPage = JSON.parse(JSON.stringify(state.page))
    newPage.schema.root.children = newPage.schema.root.children.map((block: any) => {
      if (block.type === 'header' && headerConfig) {
        return { ...block, props: { ...block.props, ...headerConfig } }
      }
      if (block.type === 'footer' && footerConfig) {
        return { ...block, props: { ...block.props, ...footerConfig } }
      }
      return block
    })
    return { headerConfig, footerConfig, page: newPage }
  }),

  loadPage: (page) => set((state) => {
    const newPage = JSON.parse(JSON.stringify(page))
    if (state.headerConfig || state.footerConfig) {
      newPage.schema.root.children = newPage.schema.root.children.map((block: any) => {
        if (block.type === 'header' && state.headerConfig) {
          return { ...block, props: { ...block.props, ...state.headerConfig } }
        }
        if (block.type === 'footer' && state.footerConfig) {
          return { ...block, props: { ...block.props, ...state.footerConfig } }
        }
        return block
      })
    }
    return { page: newPage, isDirty: false, past: [], future: [] }
  }),
  
  undo: () => set((state) => {
    if (state.past.length === 0 || !state.page) return state
    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, -1)
    return {
      page: previous,
      past: newPast,
      future: [JSON.parse(JSON.stringify(state.page)), ...state.future],
      isDirty: true
    }
  }),

  redo: () => set((state) => {
    if (state.future.length === 0 || !state.page) return state
    const next = state.future[0]
    const newFuture = state.future.slice(1)
    return {
      page: next,
      past: [...state.past, JSON.parse(JSON.stringify(state.page))],
      future: newFuture,
      isDirty: true
    }
  }),

  selectBlock: (id) => set({ selectedId: id }),

  addBlock: (parentId, type, position) => {
    set((state) => {
      const defaultProps = type === 'header' && state.headerConfig
        ? state.headerConfig
        : type === 'footer' && state.footerConfig
        ? state.footerConfig
        : BLOCK_REGISTRY[type]?.defaultProps ?? {}

      const newBlock: BlockNode = {
        id: uuidv4(),
        type,
        props: { ...defaultProps },
        children: []
      }

      if (!state.page) return state
      
      const newPast = [...state.past, JSON.parse(JSON.stringify(state.page))]
      const newPage = JSON.parse(JSON.stringify(state.page))
      
      const addToNode = (node: BlockNode): boolean => {
        if (node.id === parentId) {
          if (position !== undefined) {
            node.children.splice(position, 0, newBlock)
          } else {
            node.children.push(newBlock)
          }
          return true
        }
        for (const child of node.children) {
          if (addToNode(child)) return true
        }
        return false
      }

      if (parentId === null) {
        // Find Footer index to insert BEFORE it
        const footerIndex = newPage.schema.root.children.findIndex((c: any) => c.type === 'footer')
        if (footerIndex !== -1) {
          newPage.schema.root.children.splice(footerIndex, 0, newBlock)
        } else {
          newPage.schema.root.children.push(newBlock)
        }
      } else {
        addToNode(newPage.schema.root)
      }

      return { page: newPage, past: newPast, future: [], isDirty: true, selectedId: newBlock.id }
    })
  },

  updateProps: (blockId, props) => {
    set((state) => {
      if (!state.page) return state
      const newPast = [...state.past, JSON.parse(JSON.stringify(state.page))]
      const newPage = JSON.parse(JSON.stringify(state.page))
      
      const updateNode = (node: BlockNode): boolean => {
        if (node.id === blockId) {
          node.props = { ...node.props, ...props }
          return true
        }
        for (const child of node.children) {
          if (updateNode(child)) return true
        }
        return false
      }

      updateNode(newPage.schema.root)
      return { page: newPage, past: newPast, future: [], isDirty: true }
    })
  },

  updateSeo: (seo) => {
    set((state) => {
      if (!state.page) return state
      const newPast = [...state.past, JSON.parse(JSON.stringify(state.page))]
      const newPage = JSON.parse(JSON.stringify(state.page))
      newPage.schema.seo = { ...newPage.schema.seo, ...seo }
      return { page: newPage, past: newPast, future: [], isDirty: true }
    })
  },

  updateGeo: (geo) => {
    set((state) => {
      if (!state.page) return state
      const newPast = [...state.past, JSON.parse(JSON.stringify(state.page))]
      const newPage = JSON.parse(JSON.stringify(state.page))
      newPage.schema.geo = { ...newPage.schema.geo, ...geo }
      return { page: newPage, past: newPast, future: [], isDirty: true }
    })
  },

  deleteBlock: (blockId) => {
    set((state) => {
      if (!state.page) return state
      const newPast = [...state.past, JSON.parse(JSON.stringify(state.page))]
      const newPage = JSON.parse(JSON.stringify(state.page))

      const deleteFromNode = (node: BlockNode): boolean => {
        const index = node.children.findIndex(c => c.id === blockId)
        if (index !== -1) {
          node.children.splice(index, 1)
          return true
        }
        for (const child of node.children) {
          if (deleteFromNode(child)) return true
        }
        return false
      }

      deleteFromNode(newPage.schema.root)
      return { 
        page: newPage, 
        past: newPast,
        future: [],
        isDirty: true, 
        selectedId: state.selectedId === blockId ? null : state.selectedId 
      }
    })
  },

  moveBlock: (_blockId, _targetParentId, _position) => {
    // Complex implementation for another time or simplified here
    // For now, let's keep it simple or implement as needed
  },

  setCurrentLang: (lang) => set({ currentLang: lang })
}))
