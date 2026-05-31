import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ProjectProvider, useProject } from './contexts/ProjectContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BuilderLayout from './builder/BuilderLayout'
import PreviewPage from './pages/PreviewPage'
import PublicPage from './pages/PublicPage'
import ArticlesPage from './pages/ArticlesPage'
import ArticleEditPage from './pages/ArticleEditPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import NewsListingPage from './pages/NewsListingPage'
import { ComponentsPage } from './pages/ComponentsPage'
import ComponentEditPage from './pages/ComponentEditPage'
import { FormsPage } from './pages/FormsPage'
import { TeamPage } from './pages/TeamPage'
import { WebhooksPage } from './pages/WebhooksPage'
import LanguageWrapper from './pages/LanguageWrapper'
import NavFooterPage from './pages/NavFooterPage'
import SiteSettingsPage from './pages/SiteSettingsPage'
import DashboardShell from './layouts/DashboardShell'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="articles" element={<ArticlesPage />} />
            <Route path="components" element={<ComponentsPage />} />
            <Route path="forms" element={<FormsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="nav-footer" element={<NavFooterPage />} />
            <Route path="site-settings" element={<SiteSettingsPage />} />
          </Route>

          <Route path="/dashboard/articles/new" element={<ProtectedRoute><ArticleEditPage /></ProtectedRoute>} />
          <Route path="/dashboard/articles/edit/:id" element={<ProtectedRoute><ArticleEditPage /></ProtectedRoute>} />
          <Route path="/dashboard/components/new" element={<ProtectedRoute><ComponentEditPage /></ProtectedRoute>} />
          <Route path="/dashboard/components/edit/:id" element={<ProtectedRoute><ComponentEditPage /></ProtectedRoute>} />

          <Route path="/builder/:id" element={
            <ProtectedRoute><BuilderLayout /></ProtectedRoute>
          } />

          <Route path="/preview/:id" element={
            <ProtectedRoute><PreviewPage /></ProtectedRoute>
          } />

          {/* Public Routes with i18n */}
          <Route path="/:lang/actualites" element={
            <LanguageWrapper><NewsListingPage /></LanguageWrapper>
          } />
          <Route path="/:lang/articles/:slug" element={
            <LanguageWrapper><ArticleDetailPage /></LanguageWrapper>
          } />
          <Route path="/:lang/:slug" element={
            <LanguageWrapper><PublicPage /></LanguageWrapper>
          } />
          <Route path="/:lang" element={
            <LanguageWrapper><PublicPage isHome={true} /></LanguageWrapper>
          } />
          {/* Root redirect to default language home - redirect instead of rendering directly */}
          <Route path="/" element={<Navigate to="/fr" replace />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  )
}

export default App
