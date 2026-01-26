'use client';

import React from 'react';
import { EditableText } from './EditableText';

interface EditablePrefaceProps {
  title: string;
  description: string;
  onUpdate: (field: 'title' | 'description', value: string) => void;
  items: any[];
}

export function EditablePreface({ title, description, onUpdate }: EditablePrefaceProps) {
  return (
    <div className="shrink-0 w-screen h-full flex flex-col justify-center items-center text-center relative border-r border-white/10 snap-start">
        <div className="max-w-2xl text-center p-8">
            {/* Title Input */}
            <EditableText 
                initialValue={title} 
                onSave={(val) => onUpdate('title', val)}
                className="font-serif text-6xl md:text-8xl text-white mb-8 tracking-tighter bg-transparent outline-none w-full text-center placeholder:text-white/20"
                placeholder="EXHIBITION TITLE"
            />
            
            {/* Description Input */}
            <div className="relative group w-full max-w-lg mx-auto">

                <textarea 
                    value={description}
                    onChange={(e) => onUpdate('description', e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder="Write your curatorial statement here..."
                    className="font-sans text-gray-400 text-lg leading-relaxed bg-transparent outline-none resize-none text-center w-full h-48 placeholder:text-gray-600 focus:text-white transition-colors custom-scrollbar"
                />
            </div>
        </div>
        
        <div className="absolute bottom-8 text-white/20 text-xs tracking-widest uppercase">
            Start of Exhibition
        </div>
    </div>
  );
}
