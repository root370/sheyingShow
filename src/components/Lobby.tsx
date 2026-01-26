'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ExhibitionPoster from '@/components/ExhibitionPoster';
import NavigationSwitch from '@/components/NavigationSwitch';
import HeroSection from '@/components/HeroSection';
import { Settings, Plus, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useExhibitionCache } from '@/context/ExhibitionContext';

interface LobbyProps {
  mode: 'dashboard' | 'explore';
}

export default function Lobby({ mode }: LobbyProps) {
  const router = useRouter();
  const { dashboardCache, exploreCache, setDashboardCache, setExploreCache } = useExhibitionCache();
  
  // Initialize with empty to avoid hydration mismatch
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<{username: string, essence: string} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
      setUpdateMessage(`Error: ${error.message}`);
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
    checkLogin();
  }, [mode]); // Re-check on mode switch just in case

  useEffect(() => {
    async function fetchData() {
      // Check if we have fresh cache (e.g. less than 1 minute old)
      // We restore cache usage now that we have proper sync on delete
      const currentCache = mode === 'dashboard' ? dashboardCache : exploreCache;
      // const currentCache = null; // Force refresh disabled, using smart cache
      
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
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  currentUserId = user.id;
                  setUserProfile({
                      username: user.user_metadata?.username || 'Artist',
                      essence: user.user_metadata?.essence_of_photography || '"Photography is the story I fail to put into words."'
                  });
              } else {
                  // If dashboard and no user, redirect
                  router.replace('/login');
                  return;
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
        let data = [];
        let collectedData = [];
        let error = null;

        if (mode === 'dashboard') {
            if (currentUserId) {
                const result = await supabase
                    .from('exhibitions')
                    .select('*')
                    .eq('user_id', currentUserId)
                    .order('created_at', { ascending: false });
                data = result.data || [];
                error = result.error;

                const collectedResult = await supabase
                    .from('collections')
                    .select('exhibitions(*, profiles(username))')
                    .eq('user_id', currentUserId)
                    .order('created_at', { ascending: false });
                
                if (collectedResult.data) {
                    collectedData = collectedResult.data.map((c: any) => c.exhibitions).filter(Boolean);
                }
            }
        } else {
            const result = await supabase
                .from('exhibitions')
                .select('*, profiles(username)')
                .eq('status', 'published')
                .order('created_at', { ascending: false });
            data = result.data || [];
            error = result.error;
        }

        if (error) {
            console.error('Error loading exhibitions:', error);
        } else {
            console.log('Raw Exhibitions Data:', data);
            const transformExhibitions = (rawList: any[], type: 'own' | 'collected' | 'public') => {
                return rawList.map((ex: any) => {
                    console.log(`Exhibition ${ex.id} cover_url:`, ex.cover_url);
                    return {
                       id: ex.id,
                       title: ex.title,
                       description: ex.description,
                       year: new Date(ex.created_at).getFullYear().toString(),
                       // Ensure we use the DB cover_url if present
                       cover: ex.cover_url && ex.cover_url.length > 0 ? ex.cover_url : "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1988", 
                       rotate: '0deg',
                       offsetY: 0,
                       borderRadius: "0px",
                       photoCount: ex.photo_count || 0,
                       username: ex.profiles?.username,
                       type: type,
                       created_at: ex.created_at
                    };
               });
            };

            let finalData: any[] = [];

            if (mode === 'dashboard') {
                const finalOwn = transformExhibitions(data, 'own');
                const finalCollected = collectedData.length > 0 ? transformExhibitions(collectedData, 'collected') : [];
                
                const ownIds = new Set(finalOwn.map(e => e.id));
                const filteredCollected = finalCollected.filter(e => !ownIds.has(e.id));
                
                const merged = [...finalOwn, ...filteredCollected].sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                finalData = merged;
                setDashboardCache(merged); // Update Cache
            } else {
                const finalExhibitions = transformExhibitions(data, 'public');
                finalData = finalExhibitions;
                setExploreCache(finalExhibitions); // Update Cache
            }
            
            setExhibitions(finalData);
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
    <main className="min-h-[100dvh] w-full bg-background text-white selection:bg-accent selection:text-black overflow-x-hidden">
      
      {/* Grain Overlay Removed (Moved to Global CSS) */}
      
      {/* Header / Nav */}
      <header className="fixed top-0 w-full z-50 px-8 py-8 flex justify-between items-center mix-blend-difference text-white pointer-events-none">
        <div className="flex flex-col pointer-events-auto">
             <h1 className="font-serif text-3xl font-bold tracking-[0.3em] uppercase text-white leading-none">L A T E N T</h1>
             <span className="text-[8px] tracking-[0.5em] font-sans font-medium opacity-50 uppercase mt-1">DEVELOP THE UNSEEN</span>
        </div>

        <div className="flex items-center gap-8 pointer-events-auto">
            {isLoggedIn ? (
                <>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                        aria-label="Settings"
                    >
                        <Settings size={20} strokeWidth={1} />
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                        aria-label="Sign out"
                    >
                        <LogOut size={20} strokeWidth={1} />
                    </button>
                </>
            ) : (
                <Link 
                    href="/login" 
                    className="opacity-60 hover:opacity-100 transition-opacity duration-300 font-sans text-xs tracking-[0.2em] uppercase"
                    aria-label="Sign in"
                >
                    Sign In
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
              <h2 className="font-serif text-2xl text-white mb-6 uppercase tracking-wider">Settings</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-sans text-gray-400 uppercase tracking-widest mb-2">
                    New Username
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
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NavigationSwitch currentMode={mode} />

      {/* Content */}
      <div className="relative z-10 w-full mx-auto">
        
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.div 
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-screen flex items-center justify-center"
                >
                    <Loader2 className="animate-spin text-accent" size={40} strokeWidth={0.5} />
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Hero Section */}
                    <HeroSection 
                        title={isExplore ? "EXPLORE THE UNSEEN" : userProfile?.username || "ARTIST STUDIO"}
                        subtitle={isExplore ? "CURATED COLLECTION" : "WELCOME BACK"}
                        userProfile={userProfile || undefined}
                    />

                    {/* Content Container */}
                    <div className="relative z-10 pb-20 px-6 md:px-12 lg:px-24 max-w-[1920px] mx-auto">
                        
                        {/* Gallery Grid */}
                        <div className="space-y-20 mt-20">
                             {!isExplore && (
                                <div className="flex items-center justify-between">
                                    <h3 className="font-serif text-4xl text-white italic">Selected Works</h3>
                                    <div className="h-[1px] flex-1 bg-white/5 mx-12" />
                                </div>
                             )}
                            
                            {exhibitions.length === 0 ? (
                                 <div className="h-[40vh] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-sm bg-white/[0.02]">
                                    <p className="text-neutral-600 font-sans text-xs tracking-[0.3em] mb-8 uppercase">No latent images found. Start capturing.</p>
                                    {!isExplore && (
                                        <Link href="/editor" className="text-accent hover:text-white transition-colors flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                                            <Plus size={14} /> Import Negative
                                        </Link>
                                    )}
                                 </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                                    {exhibitions.map((exhibition, index) => (
                                        <ExhibitionPoster 
                                            key={exhibition.id}  
                                            exhibition={exhibition} 
                                            index={index} 
                                            showAuthor={isExplore || exhibition.type === 'collected'}
                                            onDelete={handleDeleteExhibition}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
      </div>
      {/* Footer */}
      <footer className="fixed bottom-4 left-0 w-full text-center pointer-events-none z-40">
        <p className="text-[10px] font-sans text-white/20 tracking-[0.2em] uppercase">
          LATENT © 2026. Slow Photography Protocol.
        </p>
      </footer>
    </main>
  );
}
