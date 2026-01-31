import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

interface VerticalProgressBarProps {
  containerRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export default function VerticalProgressBar({ containerRef, className = '' }: VerticalProgressBarProps) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
    layoutEffect: false
  });
  const [isVisible, setIsVisible] = useState(false);
  
  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map progress to percentage string for height/position
  // We use 0% to 100% for the top position
  const indicatorY = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    // Trigger entry animation
    setIsVisible(true);
  }, []);

  return (
    <motion.div 
      className={`fixed right-1 md:right-2 top-1/2 -translate-y-1/2 h-[50vh] md:h-[60vh] z-50 pointer-events-none flex flex-col items-center justify-between mix-blend-difference ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      {/* Frame Counter Top */}
      <div className="text-[9px] md:text-[10px] font-mono text-white/50 tracking-widest -rotate-90 origin-center translate-y-4">00</div>

      {/* Track Container */}
      <div className="relative flex-1 w-[6px] flex justify-center my-4">
        {/* The Track Line */}
        <div className="absolute inset-y-0 w-[2px] bg-white/20 rounded-full"></div>
        
        {/* Sprocket Pattern (Visual texture) */}
        {/* We place small dots along the track to simulate sprocket holes */}
        <div className="absolute inset-y-0 w-[1px] left-1/2 -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent_0%,transparent_50%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.5)_100%)] bg-[length:1px_4px] opacity-50" />

        {/* The Indicator */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 w-[3px] md:w-[4px] h-[24px] md:h-[32px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] rounded-sm"
          style={{ top: indicatorY, y: '-50%' }} 
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ 
            opacity: [0, 1, 0.8], 
            scaleY: [0, 1.5, 1] 
          }}
          transition={{ 
            duration: 1.5, 
            times: [0, 0.2, 1],
            ease: "easeOut",
            delay: 0.8
          }}
        />
      </div>

      {/* Frame Counter Bottom */}
      <div className="text-[9px] md:text-[10px] font-mono text-white/50 tracking-widest -rotate-90 origin-center -translate-y-4">36</div>
    </motion.div>
  );
}
