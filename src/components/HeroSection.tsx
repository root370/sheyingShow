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
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      
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
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
            <RiveAnimation 
                src="/rive/289-568-planets.riv"
                fit={Fit.Contain}
                alignment={Alignment.Center}
            />
            {/* Gradient Overlay to fade the bottom of the 3D element */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* 3. Text Overlay */}
      <div className="relative z-10 w-full max-w-[1920px] px-8 md:px-24 flex flex-col justify-center h-full pointer-events-none">
          
          <motion.div 
            className="mix-blend-difference space-y-2"
            style={{ y: textY, opacity: textOpacity, filter: textFilter }}
          >
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-sans text-xs md:text-sm font-bold tracking-[0.4em] text-neutral-400 uppercase mb-4 flex items-center gap-4"
            >
                <span className="w-12 h-[1px] bg-accent"></span>
                {subtitle}
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-sans text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white leading-[0.9] md:leading-[0.85] max-w-5xl"
            >
                <span className="block text-neutral-600">WE DON'T JUST</span>
                <span className="block text-accent">CAPTURE</span>
                <span className="block">WE REIMAGINE</span>
            </motion.h1>

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
                    <div className="mt-12 pointer-events-auto">
                        <Link 
                            href="/editor"
                            className="group inline-flex items-center gap-3 px-6 py-3 border border-white/20 bg-white/5 hover:bg-white hover:text-black backdrop-blur-sm transition-all duration-300 rounded-sm"
                        >
                            <Plus size={16} className="text-accent group-hover:text-black transition-colors" />
                            <span className="font-sans text-xs font-bold tracking-[0.2em] uppercase">Enter Darkroom</span>
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
              Connect
          </div>
      </div>

      {/* Right: Scroll Indicator */}
      <div className="absolute right-8 bottom-12 hidden md:flex flex-col gap-8 z-20 mix-blend-difference text-white items-center">
           <div className="writing-vertical-rl text-[10px] font-sans tracking-[0.3em] opacity-50 uppercase">
              Scroll to Explore
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
