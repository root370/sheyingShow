'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function BackgroundAmbience() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Static Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-surface via-[#050505] to-transparent opacity-80" />
      
      {/* Animated Blobs - Optimized with will-change */}
      <motion.div 
        initial={{ opacity: 0.5, scale: 1, rotate: 0 }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
          rotate: [0, 45, 0]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        style={{ willChange: 'transform, opacity' }}
        className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-accent/10 blur-[120px] rounded-full mix-blend-screen" 
      />
      
      <motion.div 
        initial={{ opacity: 0.3, scale: 1, x: 0 }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0]
        }}
        transition={{ 
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{ willChange: 'transform, opacity' }}
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" 
      />
      
      <motion.div
         initial={{ opacity: 0.1, scale: 1 }}
         animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
         }}
         transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
         }}
         style={{ willChange: 'transform, opacity' }}
         className="absolute top-[20%] left-[30%] w-[30vw] h-[30vh] bg-purple-500/5 blur-[100px] rounded-full mix-blend-screen"
      />
    </div>
  );
}
