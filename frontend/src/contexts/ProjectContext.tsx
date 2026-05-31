import React, { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  domain: string | null
  logo_url: string | null
  status: string
  languages: string[]
  default_language: string
  created_by: string
  created_at: string
  updated_at: string
}

interface ProjectContextValue {
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
  loading: boolean
  error: string | null
  languages: string[]
  defaultLanguage: string
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setProjects([])
      setCurrentProject(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await client.get('/projects/')
      setProjects(response.data)
      // Restore current project from localStorage if possible
      const storedProjectId = localStorage.getItem('currentProjectId')
      if (storedProjectId) {
        const found = response.data.find((p: Project) => p.id === storedProjectId)
        if (found) {
          setCurrentProject(found)
          return
        }
      }
      // Fallback: auto-select first project when no stored project is found
      if (response.data.length > 0) {
        handleSetCurrentProject(response.data[0])
      } else {
        handleSetCurrentProject(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project)
    if (project) {
      localStorage.setItem('currentProjectId', project.id)
    } else {
      localStorage.removeItem('currentProjectId')
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const handleAuthChanged = () => {
      fetchProjects()
    }
    window.addEventListener('auth-token-changed', handleAuthChanged)
    return () => window.removeEventListener('auth-token-changed', handleAuthChanged)
  }, [])

  const languages = currentProject?.languages || ["fr"]
  const defaultLanguage = currentProject?.default_language || "fr"

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject: handleSetCurrentProject,
        refreshProjects: fetchProjects,
        loading,
        error,
        languages,
        defaultLanguage,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
