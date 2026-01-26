import Lobby from '@/components/Lobby';
import Head from 'next/head';

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>My Gallery | LATENT</title>
      </Head>
      <Lobby mode="dashboard" />
    </>
  );
}
