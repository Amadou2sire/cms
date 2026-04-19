import { create } from 'zustand'

export interface SeoState {
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  canonical: string
  noIndex: boolean
  noFollow: boolean
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogType: string
  twitterCard: string
  twitterSite: string
  structuredData: any
  
  updateSeo: (data: Partial<SeoState>) => void
}

export const useSeoStore = create<SeoState>((set) => ({
  metaTitle: '',
  metaDescription: '',
  metaKeywords: [],
  canonical: '',
  noIndex: false,
  noFollow: false,
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: '',
  structuredData: {},

  updateSeo: (data) => set((state) => ({ ...state, ...data }))
}))
