import React, { useState } from 'react'
import client from '../api/client'
import { useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)
      
      const response = await client.post('/auth/login', formData)
      localStorage.setItem('token', response.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError('Email ou mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Canvas CMS</h1>
        <p className="text-neutral-500 text-sm mb-8">Connectez-vous pour gérer votre contenu</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
              placeholder="admin@canvas.dev"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
