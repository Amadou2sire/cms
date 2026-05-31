import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Inject JWT token into every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Inject the current project ID from localStorage
  const currentProjectId = localStorage.getItem('currentProjectId')
  if (currentProjectId) {
    config.headers['X-Project-ID'] = currentProjectId
  }
  return config
})

// On 401 (expired or invalid token), clear session and redirect to /login
client.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Only force a full redirect to /login when the failed request was
      // authenticated (had an Authorization header). This prevents public
      // requests (e.g. fetching public pages or unauthenticated project
      // metadata) from causing an automatic redirect to the login page.
      const hadAuth = !!error.config?.headers?.Authorization
      if (hadAuth) {
        localStorage.removeItem('token')
        window.dispatchEvent(new Event('auth-token-changed'))
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default client
