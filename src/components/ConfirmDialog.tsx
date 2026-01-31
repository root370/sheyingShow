'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  isDestructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Decorative Top Border */}
            <div className={`h-1 w-full ${isDestructive ? 'bg-red-500/50' : 'bg-white/20'}`} />

            <div className="p-8">
              <div className="flex items-start gap-5">
                {/* Icon */}
                <div className={`shrink-0 p-3 rounded-full ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white'}`}>
                  <AlertTriangle size={24} strokeWidth={1.5} />
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-serif text-white tracking-wide">{title}</h3>
                  <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-6 py-2.5 rounded-full text-xs font-sans tracking-widest uppercase text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-6 py-2.5 rounded-full text-xs font-sans tracking-widest uppercase text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                    isDestructive 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20' 
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
