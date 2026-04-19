import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BuilderLayout from './builder/BuilderLayout'
import PreviewPage from './pages/PreviewPage'
import PublicPage from './pages/PublicPage'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        
        <Route path="/builder/:id" element={
          <ProtectedRoute><BuilderLayout /></ProtectedRoute>
        } />

        <Route path="/preview/:id" element={
          <ProtectedRoute><PreviewPage /></ProtectedRoute>
        } />
        
        {/* Public Routes */}
        <Route path="/:slug" element={<PublicPage />} />
        <Route path="/" element={<PublicPage isHome={true} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
