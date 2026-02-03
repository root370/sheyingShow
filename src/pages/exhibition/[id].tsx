import GalleryContainer from '@/components/GalleryContainer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ExhibitionControls from '@/components/ExhibitionControls'
import { GetServerSideProps } from 'next'
import Head from 'next/head'

interface ExhibitionPageProps {
  id: string;
  exhibition: any;
  photos: any[];
  isAuthor: boolean;
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;
  
  // Fetch exhibition details
  const { data: exhibition, error: exError } = await supabase
    .from('exhibitions')
    .select('user_id, title, description')
    .eq('id', id)
    .single();

  if (exError || !exhibition) {
      return { notFound: true };
  }

  // Fetch photos
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('exhibition_id', id)
    .order('sort_order', { ascending: true });

  if (error) {
    return { props: { error: error.message } };
  }

  // Transform photos
  const galleryPhotos = (photos || []).map((p: any) => {
    // Determine aspect ratio from EXIF or dimensions if available, or assume landscape
    // But better: Use the aspect ratio if we saved it? We don't have aspect_ratio column in DB yet.
    // However, we can infer it if we load the image dimensions? No, that's slow on server.
    // The best way is to check if we have it in metadata or just rely on natural image loading in frontend.
    // But ImageCard expects an explicit aspectRatio prop.
    // Let's check if we can calculate it from EXIF if available?
    // Actually, in Editor we detect it. We should probably save it to DB.
    // For now, let's try to infer from exif_data if available, otherwise default to landscape.
    // Wait, Editor saves `exif_data`.
    
    // A better temporary fix: Use 'auto' or pass the actual dimensions if possible?
    // ImageCard uses strict aspect ratios.
    // Let's modify the map to try to use what we have.
    
    // Check if we have explicit width/height in p (if we added columns) or inside exif_data?
    // The previous Editor code didn't save width/height to DB columns, only to exif_data maybe?
    
    // FIX: We need to trust the image's natural aspect ratio.
    // Since we don't have the ratio in DB, let's look at `exif_data`.
    // If not found, we might default to 'landscape' but that causes the issue.
    // Strategy: We can update the frontend (ImageCard/PhotoFrame) to handle 'auto' or undefined.
    // But here we must return a string.
    
    // Let's try to see if we can find orientation in EXIF?
    // p.exif_data might have PixelXDimension / PixelYDimension
    
    let ratio = 'landscape';
    if (p.exif_data) {
        const w = p.exif_data.PixelXDimension || p.exif_data.width;
        const h = p.exif_data.PixelYDimension || p.exif_data.height;
        if (w && h) {
            if (h > w) ratio = 'portrait';
            else if (h === w) ratio = 'square';
        }
        // Fallback: Check if ExifImageWidth exists
         else if (p.exif_data.ExifImageWidth && p.exif_data.ExifImageHeight) {
            if (p.exif_data.ExifImageHeight > p.exif_data.ExifImageWidth) ratio = 'portrait';
            else if (p.exif_data.ExifImageHeight === p.exif_data.ExifImageWidth) ratio = 'square';
        }
    }

    return {
      id: p.id,
      src: p.url,
      alt: p.caption || 'Exhibition Photo',
      caption: p.caption,
      title: p.title,
      year: p.year,
      aspectRatio: ratio, // Use calculated ratio
      color: '#000000',
      annotations: [],
      exif: p.exif_data
    };
  });

  return {
    props: {
      id,
      exhibition,
      photos: galleryPhotos,
      isAuthor: false // Client will check auth
    }
  };
}

export default function ExhibitionPage({ id, exhibition, photos, isAuthor, error }: ExhibitionPageProps) {
  if (error) {
    return <div>Error loading exhibition: {error}</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] overflow-hidden relative">
      <Head>
        <title>{exhibition?.title || 'Exhibition'} | LATENT</title>
      </Head>

      {/* Controls (Edit/Delete) - Client Component checks auth */}
      <ExhibitionControls exhibitionId={id} authorId={exhibition?.user_id} />

      {/* Back to Lobby Button */}
      <Link 
        href="/" 
        className="fixed top-8 left-8 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-sans text-xs tracking-widest uppercase">大厅</span>
      </Link>

      <GalleryContainer 
        photos={photos} 
        exhibitionId={id} 
        title={exhibition?.title}
        description={exhibition?.description}
        isAuthor={isAuthor}
      />
    </main>
  )
}
