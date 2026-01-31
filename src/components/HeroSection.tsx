'use client';

import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import RiveAnimation from './RiveAnimation';
import { Fit, Alignment } from '@rive-app/react-canvas';
import { ArrowDown, Instagram, Twitter, Linkedin, Plus } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  userProfile?: { username: string; essence: string };
}

export default function HeroSection({ title, subtitle, userProfile }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 500], [0, 200]);
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const blurValue = useTransform(scrollY, [0, 300], [0, 10]);
  const textFilter = useMotionTemplate`blur(${blurValue}px)`;

  return (
    <div className="relative md:h-screen w-full overflow-hidden flex flex-col md:flex-row items-center justify-center pt-28 md:pt-0">
      
      {/* 1. Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                              linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />
      
      {/* 2. Central Rive Animation (The "Astronaut/Planet" equivalent) */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
            {/* 
               Rive Animation Container 
               - Desktop: Full screen, centered
               - Mobile: Positioned to fit without forcing full screen height
            */}
            <div className="w-full h-full md:block hidden">
                <RiveAnimation 
                    src="/rive/289-568-planets.riv"
                    fit={Fit.Contain}
                    alignment={Alignment.Center}
                />
            </div>
            
            {/* Mobile specific Rive container */}
            <div className="absolute top-0 left-0 w-full h-[60vh] md:hidden flex items-start justify-center pt-10 opacity-50">
                 <RiveAnimation 
                    src="/rive/289-568-planets.riv"
                    fit={Fit.Cover}
                    alignment={Alignment.Center}
                />
            </div>

            {/* Gradient Overlay - Reduced Height */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-1/4 bottom-0 top-auto z-0" />
      </div>

      {/* 3. Text Overlay */}
      <div className="relative z-10 w-full max-w-[1920px] px-8 md:px-24 flex flex-col justify-center h-auto md:h-full pointer-events-none  md:mb-0">
          
          <motion.div 
            className="mix-blend-difference space-y-2 relative"
            style={{ y: textY, opacity: textOpacity, filter: textFilter }}
          >
            {/* Mobile Layout (Decorative Blobs + 5-line Headline) */}
            <div className="md:hidden pt-8 pb-12">
                {/* Decorative Blobs */}
                <div className="absolute -top-20 -left-20 w-32 h-32 bg-gray-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 -right-10 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Curated Collection Label */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <div className="w-12 h-[1px] bg-accent/80" />
                    <span className="font-sans text-[10px] font-medium tracking-[0.4em] text-white/90 uppercase">
                        {subtitle}
                    </span>
                </motion.div>

                {/* Main Headline (Mobile) */}
                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="font-sans text-5xl font-black tracking-tighter leading-[1.1] max-w-5xl relative"
                >
                    <span className="block text-[#7f7f7f]">不止于捕捉</span>
                    <span className="block text-accent">重塑</span>
                    <span className="block text-white">影像 想象</span>
                </motion.h1>
                
                {/* Bottom Gray Blob */}
                <div className="absolute -bottom-10 right-0 w-24 h-24 bg-gray-500 rounded-full blur-sm opacity-80 pointer-events-none" />
            </div>

            {/* Desktop Layout (Original 3-line Headline) */}
            <div className="hidden md:block">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-sans text-sm font-bold tracking-[0.4em] text-neutral-400 uppercase mb-4 flex items-center gap-4"
                >
                    <span className="w-12 h-[1px] bg-accent"></span>
                    {subtitle}
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="font-sans text-7xl lg:text-9xl font-black tracking-tighter text-white leading-[1.1] max-w-5xl"
                >
                    <span className="block text-neutral-600">不止于捕捉</span>
                    <span className="block text-accent">重塑</span>
                    <span className="block">影像想象</span>
                </motion.h1>
            </div>

            {userProfile && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 md:mt-12 max-w-xl"
                >
                    <p className="font-serif text-xl md:text-2xl text-neutral-400 italic leading-relaxed">
                        "{userProfile.essence}"
                    </p>
                    <p className="mt-4 font-sans text-xs tracking-[0.2em] text-accent uppercase">
                        — {userProfile.username}
                    </p>

                    {/* New Exhibition Button (Darkroom Import Style) */}
                    <div className="mt-12 pointer-events-auto hidden md:block">
                        <Link 
                            href="/editor"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-neutral-200 transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105"
                        >
                            <Plus size={18} className="text-black transition-colors" />
                            <span className="font-sans text-sm font-bold tracking-[0.2em] uppercase">进入暗房</span>
                        </Link>
                    </div>
                </motion.div>
            )}
          </motion.div>
      </div>

      {/* 4. Vertical Side Elements */}
      {/* Left: Socials */}
      <div className="absolute left-8 bottom-12 hidden md:flex flex-col gap-8 z-20 mix-blend-difference text-white">
          <div className="flex flex-col gap-6 items-center">
             <LinkWrapper href="#"><Instagram size={16} /></LinkWrapper>
             <LinkWrapper href="#"><Twitter size={16} /></LinkWrapper>
             <LinkWrapper href="#"><Linkedin size={16} /></LinkWrapper>
          </div>
          <div className="h-24 w-[1px] bg-white/20 mx-auto" />
          <div className="writing-vertical-rl rotate-180 text-[10px] font-sans tracking-[0.3em] opacity-50 uppercase">
              连接
          </div>
      </div>

      {/* Right: Scroll Indicator */}
      <div className="absolute right-8 bottom-12 hidden md:flex flex-col gap-8 z-20 mix-blend-difference text-white items-center">
           <div className="writing-vertical-rl text-[10px] font-sans tracking-[0.3em] opacity-50 uppercase">
              滑动探索
          </div>
          <div className="h-24 w-[1px] bg-white/20" />
          <motion.div
             animate={{ y: [0, 5, 0] }}
             transition={{ duration: 2, repeat: Infinity }}
          >
              <ArrowDown size={16} className="text-accent" />
          </motion.div>
      </div>

    </div>
  );
}

const LinkWrapper = ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href} className="hover:text-accent transition-colors duration-300">
        {children}
    </a>
);
