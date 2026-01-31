'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface NavigationSwitchProps {
  currentMode: 'dashboard' | 'explore';
}

export default function NavigationSwitch({ currentMode }: NavigationSwitchProps) {
  return (
    <div className="fixed z-50 top-7 left-6 md:top-8 md:left-1/2 md:-translate-x-1/2">
      {/* Mobile Design (Split Pill) */}
      <div className="md:hidden bg-[#151515] backdrop-blur-xl border border-white/10 rounded-full p-1 pl-4 pr-1 flex items-center shadow-2xl gap-4">
        <Link href="/dashboard" className="group relative outline-none">
          <div className={`relative z-10 flex flex-col items-start leading-none py-2 px-1 transition-colors duration-300 ${currentMode === 'dashboard' ? 'text-black' : 'text-white/70 group-hover:text-white'}`}>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase">我的</span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase">展览</span>
          </div>
          {currentMode === 'dashboard' && (
            <motion.div
              layoutId="nav-pill-bg-mobile"
              className="absolute -inset-x-4 -inset-y-1 bg-white rounded-full shadow-lg -z-0"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </Link>
        <Link href="/" className="relative outline-none">
           <div className={`relative z-10 px-6 py-3 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${currentMode === 'explore' ? 'text-black' : 'text-white/70 hover:text-white'}`}>
             SCOUT
           </div>
           {currentMode === 'explore' && (
            <motion.div
              layoutId="nav-pill-bg-mobile"
              className="absolute inset-0 bg-white rounded-full shadow-lg -z-0"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </Link>
      </div>

      {/* Desktop Design (Original Single Pill) */}
      <div className="hidden md:flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl">
        <Link href="/dashboard" className="relative px-8 py-3 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] transition-colors duration-500 outline-none focus-visible:ring-1 focus-visible:ring-white/30 uppercase">
          {currentMode === 'dashboard' && (
            <motion.div
              layoutId="nav-pill-desktop"
              className="absolute inset-0 bg-white rounded-full shadow-lg"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className={`relative z-10 transition-colors duration-300 ${currentMode === 'dashboard' ? 'text-black' : 'text-neutral-400 hover:text-white'}`}>
            我的展览
          </span>
        </Link>
        <Link href="/" className="relative px-8 py-3 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] transition-colors duration-500 outline-none focus-visible:ring-1 focus-visible:ring-white/30 uppercase">
          {currentMode === 'explore' && (
            <motion.div
              layoutId="nav-pill-desktop"
              className="absolute inset-0 bg-white rounded-full shadow-lg"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
           <span className={`relative z-10 transition-colors duration-300 ${currentMode === 'explore' ? 'text-black' : 'text-neutral-400 hover:text-white'}`}>
            探索
          </span>
        </Link>
      </div>
    </div>
  );
}
