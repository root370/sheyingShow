'use client';

import React, { useRef } from 'react';
import { ChevronsUp, Plus } from 'lucide-react';

interface DroppablePoolProps {
  items: any[];
  onUpload: (files: FileList) => void;
  onAdd?: (item: any) => void; // New prop
  onBatchAdd?: () => void;
  isMobile?: boolean;
  galleryItems?: any[];
}

export function DroppablePool({ items, onUpload, onBatchAdd }: DroppablePoolProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when items change
  React.useEffect(() => {
      if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
  }, [items.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onUpload(e.dataTransfer.files);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full p-8 flex items-center justify-center overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
        <input 
            type="file" 
            multiple 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
        />
        
        {/* Ghost Frame (Add Button) */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-32 aspect-[3/4] flex flex-col items-center justify-center cursor-pointer transition-all duration-500"
        >
             {/* Subtle Glass Background */}
             <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px] border border-white/10 transition-all duration-500 group-hover:border-white/20 group-active:bg-white/5" />
             
             {/* Content */}
             <div className="relative flex flex-col items-center z-10 space-y-3">
                <Plus strokeWidth={0.5} size={28} className="text-white/30 group-hover:text-white/60 transition-colors duration-500" />
                <span className="text-[9px] font-serif tracking-[0.3em] text-white/30 uppercase group-hover:text-white/60 transition-colors duration-500" >
                    添加底片
                </span>
             </div>
             
             {/* Corner Accents (Viewfinder feel) */}
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:border-white/5 opacity-0 group-hover:opacity-100" />
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:border-white/5 opacity-0 group-hover:opacity-100" />
        </div>
    </div>
  );
}
