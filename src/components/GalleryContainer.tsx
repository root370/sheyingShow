'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import PhotoFrame from './PhotoFrame';
import { Photo } from '@/data/photos';
import { useInspectionMode } from '@/hooks/useInspectionMode';
import { Grid, X, Send, MessageSquare, ChevronsDown } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import LoginModal from './LoginModal';
import VerticalProgressBar from './VerticalProgressBar';

const LightRays = dynamic(() => import('./LightRays'), { ssr: false });

interface GalleryContainerProps {
  photos: Photo[];
  exhibitionId: string;
  title?: string;
  description?: string;
  isAuthor?: boolean;
}

export default function GalleryContainer({ photos, exhibitionId, title, description, isAuthor: initialIsAuthor = false }: GalleryContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Physics State
  const x = useMotionValue(0); // The value used for rendering
  const skewX = useMotionValue(0);
  const targetX = useRef(0);   // The goal value
  const currentX = useRef(0);  // The current value in the loop
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  
  // Interaction State
  const [activeIndex, setActiveIndex] = useState(0);
  const [showIndex, setShowIndex] = useState(false);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<Photo | null>(null);

  // Guestbook State
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isSent, setIsSent] = useState(false); // Track success state for animation

  const [isAuthor, setIsAuthor] = useState(initialIsAuthor);
  const [isMobile, setIsMobile] = useState(false);

  // State for Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mobile Interaction Reset Logic
  useEffect(() => {
    // When active index changes, reset mobile inspection mode to keep it clean
    if (isMobile && !isAuthor) {
        setMobileInteractionMode('none');
    }
  }, [activeIndex, isMobile, isAuthor]);

  // Inspection Mode
  // const isInspectingKey = useInspectionMode(); // Removed Spacebar listener
  const [isInspectingDesktop, setIsInspectingDesktop] = useState(false);
  const [mobileInteractionMode, setMobileInteractionMode] = useState<'none' | 'view' | 'add'>('none');
  
  // Combine logic: 
  // Mobile: mobileInteractionMode
  // Desktop: isInspectingDesktop -> 'mixed' (Legacy support for desktop until refactor)
  const interactionMode = isMobile ? mobileInteractionMode : (isInspectingDesktop ? 'mixed' : 'none');
  
  // Spotlight Colors (Preface is index 0)
  const activeColor = activeIndex === 0 ? '#050505' : photos[activeIndex - 1]?.color || '#050505';

  // Calculate bounds and item positions
  const [itemPositions, setItemPositions] = useState<number[]>([]);

  // Track developed status for each photo
  const [developedPhotoIds, setDevelopedPhotoIds] = useState<string[]>([]);
  
  const handlePhotoDevelop = React.useCallback((photoId: string) => {
      setDevelopedPhotoIds(prev => {
          if (prev.includes(photoId)) return prev;
          return [...prev, photoId];
      });
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const handleToggleDesktopInspect = () => {
      // Auth Check
      if (!isAuthor && !isInspectingDesktop) { // Use isAuthor for quick check, or better, check currentUserId if you have it in context, 
          // But wait, we need to check if they are logged in AT ALL, not just if they are the author.
          // We can check supabase user again or use a state if we stored it.
          // Let's use supabase directly here for safety or add a user state.
          // Since checkAuthor runs on load, let's add a `isLoggedIn` state for clearer logic.
      }
      // Actually, we can just check supabase session synchronously-ish or trust the checkAuthor result if we expand it.
      // Let's assume we want to block VISITORS.
      // We can check if `isAuthor` is true -> they are logged in (and owner).
      // But regular logged-in users (non-owners) should also be allowed?
      // "Goal: When a visitor (not logged in) tries to comment..."
      
      // Let's check session on click to be safe and simple
      supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) {
              setShowLoginModal(true);
          } else {
             // Proceed
              const newState = !isInspectingDesktop;
              setIsInspectingDesktop(newState);
              
              if (isAuthor) {
                  setToastMessage(newState ? "评论已显示" : "评论已隐藏");
              } else {
                  // Visitor (Logged In)
                  if (newState) {
                      setToastMessage("点击图片任意位置留言。");
                  } else {
                      setToastMessage(null);
                  }
              }
              
              // Auto hide toast
              setTimeout(() => setToastMessage(null), 3000);
          }
      });
  };
  
  // Mobile: Toggle Comment Mode
  const handleMobileModeChange = (mode: 'none' | 'view' | 'add') => {
      supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user && mode !== 'none') {
              setShowLoginModal(true);
          } else {
              setMobileInteractionMode(mode);
              
              if (mode === 'add') {
                  setToastMessage("点击图片空白处留言");
              } else if (mode === 'view') {
                  setToastMessage(isAuthor ? "评论已显示" : "查看评论模式");
              } else {
                  setToastMessage(null);
              }
              setTimeout(() => setToastMessage(null), 3000);
          }
      });
  };

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if current user is the author
  useEffect(() => {
    if (initialIsAuthor) return; // Already confirmed by server (if it worked)
    
    async function checkAuthor() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: ex } = await supabase
        .from('exhibitions')
        .select('user_id')
        .eq('id', exhibitionId)
        .single();
        
      if (ex && ex.user_id === user.id) {
          setIsAuthor(true);
          // Owner View: Initial State showComments = true
          if (isMobile) setMobileInteractionMode('view');
          else setIsInspectingDesktop(true); // Desktop Owner Default
      }
    }
    checkAuthor();
  }, [exhibitionId, initialIsAuthor, isMobile]);

  // Calculate Layout on Resize or Data Change
  const calculateLayout = React.useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    const items = Array.from(contentRef.current.children || []) as HTMLElement[];
    const positions = items.map(item => item.offsetLeft + item.offsetWidth / 2);
    setItemPositions(positions);
  }, [photos, guestbookEntries]);

  // Recalculate on window resize
  useEffect(() => {
    window.addEventListener('resize', calculateLayout);
    // Initial calculation with delay to allow images/dom to settle
    const t = setTimeout(calculateLayout, 200);
    return () => {
        window.removeEventListener('resize', calculateLayout);
        clearTimeout(t);
    }
  }, [calculateLayout]);

  // Re-calculate when inspection mode changes (because layout size changes)
  useEffect(() => {
    // Wait for CSS transition
    const t = setTimeout(calculateLayout, 600);
    return () => clearTimeout(t);
  }, [interactionMode, calculateLayout]);

  // Fetch Guestbook Entries
  useEffect(() => {
    async function fetchGuestbook() {
        try {
            const { data } = await supabase
                .from('guestbook_entries')
                .select('*, profiles(username)')
                .eq('exhibition_id', exhibitionId)
                .order('created_at', { ascending: false });
            
            if (data) setGuestbookEntries(data);
        } catch (error) {
            console.warn("Guestbook fetch failed", error);
        }
    }
    fetchGuestbook();
  }, [exhibitionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || sending) return;

      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
          setToastMessage("请先登录");
          setTimeout(() => setToastMessage(null), 3000);
          setSending(false);
          return;
      }

      // 检查是否已经存在 profiles 记录
      let { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // 如果不存在，尝试创建（虽然注册时应该已经创建，但这是一个保险措施）
      if (!profile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: user.id, username: user.email?.split('@')[0] || 'User' });
          
          if (profileError) {
              console.error("Failed to create profile on fly", profileError);
              // 如果无法创建 profile，可能无法插入 guestbook (因为外键约束)
              // 但我们还是尝试一下，如果 guestbook_entries 引用的是 auth.users 则没问题
              // 如果引用的是 public.profiles，则会失败
          }
      }

      const { error } = await supabase
        .from('guestbook_entries')
        .insert({
            exhibition_id: exhibitionId,
            user_id: user.id,
            message: newMessage
        });
      
      if (!error) {
          setNewMessage('');
          setIsSent(true); // Trigger animation
          
          // Play sound
          const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play failed", e));

          setTimeout(() => setIsSent(false), 2000); // Reset after 2s

          // Refresh list
          const { data } = await supabase
            .from('guestbook_entries')
            .select('*, profiles(username)') // Make sure to select profile info
            .eq('exhibition_id', exhibitionId)
            .order('created_at', { ascending: false });
          if (data) setGuestbookEntries(data);
      } else {
          console.error("Failed to send message", error);
          alert("发送失败，请重试。");
      }
      setSending(false);
  };

  // Removed old calculateLayout useEffect to avoid duplication
  // The layout logic is now handled by the new useCallback hooks above

  // The Physics Loop (Lerp)
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (isMobile) return;

      // Lerp formula: current = current + (target - current) * factor
      const diff = targetX.current - currentX.current;
      
      // Stop loop if close enough and not scrolling
      if (Math.abs(diff) < 0.1 && !isScrolling.current) {
         currentX.current = targetX.current;
         x.set(targetX.current);
         skewX.set(0);
      } else {
         // Stronger snap force when not scrolling (Magnet Effect)
         const factor = isScrolling.current ? 0.08 : 0.15;
         currentX.current += diff * factor;
         x.set(currentX.current);
         
         // Calculate velocity-based skew
         // Clamp skew to avoid extreme distortion
         const skewStrength = 0.15; // Increased strength
         const maxSkew = 20; // Increased max skew
         const currentSkew = Math.max(Math.min(diff * skewStrength, maxSkew), -maxSkew);
         skewX.set(currentSkew);
      }
      
      // Update active index based on current position
      if (itemPositions.length > 0 && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        let bestIndex = 0;
        let minDiff = Infinity;
        
        itemPositions.forEach((pos, index) => {
          const screenCenter = pos + currentX.current;
          const dist = Math.abs(screenCenter - (containerWidth / 2));
          if (dist < minDiff) {
            minDiff = dist;
            bestIndex = index;
          }
        });
        
        if (bestIndex !== activeIndex) {
          setActiveIndex(bestIndex);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [itemPositions, x, activeIndex, skewX]);


  const snapToElement = (index: number) => {
    if (!contentRef.current || !containerRef.current) return;
    const items = Array.from(contentRef.current.children) as HTMLElement[];
    const item = items[index];
    if (!item) return;

    const containerWidth = containerRef.current.offsetWidth;
    const snapTarget = (containerWidth / 2) - (item.offsetLeft + item.offsetWidth / 2);
    targetX.current = snapTarget;
    // setActiveIndex(index); // Active index is updated in loop based on position
  };

  // Mouse Wheel Handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (showIndex) return; // Disable scroll when index is open
      e.preventDefault();
      
      isScrolling.current = true;
      
      const isTrackpad = Math.abs(e.deltaY) < 50 && Math.abs(e.deltaX) < 50;
      
      // Accumulate velocity
      // Note: e.deltaY > 0 means scrolling down/right (negative X movement)
      const delta = e.deltaY + e.deltaX;
      
      // Simply move targetX during scroll for responsiveness
      // But we will override it on snap
      // REDUCED SENSITIVITY: 2.5/1.5 -> 1.2/0.8
      targetX.current -= delta * (isTrackpad ? 1.2 : 0.8);
      
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      
      // Smart Slotting Logic on Scroll End
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        
        if (!containerRef.current || !contentRef.current) return;
        
        const containerWidth = containerRef.current.offsetWidth;
        const items = Array.from(contentRef.current.children) as HTMLElement[];
        
        // Find the index closest to the *Projected* landing spot
        let bestIndex = 0;
        let minDiff = Infinity;
        
        // We use targetX as the reference for where the user "left" the scroll
        const finalX = targetX.current;
        
        items.forEach((item, index) => {
          // Calculate center using FRESH DOM READINGS
          const itemCenter = item.offsetLeft + item.offsetWidth / 2;
          const screenCenter = itemCenter + finalX;
          const dist = Math.abs(screenCenter - (containerWidth / 2));
          if (dist < minDiff) {
            minDiff = dist;
            bestIndex = index;
          }
        });

        // Directional Logic:
        // If the user swiped significantly in one direction, 
        // we might want to favor the Next/Prev item even if we haven't crossed the midpoint.
        // For now, let's trust the "Projected Landing" which includes the accumulated delta.
        // If delta was large, targetX pushed us towards the next item.
        
        // Force Snap to the fresh DOM position
        snapToElement(bestIndex);
        
        // INCREASED DEBOUNCE: 150ms -> 250ms to allow longer, smoother swipes before locking
      }, 250); 
    };

    const container = containerRef.current;
    if (container && !isMobile) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [showIndex, isMobile]);

  const jumpToPhoto = (photoIndex: number) => {
    // photoIndex is 0-based index in photos array
    // itemIndex in DOM is photoIndex + 1 (because of Preface)
    const targetIndex = photoIndex + 1;
    snapToElement(targetIndex);
    isScrolling.current = false;
    setShowIndex(false);
  };

  const handleScroll = () => {
    if (!isMobile || !containerRef.current || !contentRef.current) return;
    
    // Auto-close comment mode on scroll (for visitors)
    if (mobileInteractionMode !== 'none' && !isAuthor) {
        setMobileInteractionMode('none');
    }

    const container = containerRef.current;
    const scrollPos = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Simple Index Calculation for full-height snapping items
    const index = Math.round(scrollPos / containerHeight);
    
    if (index !== activeIndex) {
        setActiveIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-screen bg-[#050505] ${isMobile ? 'overflow-y-scroll snap-y snap-mandatory scroll-smooth' : 'overflow-hidden flex flex-col justify-center'}`}
      onScroll={isMobile ? handleScroll : undefined}
    >
      {/* Atmosphere: Spotlight & Noise */}
      <div 
        className="absolute inset-0 pointer-events-none fixed"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #2a2a2a 0%, #000000 70%)'
        }}
      >
        {/* Light Rays Effect - Increased opacity for visibility */}
        <div className="absolute inset-0 opacity-100 mix-blend-screen z-0">
           <LightRays 
             raysOrigin="top-center" 
             raysColor="#ffffff" 
             raysSpeed={1} 
             lightSpread={0.5} 
             rayLength={3} 
             followMouse={!isMobile} 
             mouseInfluence={0.1} 
             noiseAmount={0} 
             distortion={0} 
             className="custom-rays" 
             pulsating={false} 
             fadeDistance={1} 
             saturation={1} 
         /> 
        </div>

        {/* Noise Texture */}
        <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
        />
      </div>
      
      {/* Content Container */}
      <motion.div 
        ref={contentRef}
        style={isMobile ? {} : { x, skewX }}
        className={isMobile ? 'w-full' : 'flex items-center gap-16'}
      >
        {/* Preface Section (Index 0) */}
        <div className={`flex flex-col justify-center items-center text-center relative ${isMobile ? 'h-[90vh] min-h-[calc(100vh-80px)] w-full snap-start border-b border-white/5' : 'shrink-0 w-screen h-screen'}`}>
            <div className="max-w-2xl text-center px-6">
                <h1 className="font-serif text-6xl md:text-8xl text-white mb-8 tracking-tighter uppercase">{title || "THE UNSEEN"}</h1>
                <p className="font-sans text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
                    {description || "A journey through the spaces between moments. This exhibition explores the silence that lingers after the shutter clicks, revealing the unseen textures of memory and light."}
                </p>
                {isMobile && (
                    <div 
                        onClick={() => {
                            if (contentRef.current && contentRef.current.children.length > 1) {
                                contentRef.current.children[1].scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-pulse cursor-pointer pointer-events-auto active:scale-95 transition-transform"
                    >
                         <span className="text-[10px] tracking-[0.6em] uppercase text-white/70 font-serif font-light">
                            向下探索
                         </span>
                         <ChevronsDown className="text-white/80 animate-bounce" size={28} strokeWidth={1.5} />
                    </div>
                )}
            </div>
        </div>

        {/* Photos (Index 1+) */}
        {photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className={isMobile ? 'h-[90vh] min-h-[calc(100vh-80px)] w-full snap-start flex flex-col justify-center bg-black py-20 border-b border-white/5' : 'shrink-0 relative'}
            onClick={() => {
                if (isMobile && !isAuthor && mobileInteractionMode !== 'none') {
                    setMobileInteractionMode('none');
                }
            }}
          >
            <PhotoFrame 
              id={photo.id}
              src={photo.src}
              alt={photo.alt}
              caption={photo.caption}
              title={photo.title}
              year={photo.year}
              aspectRatio={photo.aspectRatio}
              annotations={photo.annotations}
              interactionMode={interactionMode}
              skipDeveloping={isAuthor}
              exif={photo.exif}
              isMobile={isMobile}
              isOwner={isAuthor}
              onDevelop={handlePhotoDevelop}
              onExpand={() => setFullScreenPhoto(photo)}
              priority={index < 2}
              isActive={activeIndex === index + 1}
              onNext={() => {
                  if (isMobile && !isAuthor) {
                      setMobileInteractionMode('none');
                  }
                  if (index === photos.length - 1) {
                      // Last Photo -> Scroll to Guestbook
                      const guestbookElement = contentRef.current?.children[index + 2];
                      guestbookElement?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                      // Next Photo
                      const nextElement = contentRef.current?.children[index + 2]; // +1 for Preface, +1 for Next
                      nextElement?.scrollIntoView({ behavior: 'smooth' });
                  }
              }}
              onModeChange={handleMobileModeChange}
              isLast={index === photos.length - 1}
            />
          </div>
        ))}

        {/* Guestbook Slide (Final) */}
        <div className={`flex flex-col justify-center items-center relative p-8 ${isMobile ? 'h-screen w-full snap-start' : 'shrink-0 w-screen h-screen'}`}>
            <div className="max-w-2xl w-full flex flex-col items-center">
                <h2 className="font-serif text-4xl text-white mb-8 text-center tracking-widest uppercase">留言</h2>
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="mb-12 relative w-full">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="写下此刻的感受..."
                        className="w-full bg-transparent border-b border-white/20 py-4 px-2 text-xl font-serif text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors pr-12"
                    />
                    <button 
                        type="submit"
                        disabled={sending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors disabled:opacity-30"
                    >
                        <motion.div
                            animate={isSent ? { 
                                x: [0, 100, -100, 0], 
                                opacity: [1, 0, 0, 1],
                                scale: [1, 0.5, 0.5, 1]
                            } : {}}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            <Send size={20} className={isSent ? "text-green-400" : ""} />
                        </motion.div>
                    </button>
                </form>

                {/* Messages Display */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar mb-8">
                    {guestbookEntries.map((entry) => (
                        <div key={entry.id} className="bg-white/5 p-4 rounded-sm border border-white/10 relative group hover:border-white/30 transition-colors">
                            <p className="font-['Caveat',_cursive] text-2xl text-gray-200 leading-relaxed">
                                "{entry.message}"
                            </p>
                            <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-2">
                                <span className="text-[10px] font-sans text-gray-500 uppercase tracking-wider">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] font-sans text-gray-400 uppercase tracking-wider">
                                    {entry.profiles?.username || 'Visitor'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {guestbookEntries.length === 0 && (
                        <div className="col-span-full text-center text-white/20 font-serif italic">
                            暂无留言...
                        </div>
                    )}
                </div>

                {/* Back to Top Button */}
                {isMobile && (
                    <button
                        onClick={() => {
                            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex flex-col items-center gap-2 text-white/30 hover:text-white/80 transition-colors group animate-pulse"
                    >
                        <div className="p-3 border border-white/10 rounded-full group-hover:border-white/50 transition-colors">
                             <ChevronsDown size={20} className="rotate-180" />
                        </div>
                        <span className="text-[10px] tracking-[0.2em] uppercase font-serif">回到顶部</span>
                    </button>
                )}
            </div>
        </div>
      </motion.div>
      
      {/* Mobile Logo - Hidden as requested */}
      
      {/* Desktop Controls */}
      {!isMobile && (
        <>
            {/* Desktop Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10"
                    >
                        <p className="text-white text-xs font-serif tracking-[0.2em] uppercase">
                            {toastMessage}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Comment Toggle - Only show when viewing photos */}
            {(() => {
                 const isViewingPhoto = activeIndex > 0 && activeIndex <= photos.length;
                 const currentPhoto = photos[activeIndex - 1];
                 const isDeveloped = currentPhoto && developedPhotoIds.includes(currentPhoto.id);

                 if (isViewingPhoto && (isAuthor || isDeveloped)) {
                     return (
                        <div className="fixed bottom-8 right-24 z-40 group flex flex-col items-center">
                             <button 
                                 onClick={handleToggleDesktopInspect}
                                 className={`p-4 rounded-full backdrop-blur-md border transition-all hover:scale-110 active:scale-95 shadow-lg relative z-10 ${
                                     isInspectingDesktop
                                     ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                     : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                                 }`}
                             >
                                 <MessageSquare size={24} fill={isInspectingDesktop ? "currentColor" : "none"} strokeWidth={1.5} />
                             </button>
                             
                             {/* Desktop Tooltip (Bottom) */}
                             <div className="absolute top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10 whitespace-nowrap z-20">
                                 <p className="text-[10px] font-sans tracking-widest uppercase text-white">
                                     {isInspectingDesktop ? "收起所有评论" : "点击查看评论"}
                                 </p>
                             </div>
                        </div>
                     );
                 }
                 return null;
            })()}

            {/* Index Button */}
            <button 
                onClick={() => setShowIndex(true)}
                className="fixed bottom-8 right-8 z-40 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
            >
                <Grid size={24} strokeWidth={1.5} />
            </button>

            {/* Index Modal */}
            <AnimatePresence>
                {showIndex && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-xl overflow-y-auto"
                >
                    <div className="p-8 min-h-screen">
                        <div className="flex justify-end mb-8">
                        <button 
                            onClick={() => setShowIndex(false)}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X size={32} strokeWidth={1} />
                        </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
                        {photos.map((photo, idx) => (
                            <div 
                            key={photo.id}
                            onClick={() => jumpToPhoto(idx)}
                            className="aspect-square relative cursor-pointer group overflow-hidden bg-gray-900"
                            >
                            <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="bg-black/50 text-white px-3 py-1 text-xs font-serif uppercase tracking-widest backdrop-blur-sm">查看</span>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
            
            {/* Progress / Indicator */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                {/* Simple dot for Preface */}
                <div className={`h-1 rounded-full transition-all duration-300 ${activeIndex === 0 ? 'w-8 bg-white' : 'w-2 bg-gray-700'}`} />
                
                {photos.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${idx + 1 === activeIndex ? 'w-8 bg-white' : 'w-2 bg-gray-700'}`}
                />
                ))}
            </div>
        </>
      )}
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Mobile Scroll Affordance */}
      {isMobile && <VerticalProgressBar containerRef={containerRef} />}

      {/* Full Screen Lightbox */}
      <AnimatePresence>
        {fullScreenPhoto && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                onClick={() => setFullScreenPhoto(null)}
            >
                <button 
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[101]"
                    onClick={() => setFullScreenPhoto(null)}
                >
                    <X size={32} strokeWidth={1} />
                </button>
                
                <div 
                    className="relative w-full h-full flex items-center justify-center pointer-events-none"
                >
                    <img 
                        src={fullScreenPhoto.src} 
                        alt={fullScreenPhoto.alt}
                        className="max-w-full max-h-full object-contain shadow-2xl pointer-events-auto select-none"
                        draggable={false}
                        onClick={(e) => e.stopPropagation()} 
                    />
                     {fullScreenPhoto.title && (
                         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 pointer-events-auto">
                             <p className="text-white text-sm font-serif tracking-widest uppercase">
                                 {fullScreenPhoto.title}
                             </p>
                         </div>
                     )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
