'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface NavigationSwitchProps {
  currentMode: 'dashboard' | 'explore';
}

export default function NavigationSwitch({ currentMode }: NavigationSwitchProps) {
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 flex shadow-2xl">
        <Link href="/dashboard" className="relative px-8 py-3 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] transition-colors duration-500 outline-none focus-visible:ring-1 focus-visible:ring-white/30 uppercase">
          {currentMode === 'dashboard' && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-white rounded-full shadow-lg"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className={`relative z-10 transition-colors duration-300 ${currentMode === 'dashboard' ? 'text-black' : 'text-neutral-400 hover:text-white'}`}>
            My Gallery
          </span>
        </Link>
        <Link href="/" className="relative px-8 py-3 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] transition-colors duration-500 outline-none focus-visible:ring-1 focus-visible:ring-white/30 uppercase">
          {currentMode === 'explore' && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-white rounded-full shadow-lg"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
           <span className={`relative z-10 transition-colors duration-300 ${currentMode === 'explore' ? 'text-black' : 'text-neutral-400 hover:text-white'}`}>
            Scout
          </span>
        </Link>
      </div>
    </div>
  );
}
