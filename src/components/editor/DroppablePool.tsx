'use client';

import React, { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortablePhoto } from './SortablePhoto';

interface DroppablePoolProps {
  items: any[];
  onUpload: (files: FileList) => void;
}

export function DroppablePool({ items, onUpload }: DroppablePoolProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        className="w-full h-full p-8 overflow-y-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-white/50 font-sans text-xs tracking-[0.2em] uppercase">Light Table</h2>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-white/50 hover:text-white text-xs uppercase tracking-widest border border-white/20 px-4 py-2 hover:border-white transition-colors"
            >
                + Upload
            </button>
            <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
            />
        </div>
        
        {/* Drop Zone Visual */}
        {items.length === 0 && (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg text-white/30 cursor-pointer hover:border-white/40 hover:text-white/50 transition-colors"
             >
                 <span className="mb-2 text-2xl">+</span>
                 <span className="font-serif tracking-widest text-sm">DROP NEGATIVES HERE OR CLICK TO IMPORT</span>
             </div>
        )}

        {/* The Pool Grid */}
        <div className="flex flex-wrap gap-4">
            {items.map((item) => (
                <SortablePhoto key={item.id} id={item.id} src={item.src} exif={item.exif} type="thumbnail" />
            ))}
        </div>
    </div>
  );
}
