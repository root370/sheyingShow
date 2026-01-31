'use client';

import React, { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortablePhoto } from './SortablePhoto';
import { ChevronsUp } from 'lucide-react';

interface DroppablePoolProps {
  items: any[];
  onUpload: (files: FileList) => void;
  onAdd?: (item: any) => void; // New prop
  onBatchAdd?: () => void;
  isMobile?: boolean;
  galleryItems?: any[];
}

export function DroppablePool({ items, onUpload, onAdd, onBatchAdd, isMobile, galleryItems = [] }: DroppablePoolProps) {
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
        className="w-full h-full p-8 overflow-y-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-white/50 font-sans text-xs tracking-[0.2em] uppercase">观片台</h2>
            
            <div className="flex items-center gap-3">
                {/* Batch Add Button */}
                {onBatchAdd && items.length > 0 && (
                    <button
                        onClick={onBatchAdd}
                        className="group relative flex items-center gap-2 text-white/80 hover:text-white text-xs uppercase tracking-widest border border-white/30 px-3 py-2 hover:border-white transition-colors"
                        title="将观片台的所有底片，一键填入展览相框"
                    >
                        <ChevronsUp size={14} />
                        <span>全卷显影</span>
                    </button>
                )}

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/50 hover:text-white text-xs uppercase tracking-widest border border-white/20 px-4 py-2 hover:border-white transition-colors"
                >
                    + 上传
                </button>
            </div>
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
                 <span className="font-serif tracking-widest text-sm">{isMobile ? "点击照片放入展览" : "拖拽底片至此 或 点击上传"}</span>
             </div>
        )}

        {/* The Pool Grid */}
        <div className="flex flex-wrap gap-4">
            {items.map((item) => (
                <SortablePhoto 
                    key={item.id} 
                    id={item.id} 
                    src={item.src} 
                    exif={item.exif} 
                    type="thumbnail" 
                    isMobile={isMobile}
                    isSelected={isMobile && galleryItems.some(g => (g.sourceId && g.sourceId === item.id) || g.id === item.id)}
                    onClick={() => {
                        if (isMobile && onAdd) {
                            onAdd(item);
                        }
                    }}
                />
            ))}
        </div>
    </div>
  );
}
