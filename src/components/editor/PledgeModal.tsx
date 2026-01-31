'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Eye } from 'lucide-react';

interface PledgeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPublishing?: boolean;
}

export function PledgeModal({ isOpen, onConfirm, onCancel, isPublishing }: PledgeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.7, bounce: 0.2 }}
            className="relative w-full max-w-lg bg-black border border-white/10 p-8 md:p-12 text-center flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                <Eye size={48} strokeWidth={1} className="text-white relative z-10" />
            </div>

            {/* Title */}
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-8 tracking-wide">
              摄影人的承诺
            </h2>

            {/* Body Text */}
            <div className="space-y-6 font-serif text-lg md:text-xl text-gray-400 leading-relaxed mb-12">
              <p>
                Latent 拒绝平庸的快照。
              </p>
              <p>
                在显影之前，请诚实地回答自己：<br />
                这些照片是否代表了你当下的<span className="text-white border-b border-white/30 pb-0.5">真实水平</span>？
              </p>
              <p>
                它是否是你曾经<span className="text-white border-b border-white/30 pb-0.5">带给你思考和真切感受</span>的作品？
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <button
                onClick={onConfirm}
                disabled={isPublishing}
                className="px-8 py-4 bg-white text-black font-sans text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {isPublishing ? '正在显影...' : '确认发布'}
              </button>
              
              <button
                onClick={onCancel}
                disabled={isPublishing}
                className="px-8 py-4 bg-transparent border border-white/20 text-white/60 font-sans text-xs font-bold tracking-[0.2em] uppercase hover:text-white hover:border-white transition-all min-w-[200px]"
              >
                取消
              </button>
            </div>
            
            {/* Footer Decoration */}
            <div className="absolute bottom-4 text-[10px] text-white/10 font-mono uppercase tracking-widest">
                Latent Space // Pledge
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
