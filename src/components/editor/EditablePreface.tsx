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
    <div className={`shrink-0 w-screen flex flex-col justify-center items-center text-center relative snap-start ${isMobile ? 'h-auto py-2 pt-24 px-6' : 'h-full p-8'}`}>
        <div className={`w-full max-w-2xl flex flex-col items-center`}>
            {/* Title Input */}
            <EditableText 
                ref={titleRef}
                initialValue={title} 
                onSave={(val) => onUpdate('title', val)}
                className={`font-serif text-white tracking-tight bg-transparent outline-none w-full text-center placeholder:text-white/30 ${isMobile ? 'text-3xl mb-2' : 'text-6xl md:text-8xl mb-8'}`}
                placeholder="展览标题"
            />
            
            {/* Description Input */}
            <div className="relative group w-full">
                <textarea 
                    value={description}
                    onChange={(e) => {
                        onUpdate('description', e.target.value);
                        if (!isMobile) {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder="这些图片带给你怎么样的感受..."
                    rows={isMobile ? 2 : undefined}
                    className={`font-sans text-white/50 text-sm leading-relaxed bg-transparent outline-none resize-none text-center w-full placeholder:text-white/20 focus:text-white/80 transition-colors custom-scrollbar ${isMobile ? 'h-16' : 'h-48'}`}
                />
            </div>
        </div>
    </div>
  );
}
