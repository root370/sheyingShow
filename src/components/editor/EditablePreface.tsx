'use client';

import React, { useState } from 'react';
import { EditableText } from './EditableText';
import { Sparkles, Loader2 } from 'lucide-react';

interface EditablePrefaceProps {
  title: string;
  description: string;
  onUpdate: (field: 'title' | 'description', value: string) => void;
  items: any[];
}

export function EditablePreface({ title, description, onUpdate, items }: EditablePrefaceProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePreface = async () => {
    if (items.length === 0) {
      alert("Please add some photos first.");
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Prepare Images (Convert to Base64)
      // Limit to first 5 images to avoid payload limits
      const imagesToAnalyze = items.slice(0, 5);
      
      const imageUrls = await Promise.all(imagesToAnalyze.map(async (item) => {
        // If we have the file object (new upload)
        if (item.file) {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(item.file);
          });
        }
        
        // If we have a remote URL (existing photo)
        if (item.src.startsWith('http')) {
            try {
                const response = await fetch(item.src);
                const blob = await response.blob();
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn("Failed to fetch remote image for analysis", e);
                return null;
            }
        }
        
        // Fallback for Blob URLs without file object (shouldn't happen often in this flow)
        if (item.src.startsWith('blob:')) {
             try {
                const response = await fetch(item.src);
                const blob = await response.blob();
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                return null;
            }
        }

        return null;
      }));

      const validImages = imageUrls.filter(url => url && url.startsWith('data:'));

      if (validImages.length === 0) {
          alert("Could not process images for analysis.");
          setIsGenerating(false);
          return;
      }

      // 2. Call API
      const response = await fetch('/api/analyze-exhibition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibitionTitle: title,
          imageUrls: validImages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate preface');
      }

      // 3. Update Description
      if (data.preface) {
        onUpdate('description', data.preface);
      }

    } catch (error: any) {
      console.error("Generation failed:", error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="shrink-0 w-screen h-full flex flex-col justify-center items-center text-center relative border-r border-white/10 snap-start">
        <div className="max-w-2xl text-center p-8 flex flex-col items-center">
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
                
                {/* AI Generate Button - Removed as requested */}
            </div>
        </div>
        
        <div className="absolute bottom-8 text-white/20 text-xs tracking-widest uppercase">
            Start of Exhibition
        </div>
    </div>
  );
}
