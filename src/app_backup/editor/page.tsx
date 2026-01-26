'use client';

import React, { useState } from 'react';
import RiveAnimation from '@/components/RiveAnimation';
import { Fit } from '@rive-app/react-canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { SortablePhoto } from './SortablePhoto';
import { DroppablePool } from './DroppablePool';
import { Photo } from '@/data/photos'; // We might need a slightly different type for uploaded files
import { GalleryPreview } from './GalleryPreview';
import { PublishButton } from './PublishButton';

// Mock initial data for the pool (simulating uploaded files)
// const initialPool = [
//   { id: 'p1', src: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=200', alt: 'Pool 1' },
//   { id: 'p2', src: 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?auto=format&fit=crop&q=80&w=200', alt: 'Pool 2' },
//   { id: 'p3', src: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200', alt: 'Pool 3' },
//   { id: 'p4', src: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=200', alt: 'Pool 4' },
// ];

import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import exifr from 'exifr';
import imageCompression from 'browser-image-compression';
import { useExhibitionCache } from '@/context/ExhibitionContext';

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exhibitionId = searchParams.get('id');
  const { invalidateCache } = useExhibitionCache();

  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [poolItems, setPoolItems] = useState<any[]>([]); // Start empty
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // State for Publish Payload
  const [prefaceData, setPrefaceData] = useState<any>({ title: '', description: '' });
  const [spacingData, setSpacingData] = useState<any>({});

  // Initial data for Edit Mode
  const [initialPreface, setInitialPreface] = useState<{title: string, description: string} | undefined>(undefined);
  const [initialSpacings, setInitialSpacings] = useState<{[key: string]: number} | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
                // Determine aspect ratio if possible, or default
                // Ideally we should have stored aspect ratio.
                // Since we didn't, we can try to infer or default to landscape.
                // Or async load image to check dimensions?
                // Let's async load to be nice.
                
                items.push({
                    id: p.id,
                    src: p.url,
                    alt: p.caption,
                    caption: p.caption,
                    title: p.title, // Load title
                    year: p.year,   // Load year
                    gap_after: p.gap_after,
                    aspectRatio: 'landscape' // Default, will update if we check dimensions
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

        // 2. Determine Aspect Ratio (Load image to get dimensions)
        await new Promise((resolve) => {
             const img = new Image();
             img.onload = () => {
                 if (img.height > img.width) {
                     aspectRatio = 'portrait';
                 } else if (img.height === img.width) {
                     aspectRatio = 'square';
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
        aspectRatio: aspectRatio
      };
    }));
    setPoolItems((prev) => [...prev, ...newItems]);
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
    // Or if user wants to delete completely?
    // For now, let's move it back to pool so it's not lost.
    // But we need to make sure we don't duplicate if it's already there (shouldn't be)
    setPoolItems(prev => [...prev, item]);
  };

  const isPublishingRef = React.useRef(false);

  const handlePublish = async () => {
    if (isPublishingRef.current) return;
    
    isPublishingRef.current = true;
    setIsPublishing(true);
    
    try {
    // 2. The Data Logic (The Payload)
    const payload = {
      title: prefaceData.title || "UNTITLED EXHIBITION",
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
            // Although unique names are used, let's be safe.
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
            exif_data: item.exif || null // Save EXIF data
            // id is omitted to let DB generate new UUID
        };

        // If this is the first item (sort_order 0), capture it
        // We use the itemToInsert.url because publicUrl might be updated
        if (i === 0) {
            detectedFirstUrl = publicUrl;
        }

        return itemToInsert;
    });

    const results = await Promise.all(uploadPromises);
    const photoInserts = results.filter(item => item !== null);

    // Step 3: Insert Photos - Wait for delete to finish first
    let firstPhotoUrl = detectedFirstUrl;
    
    if (photoInserts.length > 0) {
        // Double check deletion to be absolutely sure
        // (Though await delete above should handle it, RLS or race conditions might be tricky)
        
        const { error: photosError } = await supabase
            .from('photos')
            .insert(photoInserts);
        
        if (photosError) throw photosError;

        // Fallback: If detectedFirstUrl was somehow missed, try to find it from inserts
        if (!firstPhotoUrl) {
             // Cast to any to avoid TS issues since we know we filtered nulls
            const validPhotos = photoInserts as any[];
            const sortedPhotos = [...validPhotos].sort((a, b) => a.sort_order - b.sort_order);
            if (sortedPhotos.length > 0) {
                firstPhotoUrl = sortedPhotos[0].url;
            }
        }
    }

    // Step 3.5: Update Exhibition Cover with the first photo
    if (firstPhotoUrl) {
        console.log("Attempting to update cover_url to:", firstPhotoUrl);
        // Force update even if unchanged, using timestamp to ensure it processes
        const { error: coverError } = await supabase
            .from('exhibitions')
            .update({ 
                cover_url: firstPhotoUrl,
                // Add a dummy field update or just rely on cover_url change. 
                // But since cover_url might be same URL but different content (if overwritten), 
                // we depend on the ?t= param we added earlier.
             })
            .eq('id', targetExhibitionId);

        if (coverError) {
             console.error("CRITICAL: Failed to update cover url", coverError);
             alert(`Warning: Cover image failed to update. Error: ${coverError.message}`);
        } else {
             console.log("Cover URL updated successfully");
        }
    } else {
        console.warn("No firstPhotoUrl found, skipping cover update");
        // Try to get ANY photo if first one failed logic
        if (photoInserts.length > 0) {
             const fallbackUrl = (photoInserts[0] as any).url;
             console.log("Using fallback URL for cover:", fallbackUrl);
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
        alert("Publish failed. Please try again.");
        setIsPublishing(false);
        isPublishingRef.current = false;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Find where the item is coming from and going to
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Logic to move items between containers (Pool <-> Gallery)
    // For now, let's just focus on Drag End for the final move to keep it simple
    // But DragOver is needed for visual feedback if we were doing real-time list splicing
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
      // Move from Pool to Gallery
      const item = poolItems.find((i) => i.id === activeIdStr);
      if (item) {
        setPoolItems(poolItems.filter((i) => i.id !== activeIdStr));
        setGalleryItems([...galleryItems, { ...item, uniqueId: `${item.id}-${Date.now()}` }]); // Add to gallery
      }
    } else if (activeContainer === 'gallery' && overContainer === 'gallery') {
       // Reorder within Gallery
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
      <main className="h-screen w-screen bg-[#1a1a1a] flex flex-col overflow-hidden relative">
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
        <span className="font-sans text-xs tracking-widest uppercase">Lobby</span>
      </Link>

      {/* 1. The UI (The Trigger) */}
      <PublishButton onPublish={handlePublish} isPublishing={isPublishing} />

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
                DEVELOPING...
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
           />
      </div>

        {/* Bottom Area: Light Table (30vh) */}
        <div className="h-[30dvh] w-full bg-white/5 backdrop-blur-md relative">
            <DroppablePool items={poolItems} onUpload={handleUpload} />
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
