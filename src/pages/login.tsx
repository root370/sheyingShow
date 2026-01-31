import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import RiveAnimation from '@/components/RiveAnimation'
import { Fit } from '@rive-app/react-canvas'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Preload audio
  useEffect(() => {
    const audio = new Audio('/sounds/shutter.mp3')
    audio.preload = 'auto'
  }, [])

  const playShutterAndFlash = () => {
    const audio = new Audio('/sounds/shutter.mp3')
    audio.play().catch(e => console.error("Audio play failed", e))
    
    setFlash(true)
    setTimeout(() => setFlash(false), 100) // Flash duration
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Play effect
      playShutterAndFlash()

      // 2. Wait a tiny bit for the effect to be felt before API call? 
      // Or just let it happen in parallel. Parallel is fine.
      
      // 3. Login
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      // Save email for next time
      localStorage.setItem('remembered_email', formData.email)

      // 4. Redirect after a short delay to let the "flash" settle and give a cinematic feel
      setTimeout(() => {
        router.push('/')
      }, 500)
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Flash Effect Overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none mix-blend-difference"
          />
        )}
      </AnimatePresence>

      {/* Rive Animation Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <RiveAnimation 
          src="/rive/17506-32816-planetdouch3.riv" 
          className="w-full h-full"
          fit={Fit.Cover}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="text-center space-y-6 mb-12">
          <p className="font-serif text-lg md:text-xl text-white/80 leading-relaxed tracking-wide">
            影像不止是像素。<br/> 它们是等待显影的记忆。
          </p>
          <p className="font-serif text-sm text-white/50 tracking-[0.2em] uppercase">
            欢迎来到 L A T E N T.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                autoComplete="username"
                type="email"
                required
                className="w-full bg-transparent border-b border-white/20 focus:border-white rounded-none px-2 py-3 text-center transition-colors outline-none placeholder:text-neutral-700 font-serif tracking-widest text-white"
                placeholder="邮箱"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <input
                id="password"
                name="password"
                autoComplete="current-password"
                type="password"
                required
                className="w-full bg-transparent border-b border-white/20 focus:border-white rounded-none px-2 py-3 text-center transition-colors outline-none placeholder:text-neutral-700 font-serif tracking-widest text-white"
                placeholder="口令"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center">{error}</div>
          )}

          <div className="pt-8 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden px-6 py-4 bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
            >
              <span className="relative z-10 font-serif tracking-[0.2em] text-sm font-bold">
                {loading ? '正在验证...' : '进入暗房'}
              </span>
            </button>

            <Link 
              href="/signup" 
              className="block w-full text-center py-4 border border-white/20 hover:border-white hover:bg-white hover:text-black text-neutral-400 transition-all duration-500"
            >
               <span className="font-serif text-xs tracking-[0.2em] uppercase">领取身份</span>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
