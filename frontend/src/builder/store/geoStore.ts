import { create } from 'zustand'

export interface GeoState {
  enabled: boolean
  aiSummary: string
  aiContext: string
  aiKeyFacts: string[]
  aiTone: string
  aiAudience: string[]
  llmsTxt: {
    enabled: boolean
    content: string
  }
  citationSignals: any
  entityDefinition: any
  contentClarity: {
    faqEnabled: boolean
    faqItems: { question: string; answer: string }[]
  }
  
  updateGeo: (data: Partial<GeoState>) => void
}

export const useGeoStore = create<GeoState>((set) => ({
  enabled: true,
  aiSummary: '',
  aiContext: '',
  aiKeyFacts: [],
  aiTone: 'factuel',
  aiAudience: [],
  llmsTxt: {
    enabled: true,
    content: ''
  },
  citationSignals: {},
  entityDefinition: {},
  contentClarity: {
    faqEnabled: false,
    faqItems: []
  },

  updateGeo: (data) => set((state) => ({ ...state, ...data }))
}))
