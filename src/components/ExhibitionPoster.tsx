'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Exhibition } from '@/data/exhibitions';
import { Bookmark, Sparkles, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import ConfirmDialog from './ConfirmDialog';

interface ExhibitionPosterProps {
  exhibition: Exhibition;
  index: number;
  showAuthor?: boolean;
  onDelete?: (id: string) => void;
  initialCollected?: boolean;
}

const ExhibitionPoster: React.FC<ExhibitionPosterProps> = ({ exhibition, index, showAuthor, onDelete, initialCollected = false }) => {
  const router = useRouter();
  const ex = exhibition as any;
  const [isCollected, setIsCollected] = useState(initialCollected);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const isOwner = ex.type === 'own';
  // ...
  useEffect(() => {
    async function checkStatus() {
      // If we already know it's collected (passed via prop), skip the check
      if (!showAuthor || initialCollected) return; 
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('collections')
          .select('id')
          .eq('user_id', user.id)
          .eq('exhibition_id', exhibition.id)
          .maybeSingle();
        
        if (data) setIsCollected(true);
      } catch (error) {
        // Ignore errors, likely auth check failed or component unmounted
        console.warn("Collection status check failed", error);
      }
    }
    checkStatus();
  }, [exhibition.id, showAuthor]);

  const toggleCollect = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          alert("Please login to collect");
          setLoading(false);
          return;
      }

      if (isCollected) {
          const { error } = await supabase
            .from('collections')
            .delete()
            .eq('user_id', user.id)
            .eq('exhibition_id', exhibition.id);
          
          if (!error) setIsCollected(false);
      } else {
          const { error } = await supabase
            .from('collections')
            .insert({
                user_id: user.id,
                exhibition_id: exhibition.id
            });
          
          if (!error) setIsCollected(true);
      }
      setLoading(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
        // Now using Database Cascade Delete - we only need to delete the parent
        const { error } = await supabase
            .from('exhibitions')
            .delete()
            .eq('id', exhibition.id);

        if (error) throw error;
        
        // Show Toast FIRST
        setShowDeleteConfirm(false);
        setShowDeleteToast(true);

        // Wait a bit before removing from list so user sees the toast
        setTimeout(() => {
             if (onDelete) onDelete(exhibition.id);
        }, 1500);

    } catch (err) {
        console.error('Error deleting exhibition:', err);
        alert('Failed to delete exhibition. Please try again.');
        setShowDeleteConfirm(false);
    } 
    // Note: We don't close confirm dialog immediately on success to allow toast to show first if we wanted, 
    // but actually we want to show toast THEN refresh list.
    // However, since the list refresh happens via parent callback, this component might unmount!
    // So the toast should actually be in the parent (Lobby).
    // BUT, if we want to show it here briefly before unmount, or if we rely on optimistic updates...
    // Let's try showing it here. If the component unmounts immediately, we won't see it.
    // The parent 'onDelete' updates the list state, which removes this component from DOM.
    // So we can't show the toast INSIDE this component after successful delete.
    // We should ideally call onDelete AFTER the toast or have the parent show the toast.
    
    // Let's quick fix: show toast, wait 1s, THEN call onDelete.
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/editor?id=${exhibition.id}`);
  };

  return (
    <div className="group relative w-full flex flex-col gap-2 mb-8 md:mb-12 break-inside-avoid">
        <Link href={`/exhibition/${exhibition.id}`} className="block w-full" prefetch={false}>
            {/* 1. Card Container */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full rounded-lg overflow-hidden group bg-neutral-900 border border-white/10 md:hover:shadow-xl md:hover:scale-[1.02] transition-all duration-500 ease-out"
            >
                {/* Image Container - Height Auto, No Cropping */}
                <div className="relative w-full h-auto min-h-[100px] bg-neutral-900">
                        <img
                        src={`${exhibition.cover}${exhibition.cover?.includes('?') ? '&' : '?'}v=${new Date((exhibition as any).created_at).getTime()}`}
                        alt={exhibition.title}
                        className="w-full h-auto block object-contain md:grayscale-[20%] md:brightness-90 md:group-hover:grayscale-0 md:group-hover:brightness-100 transition-all duration-700 ease-out"
                        loading="lazy"
                    />
                    
                    {/* Cinematic Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 md:group-hover:opacity-40 transition-opacity duration-500" />
                    
                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E\")" }} />

                    {/* Inner Border */}
                    <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-lg" />
                </div>

                {/* Collect Button (Top Right) */}
                {showAuthor && (
                    <button
                        onClick={toggleCollect}
                        aria-label={isCollected ? "取消收藏" : "加入收藏"}
                        className={`absolute top-2 right-2 z-20 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                            isCollected 
                            ? 'bg-accent text-black shadow-[0_0_15px_rgba(229,208,172,0.5)]' 
                            : 'bg-black/20 text-white/50 hover:bg-white hover:text-black'
                        }`}
                    >
                        <Bookmark size={14} fill={isCollected ? "currentColor" : "none"} />
                    </button>
                )}
            </motion.div>

            {/* 2. Text Info (Below Card) */}
            <div className="px-1 mt-1">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                        {/* Hidden Icon that slides in */}
                        <span className="relative w-0 group-hover:w-8 transition-all duration-300 ease-out overflow-hidden flex items-center justify-center">
                            <span className="opacity-0 -translate-x-full group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out text-accent">
                                <Sparkles size={20} fill="currentColor" />
                            </span>
                        </span>
                        
                        {/* Title that slides right */}
                        <h2 className="font-serif text-sm md:text-2xl text-white group-hover:text-accent transition-colors duration-300 transform group-hover:translate-x-2 transition-transform ease-out line-clamp-1 break-all">
                            {exhibition.title}
                        </h2>
                    </div>

                    <span className="text-white/30 text-[10px] font-sans tracking-widest uppercase">
                        {ex.year}
                    </span>
                 </div>
                 
                 {showAuthor && ex.username && (
                    <div className="flex items-center gap-2 mt-2 pl-0 group-hover:pl-10 transition-all duration-300 ease-out">
                        <div className="h-[1px] w-4 bg-white/20" />
                        <p className="text-white/50 text-xs font-sans tracking-wider uppercase">
                            {ex.username}
                        </p>
                    </div>
                 )}

                 {/* Owner Actions (Moved to bottom right, subtle text buttons) */}
                {isOwner && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            <Edit size={12} />
                            <span>编辑</span>
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="flex items-center gap-2 text-[10px] text-white/40 hover:text-red-400 uppercase tracking-widest transition-colors"
                        >
                            <Trash2 size={12} />
                            <span>移除</span>
                        </button>
                    </div>
                )}
            </div>
        </Link>
        
        <ConfirmDialog
            isOpen={showDeleteConfirm}
            title="移除展览"
            description="确定要移除这个展览吗？此操作无法撤销。"
            confirmText="移除"
            cancelText="取消"
            isDestructive={true}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Delete Success Toast - Custom Implementation since we don't have a global toast yet */}
        <AnimatePresence>
            {showDeleteToast && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 20, x: "-50%" }}
                    className="fixed bottom-8 left-1/2 z-[100] bg-white text-black px-6 py-3 rounded-full text-xs font-sans tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-3"
                >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    展览已移除
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default ExhibitionPoster;
