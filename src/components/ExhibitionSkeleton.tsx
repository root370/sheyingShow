
import React from 'react';

const ExhibitionSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-1 mb-6 md:mb-12 break-inside-avoid animate-pulse">
        {/* Card Placeholder */}
        <div className="relative w-full aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-50" />
        </div>

        {/* Text Placeholder */}
        <div className="px-1 mt-2 space-y-2">
            {/* Title */}
            <div className="h-4 bg-white/10 rounded w-3/4" />
            
            {/* Meta (Author / Date) */}
            <div className="flex items-center justify-between">
                <div className="h-3 bg-white/5 rounded w-1/3" />
                <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
        </div>
    </div>
  );
};

export default ExhibitionSkeleton;
