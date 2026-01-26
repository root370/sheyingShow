import Lobby from '@/components/Lobby';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>LATENT</title>
      </Head>
      <Lobby mode="explore" />
    </>
  );
}
