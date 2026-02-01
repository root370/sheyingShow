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
            className="group w-32 aspect-[3/4] flex flex-col items-center justify-center border-[0.5px] border-dashed border-white/20 bg-white/5 cursor-pointer active:bg-white/10 active:border-white/50 transition-all duration-300"
        >
             <Plus strokeWidth={0.5} size={24} className="mb-2 text-white/40 group-active:text-white/70 transition-colors" />
             <span className="text-[10px] font-sans tracking-[0.25em] text-white/40 uppercase group-active:text-white/70 transition-colors">INSERT FILM</span>
        </div>
    </div>
  );
}
