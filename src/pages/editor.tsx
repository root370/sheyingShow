import React, { useState } from 'react';
import RiveAnimation from '@/components/RiveAnimation';
import { Fit } from '@rive-app/react-canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { encode } from 'blurhash';
// Note: We need to make sure these components are available or imported correctly
// If they were in src/app/editor/..., we need to move them or import from src/app_backup/editor/...
// For now, I will assume they are available or I will fix imports later if build fails.
// Actually, I should probably copy them to src/components/editor/
import { SortablePhoto } from '@/components/editor/SortablePhoto';
import { DroppablePool } from '@/components/editor/DroppablePool';
import { GalleryPreview } from '@/components/editor/GalleryPreview';
import { PublishButton } from '@/components/editor/PublishButton';
import { PledgeModal } from '@/components/editor/PledgeModal';
import { EditableTextHandle } from '@/components/editor/EditableText';
import { Toast } from '@/components/Toast';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import exifr from 'exifr';
import imageCompression from 'browser-image-compression';
import { useExhibitionCache } from '@/context/ExhibitionContext';

export default function EditorPage() {
  const router = useRouter();
  const { id: exhibitionIdParam } = router.query;
  const exhibitionId = typeof exhibitionIdParam === 'string' ? exhibitionIdParam : exhibitionIdParam?.[0] || null;
  
  const { invalidateCache } = useExhibitionCache();

  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [poolItems, setPoolItems] = useState<any[]>([]); // Start empty
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPledge, setShowPledge] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const titleInputRef = React.useRef<EditableTextHandle>(null);
  
  // State for Publish Payload
  const [prefaceData, setPrefaceData] = useState<any>({ title: '', description: '' });
  const [spacingData, setSpacingData] = useState<any>({});

  // Initial data for Edit Mode
  const [initialPreface, setInitialPreface] = useState<{title: string, description: string} | undefined>(undefined);
  const [initialSpacings, setInitialSpacings] = useState<{[key: string]: number} | undefined>(undefined);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check Auth
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
        }
      } catch (error) {
        console.error("Auth check failed", error);
        router.replace('/login');
      }
    }
    checkAuth();
  }, []);

  // Load existing exhibition for editing
  React.useEffect(() => {
    async function loadExhibition() {
        if (!exhibitionId) return;
        
        // Fetch exhibition
        const { data: ex, error: exError } = await supabase
            .from('exhibitions')
            .select('*')
            .eq('id', exhibitionId)
            .single();
            
        if (exError || !ex) {
            console.error('Failed to load exhibition', exError);
            return;
        }

        // Fetch photos
        const { data: photos, error: photoError } = await supabase
            .from('photos')
            .select('*')
            .eq('exhibition_id', exhibitionId)
            .order('sort_order', { ascending: true });

        if (photoError) {
             console.error('Failed to load photos', photoError);
             return;
        }

        // Set Preface
        const preface = { title: ex.title || '', description: ex.description || '' };
        setPrefaceData(preface);
        setInitialPreface(preface);

        // Set Photos & Spacings
        const items: any[] = [];
        const spacings: any = {};

        if (photos) {
            for (const p of photos) {
                items.push({
                    id: p.id,
                    src: p.url,
                    alt: p.caption,
                    caption: p.caption,
                    title: p.title, // Load title
                    year: p.year,   // Load year
                    gap_after: p.gap_after,
                    aspectRatio: 'landscape', // Default, will update if we check dimensions
                    blurhash: p.blurhash
                });
                spacings[p.id] = p.gap_after;
            }
        }
        
        setGalleryItems(items);
        setInitialSpacings(spacings);
    }
    loadExhibition();
  }, [exhibitionId]);

  const handleUpload = async (files: FileList) => {
    const newItems = await Promise.all(Array.from(files).map(async (file) => {
      let exifData = null;
      let aspectRatio = 'landscape';
      let blurhash = null;
      
      try {
        // 1. Parse EXIF
        const output = await exifr.parse(file, {
            tiff: true,
            exif: true,
            pick: ['ISO', 'FNumber', 'Model', 'ExposureTime', 'FocalLength', 'MeteringMode'] 
        });
        if (output) {
            exifData = {
                ISO: output.ISO,
                FNumber: output.FNumber,
                Model: output.Model,
                ExposureTime: output.ExposureTime,
                FocalLength: output.FocalLength,
                MeteringMode: output.MeteringMode
            };
        }

        // 2. Determine Aspect Ratio & Generate BlurHash
        await new Promise((resolve) => {
             const img = new Image();
             img.onload = () => {
                 // Aspect Ratio
                 if (img.height > img.width) {
                     aspectRatio = 'portrait';
                 } else if (img.height === img.width) {
                     aspectRatio = 'square';
                 }
                 
                 // BlurHash
                 try {
                     const canvas = document.createElement("canvas");
                     // Scale down for performance and blurhash requirements
                     const w = 32;
                     const h = Math.round(32 * (img.height / img.width));
                     canvas.width = w;
                     canvas.height = h;
                     const ctx = canvas.getContext("2d");
                     if (ctx) {
                         ctx.drawImage(img, 0, 0, w, h);
                         const imageData = ctx.getImageData(0, 0, w, h);
                         blurhash = encode(imageData.data, w, h, 4, 3);
                     }
                 } catch (e) {
                     console.warn("Blurhash generation failed", e);
                 }

                 resolve(null);
             };
             img.onerror = () => resolve(null); // Fallback
             img.src = URL.createObjectURL(file);
        });

      } catch (e) {
        console.warn("Failed to parse metadata", e);
      }

      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        src: URL.createObjectURL(file), // Create local preview URL
        alt: file.name,
        file: file, // Store the File object for later upload
        exif: exifData,
        aspectRatio: aspectRatio,
        blurhash: blurhash
      };
    }));
    setPoolItems((prev) => [...prev, ...newItems]);
    
    // Mobile: Auto-add to gallery
    if (isMobile) {
        const galleryAdds = newItems.map(item => ({
            ...item,
            id: `${item.id}-${Date.now()}`,
            sourceId: item.id
        }));
        setGalleryItems(prev => [...prev, ...galleryAdds]);
        setToast({ visible: true, message: "已添加至展览" });
    } else if (newItems.length > 0) {
        setToast({ visible: true, message: "影像已留存" });
    }
  };

  const handlePreviewStateChange = (state: any) => {
    setPrefaceData(state.preface);
    setSpacingData(state.spacings);
  };

  // Handle individual photo metadata updates
  const handleItemUpdate = (itemId: string, field: string, value: string) => {
    setGalleryItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Handle removing item from gallery (move back to pool or delete)
  const handleRemoveItem = (itemId: string) => {
    // Find the item
    const item = galleryItems.find(i => i.id === itemId);
    if (!item) return;

    // Remove from gallery
    setGalleryItems(prev => prev.filter(i => i.id !== itemId));

    // Add back to pool (if it was an upload, maybe we want to keep it available?)
    setPoolItems(prev => {
        const sourceId = item.sourceId || item.id;
        const exists = prev.some(p => p.id === sourceId);
        if (exists) return prev;
        
        // Restore to original ID if available and remove gallery-specific props
        const { id, ...rest } = item;
        const restoredItem = { 
            ...rest, 
            id: sourceId 
        };
        
        // Remove 'uniqueId' if it exists (it was added during drag/drop in some versions, though not seen here explicitly but good practice)
        // Also remove sort_order or gap_after if they shouldn't be in pool? 
        // Actually pool items are simple {id, src, file, exif, ...}
        
        return [...prev, restoredItem];
    });
  };

  // Mobile: Handle moving items up/down
  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
      setGalleryItems(prev => {
          const index = prev.findIndex(i => i.id === itemId);
          if (index === -1) return prev;
          
          const newItems = [...prev];
          if (direction === 'up' && index > 0) {
              [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
          } else if (direction === 'down' && index < newItems.length - 1) {
              [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
          }
          return newItems;
      });
  };

  // Mobile: Handle adding from pool to gallery
  const handleAddToGallery = (item: any) => {
      // Check if item is already in gallery (by sourceId or id)
      const existingIndex = galleryItems.findIndex(g => (g.sourceId && g.sourceId === item.id) || g.id === item.id);
      
      if (existingIndex !== -1) {
          // Remove (Toggle)
          setGalleryItems(prev => prev.filter((_, i) => i !== existingIndex));
          setToast({ visible: true, message: "已移除" });
      } else {
          // Add
          // Do NOT remove from poolItems on Mobile (allow Toggle)
          // Generate new ID to avoid conflict with pool item
          const newItem = { 
              ...item, 
              id: `${item.id}-${Date.now()}`, 
              sourceId: item.id 
          };
          setGalleryItems(prev => [...prev, newItem]);
          setToast({ visible: true, message: "已放入展览" });
      }
  };

  const handleBatchAdd = () => {
    if (poolItems.length === 0) return;

    const newItems = poolItems.map(item => ({
        ...item,
        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId: item.sourceId || item.id
    }));

    setGalleryItems(prev => [...prev, ...newItems]);
    setPoolItems([]); // Clear the pool after adding
    setToast({ visible: true, message: "全卷底片已上墙" });
  };

  const isPublishingRef = React.useRef(false);

  const handlePublishClick = async () => {
    // 0. Empty Check
    if (galleryItems.length === 0) {
        setToast({ visible: true, message: "请至少选择一张照片" });
        return;
    }

    // 1. Validation
    if (!prefaceData.title || !prefaceData.title.trim()) {
        setToast({ visible: true, message: "请给展览起个名字" });
        titleInputRef.current?.focus();
        titleInputRef.current?.shake();
        return;
    }

    // 2. Show Pledge Modal
    setShowPledge(true);
  };

  const handleConfirmPublish = async () => {
    if (isPublishingRef.current) return;
    
    isPublishingRef.current = true;
    setIsPublishing(true);
    // Pledge modal stays open or we can close it, but keeping it open with loading state is better UX usually, 
    // or we can close it and show the full screen loading overlay.
    // The design says "Yes, Develop It" triggers API.
    // Let's close pledge modal first or let the overlay take over.
    setShowPledge(false); 
    
    try {
    // 2. The Data Logic (The Payload)
    const payload = {
      title: prefaceData.title || "未命名展览",
      description: prefaceData.description,
      items: galleryItems.map(item => ({
        id: item.id,
        photoUrl: item.src,
        caption: item.caption || "", 
        title: item.title,
        year: item.year,
        gapAfter: spacingData[item.id] || 200
      })),
      prefaceGap: spacingData['preface'] || 400
    };

    console.log("PUBLISHING EXHIBITION PAYLOAD:", payload);

    // Step 0: Get User
    const { data: { user } } = await supabase.auth.getUser();

    let targetExhibitionId = exhibitionId;

    if (exhibitionId) {
        // UPDATE EXISTING
        const { error: updateError } = await supabase
            .from('exhibitions')
            .update({
                title: payload.title,
                description: payload.description,
                status: 'published',
            })
            .eq('id', exhibitionId);
        
        if (updateError) throw updateError;
        
        // Delete existing photos (simple replace strategy)
        // Ensure we delete EVERYTHING first
        const { error: deleteError } = await supabase
            .from('photos')
            .delete()
            .eq('exhibition_id', exhibitionId);
            
        if (deleteError) throw deleteError;
        
    } else {
        // CREATE NEW
        const { data: exhibition, error: exError } = await supabase
            .from('exhibitions')
            .insert({
                title: payload.title,
                description: payload.description,
                user_id: user?.id,
                status: 'published',
            })
            .select()
            .single();

        if (exError) throw exError;
        if (!exhibition) throw new Error("Exhibition creation failed");
        
        targetExhibitionId = exhibition.id;
    }

    if (!targetExhibitionId) throw new Error("No exhibition ID");

    // Step 2: Parallel Upload of Photos
    // Capture the first URL directly from the loop to be safe
    let detectedFirstUrl = "";
    
    // Sort items by sort_order implicitly by map index, which matches how we display them
    const uploadPromises = galleryItems.map(async (item, i) => {
        let publicUrl = item.src;

        // Check if it's a local file (new upload)
        if (item.file) {
            // Compress Image
            let fileToUpload = item.file;
            try {
                const options = {
                    maxSizeMB: 1, // Max 1MB
                    maxWidthOrHeight: 1920, // Max width/height
                    useWebWorker: true,
                };
                fileToUpload = await imageCompression(item.file, options);
                console.log(`Compressed ${item.file.name}: ${item.file.size / 1024 / 1024}MB -> ${fileToUpload.size / 1024 / 1024}MB`);
            } catch (error) {
                console.error("Compression failed, using original file", error);
            }

            const fileExt = item.file.name.split('.').pop();
            const fileName = `${targetExhibitionId}/${Date.now()}-${i}.${fileExt}`;
            
            // Remove cacheControl: '3600' to avoid caching issues with same-name files or generally
            const { error: uploadError } = await supabase.storage
                .from('exhibitions')
                .upload(fileName, fileToUpload, {
                    upsert: true
                });

            if (uploadError) {
                console.error(`Failed to upload photo ${i}:`, uploadError);
                return null; // Skip this item on error
            }

            const { data } = supabase.storage
                .from('exhibitions')
                .getPublicUrl(fileName);
            
            // Add timestamp query param to bypass CDN cache
            publicUrl = `${data.publicUrl}?t=${Date.now()}`;
        }

        const itemToInsert = {
            exhibition_id: targetExhibitionId,
            url: publicUrl,
            caption: item.caption || "",
            title: item.title || "",
            year: item.year || "",
            gap_after: spacingData[item.id] || 200,
            sort_order: i,
            exif_data: item.exif || null, // Save EXIF data
            blurhash: item.blurhash || null // Save BlurHash
        };

        if (i === 0) {
            detectedFirstUrl = publicUrl;
        }

        return itemToInsert;
    });

    const results = await Promise.all(uploadPromises);
    const photoInserts = results.filter(item => item !== null);

    // Step 3: Insert Photos
    let firstPhotoUrl = detectedFirstUrl;
    
    if (photoInserts.length > 0) {
        const { error: photosError } = await supabase
            .from('photos')
            .insert(photoInserts);
        
        if (photosError) throw photosError;

        if (!firstPhotoUrl) {
            const validPhotos = photoInserts as any[];
            const sortedPhotos = [...validPhotos].sort((a, b) => a.sort_order - b.sort_order);
            if (sortedPhotos.length > 0) {
                firstPhotoUrl = sortedPhotos[0].url;
            }
        }
    }

    // Step 3.5: Update Exhibition Cover with the first photo
    if (firstPhotoUrl) {
        const { error: coverError } = await supabase
            .from('exhibitions')
            .update({ 
                cover_url: firstPhotoUrl,
             })
            .eq('id', targetExhibitionId);

        if (coverError) {
             console.error("CRITICAL: Failed to update cover url", coverError);
        }
    } else {
        if (photoInserts.length > 0) {
             const fallbackUrl = (photoInserts[0] as any).url;
             await supabase
                .from('exhibitions')
                .update({ cover_url: fallbackUrl })
                .eq('id', targetExhibitionId);
        }
    }

    console.log("Exhibition published successfully!");
    
    // Invalidate cache to force reload on Lobby/Dashboard
    invalidateCache();

    // Step 4: Redirect
    router.push(`/exhibition/${targetExhibitionId}`);
    } catch (error) {
        console.error("Publish failed:", error);
        alert("发布失败，请重试。");
        setIsPublishing(false);
        isPublishingRef.current = false;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Lock body scroll on mobile to prevent pull-to-refresh and other gestures during drag
    if (typeof window !== 'undefined') {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Restore body scroll on mobile
    if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
    }

    const { active, over } = event;
    const activeIdStr = active.id as string;

    if (!over) {
      setActiveId(null);
      return;
    }

    const overIdStr = over.id as string;
    const activeContainer = findContainer(activeIdStr);
    const overContainer = findContainer(overIdStr);

    if (activeContainer === 'pool' && overContainer === 'gallery') {
      const item = poolItems.find((i) => i.id === activeIdStr);
      if (item) {
        setPoolItems(poolItems.filter((i) => i.id !== activeIdStr));
        setGalleryItems([...galleryItems, { ...item, uniqueId: `${item.id}-${Date.now()}` }]);
      }
    } else if (activeContainer === 'gallery' && overContainer === 'gallery') {
       if (active.id !== over.id) {
        setGalleryItems((items) => {
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }

    setActiveId(null);
  };

  const findContainer = (id: string) => {
    if (poolItems.find((i) => i.id === id)) return 'pool';
    if (galleryItems.find((i) => i.id === id)) return 'gallery';
    if (id === 'gallery-droppable') return 'gallery';
    return null;
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <main 
        className="h-screen w-screen bg-[#1a1a1a] flex flex-col overflow-hidden relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* SVG Grid Pattern Background */}
      <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }}
      />
      
      {/* Back to Lobby Button */}
      <Link 
        href="/" 
        className="fixed top-8 left-8 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-sans text-xs tracking-widest uppercase">大厅</span>
      </Link>

      {/* 1. The UI (The Trigger) */}
      <PublishButton onPublish={handlePublishClick} isPublishing={isPublishing} />

      <PledgeModal 
        isOpen={showPledge} 
        onConfirm={handleConfirmPublish} 
        onCancel={() => setShowPledge(false)}
        isPublishing={isPublishing}
      />

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />

      {/* Full Screen Loading Overlay */}
      {isPublishing && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            <div className="w-64 h-64">
                <RiveAnimation 
                    src="/rive/11081-21225-loading.riv" 
                    className="w-full h-full"
                    fit={Fit.Contain}
                />
            </div>
            <div className="absolute mt-48 font-serif text-white tracking-[0.3em] animate-pulse">
                正在显影...
            </div>
        </div>
      )}

      {/* Top Area: Gallery Preview (70vh) */}
      <div className="h-[70dvh] w-full border-b border-white/10 relative overflow-hidden">
           <GalleryPreview 
             items={galleryItems} 
             onStateChange={handlePreviewStateChange} 
             onItemUpdate={handleItemUpdate} 
             onRemoveItem={handleRemoveItem}
             initialPreface={initialPreface}
             initialSpacings={initialSpacings}
             titleRef={titleInputRef}
             isMobile={isMobile}
             onMoveItem={handleMoveItem}
           />
      </div>

        {/* Bottom Area: Light Table (30vh) */}
        <div className="h-[30dvh] w-full bg-white/5 backdrop-blur-md relative">
            <DroppablePool 
                items={poolItems} 
                onUpload={handleUpload} 
                onAdd={handleAddToGallery}
                onBatchAdd={handleBatchAdd}
                isMobile={isMobile}
            />
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
             <div className="w-24 h-24 bg-white shadow-2xl rounded-sm overflow-hidden border-2 border-white transform rotate-3">
                 {/* Preview of dragged item */}
                  <img 
                    src={poolItems.find(i => i.id === activeId)?.src || galleryItems.find(i => i.id === activeId)?.src} 
                    className="w-full h-full object-cover" 
                    alt=""
                  />
             </div>
          ) : null}
        </DragOverlay>
      </main>
    </DndContext>
  );
}
