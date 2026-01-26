'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignUp() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    essence: ''
  })

  const presets = [
    "Recording (记录)",
    "Self-expression (表达自我)",
    "My Perspective (我的视角)"
  ]

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Call our custom API route to create user (skipping email confirmation)
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          essence: formData.essence,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // 2. Profile creation is handled by Database Trigger (already done)

      // 3. Auto Login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) {
        // If auto-login fails, redirect to login page as fallback
        console.error('Auto login failed:', loginError)
        router.push('/login')
        return
      }

      // Success & Logged In
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif tracking-widest text-white">THE PHOTOGRAPHER'S SOUL</h1>
          <p className="text-sm text-neutral-500 tracking-wide uppercase">Begin your journey</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-none px-4 py-3 text-sm transition-colors outline-none"
                placeholder="Your artistic alias"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-none px-4 py-3 text-sm transition-colors outline-none"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-none px-4 py-3 text-sm transition-colors outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-neutral-900">
              <label className="block text-sm font-serif text-white mb-4 text-center">
                What is the essence of photography to you?
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, essence: preset })}
                    className={`px-3 py-1.5 text-xs border transition-all duration-300 ${
                      formData.essence === preset
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-none px-4 py-3 text-sm transition-colors outline-none resize-none"
                placeholder="Or express your own thought..."
                value={formData.essence}
                onChange={(e) => setFormData({ ...formData, essence: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 text-sm uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Join the Gallery'}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Already have an account? Enter here
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
