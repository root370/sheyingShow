'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-8 left-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-[#1A1A1A] border border-red-500/50 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <AlertCircle size={18} className="text-red-500" />
          <span className="text-sm font-sans font-medium text-white tracking-wide">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
