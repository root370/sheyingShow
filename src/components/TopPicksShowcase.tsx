import React, { useEffect, useState } from 'react';
import { Photo } from '@/data/photos';
import { useRouter } from 'next/router';
import { Gem } from 'lucide-react';
import { motion } from 'framer-motion';
export default function TopPicksShowcase({ initialPicks = [] }: { initialPicks?: Photo[] }) {
  const [topPicks, setTopPicks] = useState<Photo[]>(initialPicks);
  const router = useRouter();

  useEffect(() => {
    if (initialPicks.length > 0) {
        setTopPicks(initialPicks);
        return;
    }

    const controller = new AbortController();

    fetch('/api/photos/top-picks', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) {
              setTopPicks(data);
          }
      })
      .catch(err => {
          if (err.name !== 'AbortError') {
              console.error(err);
          }
      });

    return () => controller.abort();
  }, [initialPicks]);

  if (topPicks.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-6 mb-2 animate-in fade-in duration-700 slide-in-from-bottom-4">
        {/* Header Upgrade */}
        <div className="mb-4 pl-6 md:pl-1">
            <h2 className="text-xl md:text-2xl font-serif font-bold tracking-[0.2em] text-white flex items-center gap-3">
                <Gem size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" strokeWidth={1.5} />
                TOP PICKS
            </h2>
            <p className="text-[10px] md:text-xs text-white/40 font-sans tracking-widest mt-1 md:mt-2 pl-1 uppercase">
                社区甄选的动人瞬间
            </p>
        </div>

        <div className="relative group/carousel">
            {/* Fade Masks - Desktop Only */}
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none" />
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none" />

            {/* Scroll Container */}
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide px-6 md:px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {topPicks.map((photo, index) => (
                    <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                            const exhibitionId = (photo as any).exhibition?.id || (photo as any).exhibitionId;
                            if (exhibitionId) {
                                router.push(`/exhibition/${exhibitionId}?targetPhotoId=${photo.id}&instant=true`);
                            }
                        }}
                        className="relative flex-shrink-0 w-[40vw] md:w-56 aspect-[3/4] md:aspect-[4/5] bg-gray-900 rounded-lg md:rounded-lg overflow-hidden cursor-pointer group snap-center border border-white/5 md:hover:border-cyan-500/50 transition-all duration-500 shadow-2xl md:hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)] md:hover:-translate-y-1"
                    >
                        <img 
                            src={(photo as any).url || photo.src} 
                            alt={photo.title || 'Photo'}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                            loading="lazy"
                        />
                        
                        {/* Redesigned Ranking Badge (Ribbon/Tag) - Bookmark Style */}
                        <div className="absolute top-0 left-3 md:left-3 z-10 drop-shadow-lg">
                             <div className={`
                                relative w-6 md:w-6 h-8 md:h-8 flex items-center justify-center rounded-b-sm shadow-lg
                                ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' : 
                                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black' :
                                  index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-700 text-white' :
                                  'bg-gradient-to-br from-gray-700 to-gray-900 text-white/70'}
                            `}>
                                <span className="font-serif font-bold text-xs md:text-xs tracking-tight">{index + 1}</span>
                            </div>
                        </div>

                        {/* Info Overlay - Enhanced Contrast (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 pt-12 pb-3 px-3 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end">
                            <h3 className="text-white text-sm md:text-base font-serif font-bold leading-tight line-clamp-2 mb-1 md:group-hover:text-cyan-50 transition-colors drop-shadow-md">
                                {photo.title || 'Untitled'}
                            </h3>
                            <div className="flex items-center gap-1.5 opacity-90">
                                 <Gem size={12} className="text-cyan-400 fill-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                                 <span className="text-xs font-bold text-cyan-100 tracking-wider font-mono">
                                    {photo.picks_count || 0}
                                 </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
}
