'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePhoto } from './SortablePhoto';
import { ResizeHandle } from './ResizeHandle';
import { EditablePreface } from './EditablePreface';

interface GalleryPreviewProps {
  items: any[];
  onStateChange: (state: any) => void;
  onItemUpdate: (itemId: string, field: string, value: string) => void;
  onRemoveItem: (itemId: string) => void; // Added prop
  initialPreface?: { title: string; description: string };
  initialSpacings?: {[key: string]: number};
}

export function GalleryPreview({ items, onStateChange, onItemUpdate, onRemoveItem, initialPreface, initialSpacings }: GalleryPreviewProps) {
  const { setNodeRef } = useDroppable({
    id: 'gallery-droppable',
  });

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

  return (
    <div 
        ref={setNodeRef}
        className="w-full h-full flex items-center overflow-x-auto overflow-y-hidden"
    >
      {/* 1. The Preface Card (Always First, Non-Sortable) */}
      <EditablePreface 
          title={preface.title} 
          description={preface.description} 
          onUpdate={handlePrefaceUpdate} 
          items={items}
      />
      
      {/* Gap after Preface */}
      <ResizeHandle 
         initialSpacing={spacings['preface'] || 400} // Default large gap after preface
         onSpacingChange={(val) => updateSpacing('preface', val)}
      />

      {/* 2. The Sortable Gallery Items */}
      <SortableContext 
        items={items.map(i => i.id)} 
        strategy={horizontalListSortingStrategy}
      >
        {items.length === 0 ? (
             <div className="w-[400px] h-[300px] flex items-center justify-center text-white/20 text-sm font-serif tracking-widest uppercase border-2 border-dashed border-white/10 rounded-xl m-8 shrink-0">
                 Drag Photos Here
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
                    />
                    
                    {/* Add ResizeHandle after each item (including the last one for padding) */}
                    <ResizeHandle 
                        initialSpacing={spacings[item.id] || 200} // Default 200px gap between photos
                        onSpacingChange={(val) => updateSpacing(item.id, val)}
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


