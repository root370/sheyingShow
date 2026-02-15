'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ExhibitionPoster from '@/components/ExhibitionPoster';
import MasonryGrid from '@/components/MasonryGrid';
import NavigationSwitch from '@/components/NavigationSwitch';
import HeroSection from '@/components/HeroSection';
import { Settings, Plus, ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useExhibitionCache } from '@/context/ExhibitionContext';
import TargetedApologyModal from '@/components/TargetedApologyModal';
import ResonanceLetter from '@/components/ResonanceLetter';
import GradientText from '@/components/GradientText/GradientText';
import TopPicksShowcase from './TopPicksShowcase';
import ExhibitionSkeleton from '@/components/ExhibitionSkeleton';

interface LobbyProps {
  mode: 'dashboard' | 'explore';
}

export default function Lobby({ mode }: LobbyProps) {
  const router = useRouter();
  const { dashboardCache, exploreCache, setDashboardCache, setExploreCache } = useExhibitionCache();
  
  // Initialize with empty to avoid hydration mismatch
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [initialTopPicks, setInitialTopPicks] = useState<any[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [userProfile, setUserProfile] = useState<{username: string, essence: string} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  // Resonance Letter State
  const [showLetter, setShowLetter] = useState(false);
  const [letterComments, setLetterComments] = useState<any[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCloseLetter = async () => {
      setShowLetter(false);
      
      // Mark as read
      const ids = letterComments.map(c => c.id);
      if (ids.length === 0) return;

      // Optimistic update: clear local comments immediately so it doesn't reappear
      setLetterComments([]); 

      try {
          // Use RPC function to bypass RLS for updating guestbook entries
          const { error } = await supabase
            .rpc('mark_guestbook_as_read', { entry_ids: ids });
          
          if (error) console.error("Failed to mark comments as read via RPC", error);
      } catch (err) {
          console.error("Error updating read status", err);
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMessage('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newUsername) {
        const { error } = await supabase
          .from('profiles')
          .update({ username: newUsername })
          .eq('id', user.id);
        
        if (error) throw error;
        
        setUserProfile(prev => prev ? { ...prev, username: newUsername } : null);
      }

      if (newPassword) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
      }

      setUpdateMessage('Profile updated successfully');
      setTimeout(() => {
        setShowSettings(false);
        setUpdateMessage('');
        setNewUsername('');
        setNewPassword('');
      }, 1500);
    } catch (error: any) {
      setUpdateMessage(`错误：${error.message}`);
    }
  };

  const handleDeleteExhibition = (deletedId: string) => {
      const updated = exhibitions.filter(e => e.id !== deletedId);
      setExhibitions(updated);
      
      // Update cache as well - Sync BOTH caches to ensure consistency
      if (dashboardCache) {
          const updatedDash = dashboardCache.exhibitions.filter(e => e.id !== deletedId);
          setDashboardCache(updatedDash);
      }
      if (exploreCache) {
          const updatedExplore = exploreCache.exhibitions.filter(e => e.id !== deletedId);
          setExploreCache(updatedExplore);
      }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(!!user);
        } catch (error) {
            console.error("Login check failed", error);
        }
    }
    // Listen for auth state changes (e.g. login in another tab or redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setIsLoggedIn(!!session?.user);
        if (event === 'SIGNED_OUT') {
            setIsLoggedIn(false);
            if (mode === 'dashboard') router.replace('/login');
        }
    });
    
    checkLogin();

    return () => {
        subscription.unsubscribe();
    };
  }, [mode, router]);

  useEffect(() => {
    async function fetchData() {
      const transformExhibitions = (rawList: any[], type: 'own' | 'collected' | 'public') => {
        return rawList
        .filter((ex: any) => ex.cover_url && ex.cover_url.length > 0) // Filter out exhibitions with no cover
        .map((ex: any) => {
            // Calculate has_picks from photos array
            const totalPicks = ex.photos?.reduce((acc: number, p: any) => acc + (p.picks_count || 0), 0) || 0;
            const hasPicks = totalPicks > 0;

            // Calculate total comments (Guestbook + Photo Annotations)
            const guestbookCount = ex.guestbook_entries?.[0]?.count || 0;
            const photosCommentCount = ex.photos?.reduce((acc: number, p: any) => {
                return acc + (p.annotations?.[0]?.count || 0);
            }, 0) || 0;

            return {
               id: ex.id,
               title: ex.title,
               description: ex.description,
               year: new Date(ex.created_at).getFullYear().toString(),
               // Ensure we use the DB cover_url if present
               cover: ex.cover_url, 
               rotate: '0deg',
               offsetY: 0,
               borderRadius: "0px",
               photoCount: ex.photo_count || 0,
               username: ex.profiles?.username,
               type: type,
               created_at: ex.created_at,
               comments_count: guestbookCount + photosCommentCount,
               has_picks: hasPicks,
               total_picks: totalPicks
            };
       });
    };

      // Check if we have fresh cache
      // We restore cache usage to prevent loading delay when returning from details
      const currentCache = mode === 'dashboard' ? dashboardCache : exploreCache;
      
      if (currentCache) {
          setExhibitions(currentCache.exhibitions);
          setLoading(false);
      } else {
          setLoading(true);
      }
      
      // FIX: Always fetch user profile if mode is dashboard, regardless of exhibition cache.
      // This ensures 'Enter Darkroom' button and user info is always shown.
      let currentUserId = null;
      if (mode === 'dashboard') {
          try {
              // OPTIMIZATION: Use getSession first for speed (avoids network trip if valid)
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session?.user) {
                  currentUserId = session.user.id;
                  setUserProfile({
                      username: session.user.user_metadata?.username || 'Artist',
                      essence: session.user.user_metadata?.essence_of_photography || '"Photography is the story I fail to put into words."'
                  });
              } else {
                  // Fallback to getUser only if session is missing
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                      currentUserId = user.id;
                      setUserProfile({
                          username: user.user_metadata?.username || 'Artist',
                          essence: user.user_metadata?.essence_of_photography || '"Photography is the story I fail to put into words."'
                      });
                  } else {
                      router.replace('/login');
                      return;
                  }
              }
          } catch (e) {
              console.error("Error fetching user", e);
              router.replace('/login');
              return;
          }
      }

      // If we have cache, we still fetch in background to update (Stale-While-Revalidate)
      // Or just fetch if no cache.
      if (!currentCache) {
        try {
        let data: any[] = [];
        let collectedData: any[] = [];
        let error = null;

            if (mode === 'dashboard') {
                if (currentUserId) {
                    // 1. Fetch Own Exhibitions (Priority) - NOW INCLUDES picks_count
                    const { data: ownData, error: ownError } = await supabase
                        .from('exhibitions')
                        .select('id, title, description, created_at, cover_url, photo_count, status, user_id, profiles(username), guestbook_entries(count), photos(picks_count, annotations(count))')
                        .eq('user_id', currentUserId)
                        .order('created_at', { ascending: false });
                    
                    if (ownError) console.error("Error fetching own exhibitions:", ownError);

                    const formattedOwn = transformExhibitions(ownData || [], 'own');
                    
                    // Render immediately if we have no cache to show content ASAP
                    if (!currentCache) {
                        setExhibitions(formattedOwn);
                        setLoading(false); // <--- UNBLOCK UI IMMEDIATELY
                    }

                    // 2. Fetch Collections & Notifications (Background)
                    const [collectedResult, commentsResult] = await Promise.all([
                        supabase
                            .from('collections')
                            .select('exhibitions(id, title, description, created_at, cover_url, photo_count, status, user_id, profiles(username), guestbook_entries(count), photos(picks_count, annotations(count)))')
                            .eq('user_id', currentUserId)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('guestbook_entries')
                            .select('*, exhibitions!inner(user_id, title), profiles(username)')
                            .eq('exhibitions.user_id', currentUserId)
                            .eq('is_read', false)
                            .neq('user_id', currentUserId)
                            .order('created_at', { ascending: false })
                    ]);

                    // Process Collected
                    let formattedCollected: any[] = [];
                    if (collectedResult.data) {
                        const rawCollected = collectedResult.data.map((c: any) => c.exhibitions).filter(Boolean);
                        formattedCollected = transformExhibitions(rawCollected, 'collected');
                    }

                    // Merge and Update (might cause layout shift but ensures data completeness)
                    const ownIds = new Set(formattedOwn.map((e: any) => e.id));
                    const filteredCollected = formattedCollected.filter((e: any) => !ownIds.has(e.id));
                    
                    const merged = [...formattedOwn, ...filteredCollected].sort((a: any, b: any) => 
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    
                    setExhibitions(merged);
                    setDashboardCache(merged);

                    // Process Notifications
                    if (commentsResult.data && commentsResult.data.length > 0) {
                        setLetterComments(commentsResult.data);
                        setTimeout(() => setShowLetter(true), 1000);
                    }
                    
                    // If we rendered early, we are done. If we had cache, we just updated it.
                    // Ensure loading is false in all cases
                    setLoading(false);
                }
            } else {
                // EXPLORE MODE: Fetch Exhibitions AND Top Picks in Parallel
                const [exhibitionsResult, topPicksResult] = await Promise.all([
                    supabase
                        .from('exhibitions')
                        .select('*, profiles(username), guestbook_entries(count), photos(annotations(count))')
                        .eq('status', 'published')
                        .order('created_at', { ascending: false }),
                    fetch('/api/photos/top-picks').then(res => res.json()).catch(() => [])
                ]);

                data = exhibitionsResult.data || [];
                error = exhibitionsResult.error;
                
                if (Array.isArray(topPicksResult)) {
                    setInitialTopPicks(topPicksResult);
                }
            }

        if (error) {
            console.error('Error loading exhibitions:', error);
        } else if (mode === 'explore') {
            console.log('Raw Exhibitions Data:', data);
            const finalExhibitions = transformExhibitions(data, 'public');
            setExploreCache(finalExhibitions); // Update Cache
            setExhibitions(finalExhibitions);
        }
      } catch (err) {
        console.error('Unexpected error loading exhibitions:', err);
      } finally {
        setLoading(false);
      }
      } // End of if (!currentCache)
    }
    
    fetchData();
  }, [mode]);

  const isExplore = mode === 'explore';

  return (
    <main className="min-h-[100dvh] w-full bg-background text-white selection:bg-accent selection:text-black overflow-x-hidden flex flex-col">
      
      {/* Grain Overlay Removed (Moved to Global CSS) */}
      
      {/* Header / Nav */}
      <header className="fixed top-0 w-full z-50 px-6 pt-12 pb-6 md:px-8 md:py-8 flex justify-between items-start md:items-center mix-blend-difference text-white pointer-events-none">
        <div className="hidden md:flex flex-col pointer-events-auto">
             {/* Mobile Logo */}
             <div className="md:hidden flex flex-col items-center leading-none">
                <h1 className="font-sans text-2xl font-bold text-white mb-1 flex flex-col items-center gap-0.5">
                    <span>L</span>
                    <span>T</span>
                </h1>
             </div>
             {/* Desktop Logo */}
             <div className="hidden md:block">
                 <h1 className="leading-none">
                     <GradientText
                        colors={["#E5D0AC", "#FFFFFF", "#E5D0AC"]}
                        animationSpeed={6}
                        showBorder={false}
                        className="font-serif text-4xl font-bold tracking-[0.3em] uppercase"
                    >
                        L A T E N T
                    </GradientText>
                 </h1>
             </div>
             
             <span className="text-[10px] tracking-[0.3em] font-sans font-medium opacity-70 uppercase mt-2 md:mt-1 text-center md:text-left">
                DEVELOPING THE UNSEEN
            </span>
        </div>

        <div className="flex items-center gap-8 pointer-events-auto pt-2 md:pt-0 absolute top-8 right-6 md:static">
            {!isExplore && isLoggedIn && (
                <Link 
                    href="/editor" 
                    className="md:hidden flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-300"
                    aria-label="导入底片"
                >
                    <Plus size={24} strokeWidth={1} />
                    <span className="text-xs font-sans tracking-widest uppercase text-white">上传</span>
                </Link>
            )}
            {isLoggedIn ? (
                <>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                        aria-label="设置"
                    >
                        <Settings size={24} strokeWidth={1} />
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                        aria-label="登出"
                    >
                        <LogOut size={24} strokeWidth={1} />
                    </button>
                </>
            ) : (
                <Link 
                    href="/login" 
                    className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-300 font-sans text-sm tracking-[0.2em] uppercase"
                    aria-label="登录"
                >
                    进入暗房 <ArrowRight size={18} />
                </Link>
            )}
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-8 w-full max-w-md rounded-sm relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-serif text-2xl text-white mb-6 uppercase tracking-wider">设置</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-sans text-gray-400 uppercase tracking-widest mb-2">
                    新昵称
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder={userProfile?.username}
                    className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-sans text-gray-400 uppercase tracking-widest mb-2">
                    新密码
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="留空保持不变"
                    className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {updateMessage && (
                  <p className={`text-xs ${updateMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'} tracking-wide`}>
                    {updateMessage}
                  </p>
                )}

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-xs font-sans text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    保存更改
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NavigationSwitch currentMode={mode} />
      
      {/* Targeted Apology Modal */}
      {userProfile && <TargetedApologyModal currentUser={userProfile} />}

      {/* Resonance Letter */}
      <AnimatePresence>
        {showLetter && userProfile && (
            <ResonanceLetter 
                username={userProfile.username} 
                comments={letterComments} 
                onClose={handleCloseLetter} 
            />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 w-full mx-auto flex-1">
        
        <AnimatePresence mode="wait">
            <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Hero Section */}
                <HeroSection 
                    title={isExplore ? "探索未见之物" : userProfile?.username || "艺术家工作室"}
                    subtitle={isExplore ? "精选辑录" : "欢迎归来"}
                    userProfile={userProfile || undefined}
                />
                
                {/* Top Picks Showcase */}
                {isExplore && <TopPicksShowcase initialPicks={initialTopPicks} />}

                {/* Content Container */}
                <div className="relative z-10 pb-20 px-6 md:px-12 lg:px-24 max-w-[1920px] mx-auto">
                    
                    {/* Gallery Grid */}
                    <div className="space-y-0 md:space-y-12 mt-0 md:mt-8">
                            {!isExplore && (
                            <div className="hidden md:flex items-center justify-between">
                                {loading ? (
                                    <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
                                ) : (
                                    <h3 className="font-serif text-4xl text-white italic">精选作品</h3>
                                )}
                                <div className="h-[1px] flex-1 bg-white/5 mx-12" />
                            </div>
                            )}

                            {isExplore && (loading || exhibitions.length > 0) && (
                            <div className="mb-8 pl-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <h3 className="text-xl md:text-2xl font-serif font-bold tracking-[0.2em] text-white/90">
                                    LATEST EXHIBITIONS
                                </h3>
                                <p className="text-[10px] text-white/40 font-sans tracking-widest mt-2 uppercase">
                                    最新展览
                                </p>
                            </div>
                            )}
                        
                        {loading ? (
                            <MasonryGrid 
                                items={[1, 2, 3, 4, 5, 6, 7, 8]}
                                columns={{ default: 4, lg: 4, md: 3, sm: 2 }}
                                gap={isMobile ? 8 : 24}
                                renderItem={(item, index) => (
                                    <ExhibitionSkeleton key={index} />
                                )}
                            />
                        ) : exhibitions.length === 0 ? (
                                <div className="h-[40vh] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-sm bg-white/[0.02]">
                                <p className="text-neutral-600 font-sans text-xs tracking-[0.3em] mb-8 uppercase">暂无潜影。开始创作。</p>
                                {!isExplore && (
                                    <Link href="/editor" className="text-accent hover:text-white transition-colors flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                                        <Plus size={14} /> 上传底片
                                    </Link>
                                )}
                                </div>
                        ) : (
                            <MasonryGrid 
                                items={exhibitions}
                                columns={{ default: 4, lg: 4, md: 3, sm: 2 }}
                                gap={isMobile ? 8 : 24}
                                renderItem={(exhibition, index) => (
                                    <ExhibitionPoster 
                                        key={exhibition.id}  
                                        exhibition={exhibition} 
                                        index={index} 
                                        showAuthor={isExplore || exhibition.type === 'collected'}
                                        onDelete={handleDeleteExhibition}
                                        priority={index < 20}
                                    />
                                )}
                            />
                        )}
                    </div>
                </div>

            </motion.div>
        </AnimatePresence>
      </div>
      {/* Footer */}
      <footer className="w-full text-center py-8 z-40 flex flex-col items-center gap-1 relative">
        <p className="text-[10px] font-sans text-white/20 tracking-[0.2em] uppercase">
          LATENT © 2026. Slow Photography Protocol. (v2.0)
        </p>
        <a 
          href="https://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[10px] font-sans text-white/10 hover:text-white/30 tracking-[0.1em] pointer-events-auto transition-colors"
        >
          沪ICP备2026003431号-1
        </a>
      </footer>
    </main>
  );
}
