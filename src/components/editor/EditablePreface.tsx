'use client';

import React, { useState } from 'react';
import { EditableText, EditableTextHandle } from './EditableText';
import { Sparkles, Loader2 } from 'lucide-react';

interface EditablePrefaceProps {
  title: string;
  description: string;
  onUpdate: (field: 'title' | 'description', value: string) => void;
  items: any[];
  titleRef?: React.RefObject<EditableTextHandle>;
  isMobile?: boolean;
}

export function EditablePreface({ title, description, onUpdate, items, titleRef, isMobile }: EditablePrefaceProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePreface = async () => {
    if (items.length === 0) {
      alert("请至少选择一张底片");
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
          alert("无法处理图片以进行分析。");
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
        throw new Error(data.error || '生成序言失败');
      }

      // 3. Update Description
      if (data.preface) {
        onUpdate('description', data.preface);
      }

    } catch (error: any) {
      console.error("Generation failed:", error);
      alert(`生成失败：${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`shrink-0 w-screen flex flex-col justify-center items-center text-center relative border-r border-white/10 snap-start ${isMobile ? 'h-auto py-2 pt-24' : 'h-full'}`}>
        <div className={`max-w-2xl text-center flex flex-col items-center ${isMobile ? 'p-4' : 'p-8'}`}>
            {/* Title Input */}
            <EditableText 
                ref={titleRef}
                initialValue={title} 
                onSave={(val) => onUpdate('title', val)}
                className={`font-serif text-white tracking-tighter bg-transparent outline-none w-full text-center placeholder:text-white/20 ${isMobile ? 'text-4xl mb-4 leading-tight' : 'text-6xl md:text-8xl mb-8'}`}
                placeholder="展览标题"
            />
            
            {/* Description Input */}
            <div className="relative group w-full max-w-lg mx-auto">
                <textarea 
                    value={description}
                    onChange={(e) => {
                        onUpdate('description', e.target.value);
                        if (!isMobile) {
                            // Auto-expand only on desktop or if we want dynamic height
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }
                    }}
                    onFocus={(e) => {
                         if (isMobile) {
                            // On mobile, maybe we don't want auto-expand if we fix height? 
                            // User asked for 1/2 height. Let's keep it fixed or simple.
                            // e.target.style.height = 'auto';
                            // e.target.style.height = Math.max(e.target.scrollHeight, 150) + 'px'; 
                         }
                    }}
                    onBlur={(e) => {
                        if (isMobile && !e.target.value) {
                             // e.target.style.height = '40px'; 
                        }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder="写下这一刻的想法（可选）..."
                    rows={isMobile ? 3 : undefined}
                    className={`font-sans text-gray-400 text-lg leading-relaxed bg-transparent outline-none resize-none text-center w-full placeholder:text-gray-600 focus:text-white transition-colors custom-scrollbar ${isMobile ? 'h-24' : 'h-48'}`}
                />
                
                {/* AI Generate Button - Removed as requested */}
            </div>
        </div>
        
        <div className={`absolute text-white/20 text-xs tracking-widest uppercase ${isMobile ? 'bottom-0 pb-2 relative mt-4' : 'bottom-8'}`}>
            展览序言
        </div>
    </div>
  );
}
