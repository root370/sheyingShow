'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PhotoFrameComponent from '@/components/PhotoFrame'; // Import default
import { EditableText } from './EditableText';
import { X } from 'lucide-react';

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
}

export function SortablePhoto({ id, src, type, title = "", year = "", exif, file, aspectRatio = 'landscape', onUpdate, onRemove }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // 移除硬编码的高度限制，改用最大高度限制，让图片尽可能大但又不溢出容器(50vh)
  // 通过 contentMaxHeight 传递给 img 标签，确保图片本身受到限制，从而让外层 div (h-auto) 能够正确收缩
  let frameHeightClass = "h-auto max-h-[46vh]"; 
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  if (type === 'framed') {
      return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            className="group relative shrink-0"
        >
             {/* Transform to PhotoFrame (Museum Matte) */}
             <div 
                {...listeners}
                className="w-auto h-full flex items-center justify-center cursor-grab active:cursor-grabbing relative"
             > {/* Use flex to center and allow dynamic width */}
                <PhotoFrameComponent 
                    src={src} 
                    alt="Exhibition Photo" 
                    caption="" // We'll use custom editable text instead
                    exif={exif}
                    file={file}
                    aspectRatio={aspectRatio} 
                    className={`${frameHeightClass} w-auto`} // Ensure height constraint and auto width
                    skipDeveloping={true} // Skip darkroom effect in editor
                    contentMaxHeight="46vh" // 直接限制图片高度，配合外层 h-auto 实现贴合
                />
                
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
                        title="Remove photo"
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
                    placeholder="TITLE"
                />
                <div className="flex justify-center">
                    <EditableText 
                        initialValue={year} 
                        onSave={(val) => onUpdate?.('year', val)}
                        className="text-[10px] font-sans text-gray-400 tracking-[0.2em] uppercase"
                        placeholder="YEAR"
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
      {...listeners}
      className="relative w-24 h-24 bg-white p-1 cursor-grab active:cursor-grabbing shadow-sm hover:scale-105 transition-transform"
    >
      <div className="w-full h-full overflow-hidden bg-gray-100">
         <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
