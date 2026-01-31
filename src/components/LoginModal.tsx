'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Eye, X } from 'lucide-react';
import { useRouter } from 'next/router';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  redirectUrl
}: LoginModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    // Determine redirect URL: use provided, or current window location
    const finalRedirect = redirectUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
    router.push(`/login?redirect=${encodeURIComponent(finalRedirect)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          >
            {/* Darkroom Ambience Gradient */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />

            <div className="p-8 flex flex-col items-center text-center relative z-10">
                {/* Icon Circle */}
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <LogIn size={28} className="text-white/80" strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-serif text-white tracking-wide mb-3">
                    进入暗房
                </h3>
                
                <p className="text-sm text-neutral-400 font-sans leading-relaxed mb-8 px-2">
                    留下印记之前，请先确认你的身份。<br/>
                    登录后，你可以评论、收藏，并建立自己的展览。
                </p>

                {/* Actions */}
                <div className="w-full space-y-3">
                    <button
                        onClick={handleLogin}
                        className="w-full py-3.5 rounded-full bg-white text-black text-xs font-bold font-sans tracking-widest uppercase hover:bg-neutral-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                    >
                        <span>前往登录</span>
                        <LogIn size={14} />
                    </button>
                    
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-full bg-white/5 text-white/60 text-xs font-sans tracking-widest uppercase border border-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <span>先看看</span>
                        <Eye size={14} />
                    </button>
                </div>
            </div>

            {/* Close Button (Top Right) */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors p-2"
            >
                <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
