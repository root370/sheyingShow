'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PhotoFrameComponent from '@/components/PhotoFrame'; // Import default
import { EditableText } from './EditableText';
import { X, ChevronUp, ChevronDown, Check, Star } from 'lucide-react';

interface SortablePhotoProps {
  id: string;
  src: string;
  type: 'thumbnail' | 'framed';
  title?: string;
  year?: string;
  spacing?: number; // Add spacing prop
  exif?: any;
  file?: File; // For AI analysis
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  onUpdate?: (field: 'title' | 'year', value: string) => void;
  onRemove?: () => void;
  onClick?: () => void; // Add onClick prop
  isMobile?: boolean;
  enableAI?: boolean;
  onMove?: (direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
  isSelected?: boolean;
  isCover?: boolean; // New prop
  onSetCover?: () => void; // New prop
}

export function SortablePhoto({ id, src, type, title = "", year = "", exif, file, aspectRatio = 'landscape', onUpdate, onRemove, onClick, isMobile = false, enableAI = true, onMove, isFirst, isLast, isSelected = false, isCover = false, onSetCover }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isMobile });

  // Desktop: restricted height
  let frameHeightClass = isMobile 
      ? "w-full h-auto" // Mobile: full width, auto height
      : "h-auto max-h-[46vh]"; // Desktop: restricted height
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 'auto',
    // touchAction handled by class
  };

  // On mobile, disable drag listeners to prevent scroll conflict and enable native scrolling
  const dndListeners = isMobile ? {} : listeners;

  if (type === 'framed') {
      return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...dndListeners}
            className={`group relative ${isMobile ? 'w-full mb-8' : 'shrink-0 prevent-select'}`}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
             {/* Transform to PhotoFrame (Museum Matte) */}
             <div 
                {...dndListeners}
                className={`${isMobile ? 'w-full h-auto flex-col' : 'w-auto h-full'} flex items-center justify-center cursor-grab active:cursor-grabbing relative`}
             > {/* Use flex to center and allow dynamic width */}
                <PhotoFrameComponent 
                    src={src} 
                    alt="Exhibition Photo" 
                    caption="" // We'll use custom editable text instead
                    exif={exif}
                    file={file}
                    aspectRatio={aspectRatio} 
                    className={`${frameHeightClass} ${isMobile ? 'w-full' : 'w-auto'} select-none ${isCover ? 'ring-2 ring-yellow-500/50' : ''}`} // Ensure height constraint and auto width
                    skipDeveloping={true} // Skip darkroom effect in editor
                    contentMaxHeight={isMobile ? undefined : "46vh"} // 直接限制图片高度，配合外层 h-auto 实现贴合
                    isMobile={isMobile}
                    enableAI={enableAI}
                    // Force the image to cover the frame area without overflowing
                    objectFit="cover"
                />
                
                {/* Cover Badge (Top Left) */}
                {isCover && (
                   <div className="absolute top-4 left-4 z-50 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-sans tracking-widest uppercase border border-white/20 pointer-events-none">
                      封面
                   </div>
                )}

                {/* Set Cover Button (Top Right) */}
                {isMobile && onSetCover && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isCover) onSetCover();
                        }}
                        className={`absolute top-4 right-4 z-50 p-2 rounded-full backdrop-blur-md transition-all shadow-lg ${
                            isCover 
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 cursor-default' 
                                : 'bg-black/40 text-white/50 border border-white/10 hover:text-white hover:border-white/50 active:scale-95'
                        }`}
                        title={isCover ? "当前封面" : "设为封面"}
                    >
                        <Star size={16} fill={isCover ? "currentColor" : "none"} />
                    </button>
                )}

                {/* Mobile Sort Controls */}
                {isMobile && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
                        <button 
                           onClick={(e) => { e.stopPropagation(); onMove?.('up'); }}
                           disabled={isFirst}
                           className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 disabled:opacity-0 active:scale-95 transition-all shadow-lg"
                        >
                           <ChevronUp size={20} />
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); onMove?.('down'); }}
                           disabled={isLast}
                           className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 disabled:opacity-0 active:scale-95 transition-all shadow-lg"
                        >
                           <ChevronDown size={20} />
                        </button>
                    </div>
                )}

                {/* Delete Button (Only visible on hover in non-dragging state) */}
                {!isDragging && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start immediately on pointer down
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent drag start
                            onRemove?.();
                        }}
                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-50 shadow-md cursor-pointer"
                        title="移除底片"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                )}
             </div>
             
             {/* Editable Metadata Overlay (Below the frame) */}
             <div className="mt-4 text-center cursor-default">
                <EditableText 
                    initialValue={title} 
                    onSave={(val) => onUpdate?.('title', val)}
                    className="font-serif text-white text-xl tracking-widest uppercase leading-none block mb-2"
                    placeholder="作品名称"
                />
                <div className="flex justify-center">
                    <EditableText 
                        initialValue={year} 
                        onSave={(val) => onUpdate?.('year', val)}
                        className="text-[10px] font-sans text-gray-400 tracking-[0.2em] uppercase"
                        placeholder="年份"
                    />
                </div>
             </div>
        </div>
      );
  }

  // Thumbnail Style (Light Table)
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dndListeners}
      onClick={onClick}
      className={`relative w-24 h-24 bg-white p-1 shadow-sm hover:scale-105 transition-transform prevent-select ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''} ${isSelected ? 'ring-2 ring-white' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="w-full h-full overflow-hidden bg-gray-100 relative">
         <img src={src} alt="" draggable={false} className={`w-full h-full object-cover pointer-events-none ${isSelected ? 'opacity-60' : ''}`} />
         {isSelected && (
             <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5 shadow-sm">
                 <Check size={12} className="text-white" strokeWidth={3} />
             </div>
         )}
      </div>
    </div>
  );
}
