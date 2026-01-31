'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePhoto } from './SortablePhoto';
import { ResizeHandle } from './ResizeHandle';
import { EditablePreface } from './EditablePreface';
import { EditableTextHandle } from './EditableText';

interface GalleryPreviewProps {
  items: any[];
  onStateChange: (state: any) => void;
  onItemUpdate: (itemId: string, field: string, value: string) => void;
  onRemoveItem: (itemId: string) => void; // Added prop
  initialPreface?: { title: string; description: string };
  initialSpacings?: {[key: string]: number};
  titleRef?: React.RefObject<EditableTextHandle>;
  isMobile?: boolean;
  onMoveItem?: (itemId: string, direction: 'up' | 'down') => void;
}

export function GalleryPreview({ items, onStateChange, onItemUpdate, onRemoveItem, initialPreface, initialSpacings, titleRef, isMobile: propIsMobile, onMoveItem }: GalleryPreviewProps) {
  const { setNodeRef } = useDroppable({
    id: 'gallery-droppable',
  });

  const [isMobileState, setIsMobileState] = useState(false);
  const isMobile = propIsMobile ?? isMobileState; // Use prop if available, else state

  React.useEffect(() => {
    if (propIsMobile !== undefined) return; // Skip internal detection if prop provided
    const checkMobile = () => setIsMobileState(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [propIsMobile]);

  // State for Exhibition Metadata
  const [preface, setPreface] = useState({
      title: "",
      description: ""
  });

  // State for Spacings (Gaps)
  const [spacings, setSpacings] = useState<{[key: string]: number}>({});

  // Initialize/Update state from props
  React.useEffect(() => {
    if (initialPreface) {
        setPreface(initialPreface);
    }
  }, [initialPreface]);

  React.useEffect(() => {
    if (initialSpacings) {
        setSpacings(initialSpacings);
    }
  }, [initialSpacings]);

  // Lift state up whenever it changes
  React.useEffect(() => {
    onStateChange({
      preface,
      spacings
    });
  }, [preface, spacings, onStateChange]);

  const updateSpacing = (itemId: string, newSpacing: number) => {
      setSpacings(prev => ({...prev, [itemId]: newSpacing}));
  };

  const handlePrefaceUpdate = (field: 'title' | 'description', value: string) => {
      setPreface(prev => ({...prev, [field]: value}));
  };

  const handleRemoveItem = (itemId: string) => {
    // We need to propagate this up to parent (Editor Page) to handle the state change
    // But since GalleryPreview receives items as props, it should call a parent handler.
    // Let's add onRemoveItem to props.
    if (onRemoveItem) {
        onRemoveItem(itemId);
    }
  };

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const prevItemsLength = React.useRef(items.length);

  // Auto-scroll to bottom/end when items are added
  React.useEffect(() => {
    if (items.length > prevItemsLength.current) {
        // Item added
        setTimeout(() => {
            if (containerRef.current) {
                if (isMobile) {
                    containerRef.current.scrollTo({
                        top: containerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                } else {
                    containerRef.current.scrollTo({
                        left: containerRef.current.scrollWidth,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100); // Small delay to allow render
    }
    prevItemsLength.current = items.length;
  }, [items.length, isMobile]);

  return (
    <div 
        ref={(node) => {
            setNodeRef(node);
            containerRef.current = node;
        }}
        className={`w-full h-full flex ${isMobile ? 'flex-col overflow-y-auto overflow-x-hidden' : 'items-center overflow-x-auto overflow-y-hidden'}`}
    >
      {/* 1. The Preface Card (Always First, Non-Sortable) */}
      <EditablePreface 
          title={preface.title} 
          description={preface.description} 
          onUpdate={handlePrefaceUpdate} 
          items={items}
          titleRef={titleRef}
      />
      
      {/* Gap after Preface */}
      <ResizeHandle 
         initialSpacing={spacings['preface'] || (isMobile ? 50 : 400)} // Default large gap after preface, smaller on mobile
         onSpacingChange={(val) => updateSpacing('preface', val)}
         orientation={isMobile ? 'vertical' : 'horizontal'}
      />

      {/* 2. The Sortable Gallery Items */}
      <SortableContext 
        items={items.map(i => i.id)} 
        strategy={isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy}
      >
        {items.length === 0 ? (
             <div className="w-[400px] h-[300px] flex items-center justify-center text-white/20 text-sm font-serif tracking-widest uppercase border-2 border-dashed border-white/10 rounded-xl m-8 shrink-0">
                 拖拽照片至此
             </div>
        ) : (
            items.map((item, index) => (
                <React.Fragment key={item.id}>
                    <SortablePhoto 
                        id={item.id} 
                        src={item.src} 
                        type="framed" 
                        title={item.title} 
                        year={item.year} 
                        exif={item.exif}
                        file={item.file}
                        aspectRatio={item.aspectRatio} // Pass aspectRatio
                        onUpdate={(field, val) => onItemUpdate(item.id, field, val)}
                        onRemove={() => handleRemoveItem(item.id)} // Pass remove handler
                        isMobile={isMobile}
                        enableAI={false}
                        onMove={(direction) => onMoveItem?.(item.id, direction)}
                    />
                    
                    {/* Add ResizeHandle after each item (including the last one for padding) */}
                    <ResizeHandle 
                        initialSpacing={spacings[item.id] || 200} // Default 200px gap between photos
                        onSpacingChange={(val) => updateSpacing(item.id, val)}
                        orientation={isMobile ? 'vertical' : 'horizontal'}
                    />
                </React.Fragment>
            ))
        )}
      </SortableContext>
      
      {/* End padding */}
      <div className="w-32 shrink-0" />
    </div>
  );
}


