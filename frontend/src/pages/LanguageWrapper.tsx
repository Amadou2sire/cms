import React from 'react'
import { Navigate, useParams, useLocation } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'

/**
 * Wraps public routes to handle i18n language prefix
 * - If URL has /:lang, validates and passes lang to children
 * - If URL has no lang, redirects to /{defaultLanguage}/...
 */
export const LanguageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useParams<{ lang?: string }>()
  const { defaultLanguage, languages } = useProject()
  const location = useLocation()

  const validLang = languages.includes(lang || '')
  const targetLang = validLang ? lang : defaultLanguage

  // If no lang in URL or invalid, redirect to default language
  if (!lang || !validLang) {
    // Preserve the rest of the path after /:lang
    const pathWithoutPrefix = location.pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '')
    return <Navigate to={`/${targetLang}${pathWithoutPrefix}`} replace />
  }

  return <>{children}</>
}

export default LanguageWrapper