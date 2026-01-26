import GalleryContainer from '@/components/GalleryContainer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ExhibitionControls from '@/components/ExhibitionControls'

// 强制动态渲染，因为我们需要根据 id 实时获取数据
export const dynamic = 'force-dynamic';

export default async function ExhibitionPage({ params }: { params: { id: string } }) {
  // Ensure params is awaited or accessed properly in newer Next.js versions if needed,
  // but standard page props are usually available.
  // However, let's make sure we have the ID.
  const id = params.id;
  
  // Fetch exhibition details (to get author)
  const { data: exhibition } = await supabase
    .from('exhibitions')
    .select('user_id, title, description')
    .eq('id', id)
    .single();

  // Fetch data from Supabase
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('exhibition_id', id)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching photos:', error);
    return <div>Error loading exhibition: {error.message}</div>;
  }

  if (!photos) {
      return <div>No photos found for this exhibition.</div>;
  }

  // Get current user to check if they are the author
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthor = user?.id === exhibition?.user_id;

  // Transform database photos to the format expected by GalleryContainer
  const galleryPhotos = photos.map(p => ({
      id: p.id,
      src: p.url,
      alt: p.caption || 'Exhibition Photo',
      caption: p.caption,
      title: p.title,
      year: p.year,
      aspectRatio: 'landscape' as const, // Cast to literal type
      color: '#000000', // Default or store this
      annotations: [], // Default empty
      exif: p.exif_data // Map EXIF data
    }));

    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] overflow-hidden relative">
        
        {/* Controls (Edit/Delete) - Client Component checks auth */}
        <ExhibitionControls exhibitionId={id} authorId={exhibition?.user_id} />

        {/* Back to Lobby Button */}
        <Link 
          href="/" 
          className="fixed top-8 left-8 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-sans text-xs tracking-widest uppercase">Lobby</span>
        </Link>

        <GalleryContainer 
          photos={galleryPhotos} 
          exhibitionId={id} 
          title={exhibition?.title}
          description={exhibition?.description}
          isAuthor={isAuthor}
        />
      </main>
    )
}
