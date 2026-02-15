'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButton({ 
  title = "Latent Exhibition", 
  text = "我在 Latent 上策划了一场展览，邀请你来看看", 
  url,
  className = ""
}: ShareButtonProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = { title, text, url: shareUrl };

    // 1. Feature Detection
    if (navigator.share) {
      try {
        // Branch A: Native Share
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or failed, ignore
        console.warn('Share cancelled:', err);
      }
    } else {
      // Branch B: Clipboard Fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <button
        onClick={handleShare}
        className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <Share2 size={16} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
        <span className="text-xs md:text-sm font-serif tracking-widest uppercase group-hover:underline underline-offset-4 decoration-white/30">
          分享给朋友
        </span>
      </button>

      {/* Minimalist Feedback Toast */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="absolute top-full left-1/2 mt-4 whitespace-nowrap bg-white text-black px-4 py-2 rounded-sm shadow-xl flex items-center gap-2 pointer-events-none z-50"
          >
            <Check size={12} strokeWidth={3} />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              链接已复制，去邀请朋友吧
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
