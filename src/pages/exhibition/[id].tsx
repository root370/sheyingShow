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
  const galleryPhotos = (photos || []).map((p: any) => ({
      id: p.id,
      src: p.url,
      alt: p.caption || 'Exhibition Photo',
      caption: p.caption,
      title: p.title,
      year: p.year,
      aspectRatio: 'landscape',
      color: '#000000',
      annotations: [],
      exif: p.exif_data
    }));

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
