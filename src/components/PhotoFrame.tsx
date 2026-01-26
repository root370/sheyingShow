'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Annotation } from '@/data/photos';
import { MessageSquare, Target, Send, X, Sparkles, BrainCircuit } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PhotoFrameProps {
  id?: string; // We need photo ID for annotations
  src: string;
  alt: string;
  caption: string;
  title?: string;
  year?: string;
  file?: File; // The raw file for AI analysis
  exif?: {
    ISO?: number;
    FNumber?: number;
    Model?: string;
    ExposureTime?: number;
    FocalLength?: number;
    MeteringMode?: string;
  };
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  annotations?: Annotation[]; // Initial annotations if any
  isInspecting?: boolean;
  skipDeveloping?: boolean;
  className?: string;
  contentMaxHeight?: string; // New prop for explicit image height constraint
}

const PhotoFrame: React.FC<PhotoFrameProps> = ({ 
  id,
  src, 
  alt, 
  caption, 
  title,
  year,
  file,
  exif,
  aspectRatio = 'landscape',
  annotations: initialAnnotations = [],
  isInspecting = false,
  skipDeveloping = false,
  className = '',
  contentMaxHeight
}) => {
  // Developing State
  const [isDeveloped, setIsDeveloped] = useState(skipDeveloping); // If skipDeveloping is true, start as developed

  // Watch for skipDeveloping changes (e.g. async auth check)
  useEffect(() => {
    if (skipDeveloping) {
        setIsDeveloped(true);
    }
  }, [skipDeveloping]);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const [randomDelay, setRandomDelay] = useState(0);

  useEffect(() => {
    setRandomDelay(Math.random() * 2);
  }, []);
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showWaitNotification, setShowWaitNotification] = useState(false);
  
  // Annotation State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [realAnnotations, setRealAnnotations] = useState<Annotation[]>(initialAnnotations);
  
  // Draft State
  const [draftDot, setDraftDot] = useState<{x: number, y: number} | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mouse Follower
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        mouseX.current = e.clientX;
        mouseY.current = e.clientY;
        if (isInspecting) {
            setCursorPos({ x: e.clientX, y: e.clientY });
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isInspecting]);

  // Sound Effect
  const playDevelopSound = () => {
    // Using a subtle liquid sound from local assets
    const audio = new Audio('/sounds/shutter.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play failed", e));
  };

  const startDeveloping = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDeveloped || isInspecting) return;
    // Don't trigger if clicking an annotation
    if ((e.target as HTMLElement).closest('.annotation-dot')) return;

    setIsHolding(true);
    
    holdTimer.current = setTimeout(() => {
        setIsDeveloped(true);
        setIsHolding(false);
        playDevelopSound();
    }, 3000);
  };

  const cancelDeveloping = () => {
    if (isDeveloped) return;
    setIsHolding(false);
    if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
    }
  };

  // Fetch annotations if ID exists
  useEffect(() => {
    if (!id) return;
    async function fetchAnnotations() {
        const { data } = await supabase
            .from('annotations')
            .select('*, profiles(username)')
            .eq('photo_id', id);
        
        if (data) {
            const formatted = data.map((a: any) => ({
                id: a.id,
                x: a.x_coord,
                y: a.y_coord,
                text: a.message,
                user_id: a.user_id,
                username: a.profiles?.username
            }));
            setRealAnnotations(formatted);
        }
    }
    fetchAnnotations();
  }, [id]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInspecting || draftDot) return; // Prevent multiple drafts

    // Get coordinates relative to the image container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDraftDot({ x, y });
    setDraftMessage('');
  };

  const cancelDraft = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setDraftDot(null);
      setDraftMessage('');
  };

  const formatShutterSpeed = (t?: number) => {
    if (!t) return '';
    if (t >= 1) return t + 's';
    return '1/' + Math.round(1/t);
  };

  const saveAnnotation = async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Stop propagation to prevent bubbling
      
      if (!draftDot || !draftMessage.trim() || !id || isSubmitting) {
          console.log("Validation failed", { draftDot, msg: draftMessage, id, isSubmitting });
          if (!id) alert("Error: Photo ID is missing. Cannot save comment.");
          return;
      }

      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
          alert("Please login to comment.");
          setIsSubmitting(false);
          return;
      }

      // 1. Ensure Profile Exists & Get Username (Defensive)
      let { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
        
      let username = profile?.username;

      if (!profile) {
           // Fallback or create if missing
           username = user.user_metadata?.username || user.email?.split('@')[0] || 'Visitor';
           const { error: createError } = await supabase
               .from('profiles')
               .insert({ id: user.id, username: username });
           
           if (createError) {
               console.error("Profile creation failed", createError);
           }
      }

      const { data, error } = await supabase
        .from('annotations')
        .insert({
            photo_id: id,
            user_id: user.id,
            x_coord: draftDot.x,
            y_coord: draftDot.y,
            message: draftMessage
        })
        .select()
        .single();
      
      if (error) {
          console.error("Failed to save annotation", error);
          alert(`Failed to save: ${error.message}`);
      } else if (data) {
          // Optimistic update
          setRealAnnotations(prev => [...prev, {
              id: data.id,
              x: data.x_coord,
              y: data.y_coord,
              text: data.message,
              user_id: data.user_id,
              username: username
          }]);
          setDraftDot(null);
          setDraftMessage('');
      }
      setIsSubmitting(false);
  };

  // Enhanced fileToBase64 with compression
  const fileToBase64 = async (input: File | string): Promise<string> => {
    // 1. Get Blob/File
    let blob: Blob;
    if (typeof input === 'string') {
        if (input.startsWith('data:')) return input; // Already base64
        const response = await fetch(input);
        blob = await response.blob();
    } else {
        blob = input;
    }

    // 2. Compress using Canvas
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Calculate new dimensions (max 1024px)
            const MAX_SIZE = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.8 quality
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(base64);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };

        img.src = url;
    });
  };

  // Comparison Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);

  const handleSliderMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingSlider.current || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  const handleSliderUp = () => {
    isDraggingSlider.current = false;
    window.removeEventListener('mousemove', handleSliderMove);
    window.removeEventListener('mouseup', handleSliderUp);
    window.removeEventListener('touchmove', handleSliderMove);
    window.removeEventListener('touchend', handleSliderUp);
  };

  const startSliderDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Important!
    isDraggingSlider.current = true;
    window.addEventListener('mousemove', handleSliderMove);
    window.addEventListener('mouseup', handleSliderUp);
    window.addEventListener('touchmove', handleSliderMove);
    window.addEventListener('touchend', handleSliderUp);
  };

  // Helper to clean up markdown text
  const cleanMarkdown = (text: string) => {
      if (!text) return '';
      // Remove 【】 brackets
      let cleaned = text.replace(/【|】/g, '');
      // Convert **bold** to HTML logic (we'll do simple cleaning here, rendering logic below)
      // Actually, we will split the text by sections for better rendering
      return cleaned;
  };

  // Parse critique into sections
  const parseCritique = (text: string) => {
      if (!text) return { overview: '', sections: [] };
      
      const lines = text.split('\n');
      const sections: { title: string, content: string[] }[] = [];
      let currentTitle = 'OVERVIEW'; // Default first section
      let currentContent: string[] = [];
      let overview = '';

      lines.forEach(line => {
          line = line.trim();
          if (!line) return;

          // Check for headers (e.g., "**优点**：" or "【优点】")
          const headerMatch = line.match(/^(\*\*|【)(.*?)(\*\*|】)(：|:)?$/);
          if (headerMatch) {
              if (currentContent.length > 0) {
                  if (currentTitle === 'OVERVIEW') overview = currentContent.join('\n');
                  else sections.push({ title: currentTitle, content: currentContent });
              }
              // Map Chinese/English headers to standardized English labels
              const rawTitle = headerMatch[2].trim();
              if (rawTitle.includes('概览') || rawTitle.includes('Overview')) currentTitle = 'OVERVIEW';
              else if (rawTitle.includes('优点') || rawTitle.includes('Strengths')) currentTitle = 'STRENGTHS';
              else if (rawTitle.includes('不足') || rawTitle.includes('Weaknesses')) currentTitle = 'WEAKNESSES';
              else if (rawTitle.includes('建议') || rawTitle.includes('Improvements')) currentTitle = 'SUGGESTED IMPROVEMENTS';
              else currentTitle = rawTitle.toUpperCase();
              
              currentContent = [];
          } else {
              // Clean content line
              let contentLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim(); // Remove list markers
              if (contentLine) currentContent.push(contentLine);
          }
      });

      // Push last section
      if (currentContent.length > 0) {
          if (currentTitle === 'OVERVIEW') overview = currentContent.join('\n');
          else sections.push({ title: currentTitle, content: currentContent });
      }

      return { overview, sections };
  };

  const parsedCritique = analysisResult?.critique ? parseCritique(analysisResult.critique) : null;

  const handleAnalyze = async (e: React.MouseEvent) => {
    console.log("Analyze button clicked");
    e.stopPropagation();
    e.preventDefault(); 
    
    setShowWaitNotification(true);
    setTimeout(() => setShowWaitNotification(false), 5000);

    setIsAnalyzing(true);
    setShowAnalysis(true); 
    setAnalysisResult(null);
    
    try {
        // Always convert to compressed Base64 first to avoid payload size issues
        // Even if it's a URL, we download and compress it in frontend now.
        const base64 = await fileToBase64(file || src);
        
        console.log("Sending compressed image data (Base64)");

        let exifStr = "";
        if (exif) {
             exifStr = `Model: ${exif.Model || ''}, ISO: ${exif.ISO || ''}, FNumber: ${exif.FNumber || ''}, Shutter: ${exif.ExposureTime || ''}`;
        }

        const res = await fetch('/api/analyze-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: base64, // Always send compressed base64
                exif_info: exifStr,
                photo_id: id // Pass ID for caching
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Analysis failed");
        }
        
        const data = await res.json(); 
        setAnalysisResult(data);
    } catch (err: any) {
        console.error(err);
        setAnalysisResult({ error: err.message || "Failed to analyze photo. Please try again." });
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative group">
       {/* Analysis Result Modal - Portal to Body */}
       {mounted && createPortal(
          <AnimatePresence>
            {showAnalysis && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAnalysis(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    
                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-[#0A0A0A] w-full max-w-5xl overflow-hidden rounded-xl"
                        style={{
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Subtle Grain Texture Overlay */}
                        <div 
                            className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                            }}
                        />

                        {/* Header */}
                        <div className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-full bg-cyan-950/30 border border-cyan-900/50 shadow-[0_0_15px_-3px_rgba(8,145,178,0.4)]">
                                    <Sparkles className="text-cyan-200" size={16} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-sans font-medium tracking-wide text-[#FDFDFD]">AI CRITIQUE</h3>
                            </div>
                            <button 
                                onClick={() => setShowAnalysis(false)} 
                                className="group p-2 rounded-full hover:bg-white/5 transition-all duration-300"
                            >
                                <X size={20} className="text-white/40 group-hover:text-white group-hover:rotate-90 transition-all duration-300" strokeWidth={1} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-8 min-h-[400px] max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-12">
                            {isAnalyzing ? (
                                <div className="w-full flex flex-col items-center justify-center h-64 space-y-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 border border-white/10 rounded-full animate-[spin_3s_linear_infinite]" />
                                        <div className="absolute inset-0 w-16 h-16 border-t border-cyan-400/80 rounded-full animate-[spin_1s_ease-in-out_infinite]" />
                                        <Sparkles className="absolute inset-0 m-auto text-cyan-400/50 animate-pulse" size={20} />
                                    </div>
                                    <p className="text-xs font-sans tracking-[0.2em] uppercase text-white/40 animate-pulse">
                                        Analyzing Composition...
                                    </p>
                                </div>
                            ) : analysisResult ? (
                                <>
                                    {/* Left Column: Text Analysis (Darkroom Receipt Style) */}
                                    <div className="flex-1 space-y-8 min-w-0 pr-6 border-r border-white/5 font-mono relative">
                                        
                                        {/* Receipt Top Edge Decoration */}
                                        <div className="absolute -top-4 left-0 w-full h-px border-t border-dashed border-white/10 opacity-50" />

                                        {analysisResult.error ? (
                                            <div className="text-red-300 text-xs text-center p-6 border border-dashed border-red-900/30 bg-red-950/10 font-mono">
                                                ERROR: {analysisResult.error}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Header Metadata */}
                                                <div className="flex justify-between items-end border-b border-dashed border-white/10 pb-4">
                                                    <div>
                                                        <h2 className="text-xl font-serif text-[#F0F0F0] tracking-widest uppercase">ANALYSIS REPORT</h2>
                                                        <span className="text-[9px] text-[#666] block mt-1">ID: {id?.slice(0,8).toUpperCase() || 'UNKNOWN'} // GEN-V1</span>
                                                    </div>
                                                </div>

                                                {/* Overview */}
                                                {parsedCritique?.overview && (
                                                    <div className="space-y-2 pb-4 border-b border-dashed border-white/10">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-[#888] bg-white/5 px-2 py-0.5 inline-block">
                                                                OVERVIEW
                                                            </h4>
                                                            <span className="text-[8px] text-[#444] font-mono">SECT-01</span>
                                                        </div>
                                                        <p className="text-[#CCC] font-mono text-xs leading-[1.6] opacity-90 text-justify">
                                                            {parsedCritique.overview}
                                                        </p>
                                                    </div>
                                                )}
 
                                                {/* Detailed Sections */}
                                                {parsedCritique?.sections.map((section, idx) => (
                                                    <div key={idx} className="space-y-2 pb-4 border-b border-dashed border-white/10 last:border-0">
                                                         <div className="flex justify-between items-center">
                                                            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-[#888] bg-white/5 px-2 py-0.5 inline-block">
                                                                {section.title}
                                                            </h4>
                                                            <span className="text-[8px] text-[#444] font-mono">SECT-0{idx + 2}</span>
                                                        </div>
                                                        <ul className="space-y-2 mt-1">
                                                            {section.content.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-3 group">
                                                                    <span className="text-[9px] text-cyan-600/50 font-mono mt-[2px] group-hover:text-cyan-400 transition-colors">[{String(i+1).padStart(2, '0')}]</span>
                                                                    <span className="flex-1 text-[#BBB] font-mono text-xs leading-relaxed tracking-wide group-hover:text-[#FFF] transition-colors duration-300">
                                                                        {item}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
 
                                                {/* Fallback if parsing fails */}
                                                {!parsedCritique && analysisResult.content && (
                                                     <div className="text-[#CCC] font-mono text-xs leading-[1.8] whitespace-pre-line border-t border-dashed border-white/10 pt-4">
                                                        {analysisResult.content}
                                                    </div>
                                                )}
                                                
                                                {/* Receipt Bottom Footer */}
                                                <div className="pt-4 flex justify-between items-center opacity-30">
                                                    <span className="text-[8px] font-mono">END OF REPORT</span>
                                                    <div className="h-px w-12 bg-white" />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Right Column: Comparison Slider */}
                                    <div className="w-full lg:w-[45%] flex flex-col gap-6 sticky top-0">
                                        {analysisResult.improved_image_url ? (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center px-1">
                                                     <h4 className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#666666]">
                                                        VISUAL ENHANCEMENT
                                                     </h4>
                                                     <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-sans tracking-widest text-cyan-500/80 uppercase">Drag to Compare</span>
                                                     </div>
                                                </div>

                                                {/* Comparison Slider Component */}
                                                <div 
                                                    ref={sliderRef}
                                                    className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border border-white/10 bg-[#050505] cursor-col-resize select-none shadow-2xl group"
                                                    onMouseDown={startSliderDrag}
                                                    onTouchStart={startSliderDrag}
                                                >
                                                    {/* Image 2 (Improved - Background) */}
                                                    <img 
                                                        src={analysisResult.improved_image_url} 
                                                        alt="AI Enhanced" 
                                                        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                                                    />

                                                    {/* Image 1 (Original - Clipped Overlay) */}
                                                    <div 
                                                        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none border-r border-white/20"
                                                        style={{ width: `${sliderPosition}%` }}
                                                    >
                                                        <img 
                                                            src={src} 
                                                            alt="Original" 
                                                            className="absolute inset-0 w-full h-full object-contain max-w-none" 
                                                            style={{ width: sliderRef.current ? sliderRef.current.clientWidth : '100%' }}
                                                        />
                                                        
                                                        {/* Label: Original */}
                                                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10">
                                                            <span className="text-[9px] text-white/80 font-sans tracking-widest uppercase">Original</span>
                                                        </div>
                                                    </div>

                                                    {/* Label: Enhanced (on the right side) */}
                                                    <div className="absolute top-4 right-4 bg-cyan-950/60 backdrop-blur-md px-2 py-1 rounded-sm border border-cyan-500/20 pointer-events-none">
                                                        <span className="text-[9px] text-cyan-200 font-sans tracking-widest uppercase flex items-center gap-1">
                                                            <Sparkles size={8} /> AI Enhanced
                                                        </span>
                                                    </div>

                                                    {/* Handle Line */}
                                                    <div 
                                                        className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-20 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                        style={{ left: `${sliderPosition}%` }}
                                                    >
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transform transition-transform group-hover:scale-110">
                                                            <div className="flex gap-0.5">
                                                                <div className="w-[1px] h-3 bg-black/40" />
                                                                <div className="w-[1px] h-3 bg-black/40" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rationale / Generation Notes (Moved Here) */}
                                                {analysisResult.comparison && (
                                                    <div className="mt-2 pt-4 border-t border-white/5">
                                                        <h4 className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#555555] mb-2 flex items-center gap-2">
                                                            <BrainCircuit size={12} />
                                                            Generation Notes
                                                        </h4>
                                                        <div className="bg-[#0F0F0F] border border-white/5 rounded-sm p-4 text-[#888888] font-serif text-xs leading-relaxed italic">
                                                            {analysisResult.comparison}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Fallback if no improved image
                                            <div className="w-full aspect-video rounded-sm overflow-hidden border border-white/10 bg-[#050505]">
                                                <img src={src} alt="Original" className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </motion.div>
                </div>
            )}
          </AnimatePresence>,
          document.body
       )}

      {/* Matte Board */}
      <div 
        className={`relative bg-[#Fdfdfd] p-4 md:p-6 transition-all duration-500 ease-out flex flex-col justify-center items-center rounded-[2px] ${className}`}
        style={{
          boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.5), 0 15px 30px -5px rgba(0, 0, 0, 0.4), 0 35px 70px -10px rgba(0, 0, 0, 0.3)',
          // Consistent height constraint logic
          height: '65vh', 
          width: 'auto',
          minWidth: aspectRatio === 'portrait' ? '30vh' : '50vh',
        }}
      >
        {/* Noise Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* AI Analysis Button - Moved inside Matte Board for better positioning context */}
        {isDeveloped && (
            <button
                onClick={handleAnalyze}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 z-[60] p-2 bg-black/10 backdrop-blur-sm text-black/60 rounded-full transition-all duration-300 hover:bg-black hover:text-white border border-black/5 hover:scale-110"
                title="AI Critique"
                style={{ pointerEvents: 'auto' }} 
            >
                <Sparkles size={14} />
            </button>
        )}

        {/* Image Container */}
        <div className="relative overflow-hidden w-auto h-full flex flex-col justify-center">
          {/* Latent State Overlay - Press & Hold Prompt */}
          {!isDeveloped && !isHolding && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20"
                >
                    <p className="text-white text-xs font-serif tracking-[0.2em] uppercase animate-pulse">
                        Press & Hold to Develop
                    </p>
                </motion.div>
            </div>
          )}

          {/* Progress Bar (Red Line) */}
          <div className={`absolute bottom-0 left-0 h-1 bg-red-600 z-30 transition-all ease-linear ${isHolding && !isDeveloped ? 'w-full opacity-100' : 'w-0 opacity-0'}`}
               style={{ transitionDuration: '1000ms' }}
          />


          <div 
            className={`relative z-10 ${isInspecting && isDeveloped ? 'cursor-none' : 'cursor-pointer'} flex justify-center items-center w-full h-full`}
            style={{
                maxHeight: '100%',
                maxWidth: '100%'
            }}
            onClick={isDeveloped ? handleImageClick : undefined}
            onMouseDown={startDeveloping}
            onMouseUp={cancelDeveloping}
            onMouseLeave={cancelDeveloping}
            onTouchStart={startDeveloping}
            onTouchEnd={cancelDeveloping}
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              draggable={false}
              className="w-auto h-auto block object-contain select-none"
              style={{
                maxHeight: contentMaxHeight || '100%',
                maxWidth: '100%',
                // Developing Logic
                filter: isDeveloped || isHolding 
                    ? (isInspecting ? 'brightness(0.9)' : 'grayscale(0%) brightness(100%) blur(0px) contrast(100%)')
                    : 'grayscale(100%) brightness(20%) blur(10px) contrast(120%)',
                transition: 'filter 3s ease-in-out'
              }}
            />
             {/* Inner Shadow Overlay - Beveled Mat Effect */}
             <div className="absolute inset-0 shadow-[inset_3px_3px_6px_-2px_rgba(0,0,0,0.4)] pointer-events-none" />

             {/* Custom Cursor for Inspection - Portal to Body to avoid Transform issues */}
             {mounted && isInspecting && isDeveloped && createPortal(
               <div 
                 className="fixed pointer-events-none z-[9999] text-white drop-shadow-md flex items-center gap-3"
                 style={{
                   left: cursorPos.x,
                   top: cursorPos.y,
                   transform: 'translate(15px, 15px)' // Offset to bottom-right of cursor
                 }}
               >
                  {/* Cursor Visual */}
                  <Target className="text-cyan-400 animate-pulse" size={24} strokeWidth={1.5} />
                  
                  {/* Instruction Text */}
                  <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10">
                      <p className="text-[10px] font-sans tracking-widest uppercase text-white whitespace-nowrap">
                          Click to Comment
                      </p>
                  </div>
               </div>,
               document.body
             )}
             
             {/* Annotations Layer - Only if Developed */}
             <AnimatePresence>
               {isInspecting && isDeveloped && realAnnotations.map((note) => (
                 <motion.div
                   key={note.id}
                   initial={{ opacity: 0, scale: 0 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0 }}
                   className="absolute z-20"
                   style={{ left: `${note.x}%`, top: `${note.y}%` }}
                 >
                   {/* Glowing Dot */}
                   <motion.div
                     className="relative w-4 h-4 -ml-2 -mt-2 cursor-pointer"
                     animate={{ 
                       boxShadow: ["0 0 0 0px rgba(6, 182, 212, 0.4)", "0 0 0 8px rgba(6, 182, 212, 0)"] // Cyan glow
                     }}
                     transition={{ 
                       duration: 2, 
                       repeat: Infinity,
                       ease: "easeInOut"
                     }}
                     onClick={(e) => {
                       e.stopPropagation();
                       setActiveTooltip(activeTooltip === note.id ? null : note.id);
                     }}
                   >
                     <div className="w-full h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                   </motion.div>

                   {/* Tooltip */}
                   <AnimatePresence>
                     {activeTooltip === note.id && (
                       <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 10 }}
                         className="absolute top-6 left-1/2 -translate-x-1/2 w-48 bg-black/90 backdrop-blur-md text-white text-xs p-3 rounded-sm border border-white/10 font-sans z-30 pointer-events-none shadow-xl"
                       >
                         <div className="font-serif text-[10px] text-cyan-400 mb-1 tracking-wider uppercase">COMMENT</div>
                         {note.text}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.div>
               ))}

                {/* Draft Dot & Input Popover */}
                {draftDot && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute z-30"
                        style={{ left: `${draftDot.x}%`, top: `${draftDot.y}%` }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                    >
                        {/* The Dot */}
                        <div className="w-4 h-4 -ml-2 -mt-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
                        
                        {/* The Input Popover */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-64 bg-black/90 backdrop-blur-xl border border-white/20 p-4 rounded-sm shadow-2xl">
                            <form onSubmit={saveAnnotation}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-serif text-gray-400 tracking-widest uppercase">ADD COMMENT</span>
                                    <button type="button" onClick={() => cancelDraft()} className="text-gray-500 hover:text-white transition-colors">
                                        <X size={12} />
                                    </button>
                                </div>
                                <textarea
                                    autoFocus
                                    value={draftMessage}
                                    onChange={(e) => setDraftMessage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-sm p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[60px] resize-none mb-2 font-sans"
                                    placeholder="What catches your eye?"
                                />
                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || !draftMessage.trim()}
                                        className="bg-white text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm hover:bg-cyan-400 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {isSubmitting ? 'SAVING...' : 'POST'}
                                        {!isSubmitting && <Send size={10} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* Caption - Only show if developed */}
        <motion.div 
            className="mt-3 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDeveloped ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.5 }}
        >
          {title && (
             <h3 className="font-serif text-lg tracking-widest uppercase text-gray-900 mb-1">
                 {title}
             </h3>
          )}
          
          {year && (
              <p className="text-[10px] font-sans text-gray-400 tracking-[0.2em] uppercase mb-2">
                  {year}
              </p>
          )}

          {caption && (
            <p className="text-[10px] tracking-widest uppercase text-gray-800 font-serif font-medium mb-1">
              {caption}
            </p>
          )}
          
          {exif && (
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[9px] tracking-wider text-gray-400 font-sans uppercase opacity-80">
                {exif.Model && <span>{exif.Model}</span>}
                {exif.FocalLength && <span>{Math.round(exif.FocalLength)}mm</span>}
                {exif.FNumber && <span>f/{exif.FNumber}</span>}
                {exif.ExposureTime && <span>{formatShutterSpeed(exif.ExposureTime)}</span>}
                {exif.ISO && <span>ISO {exif.ISO}</span>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PhotoFrame;
