import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ExhibitionProvider } from '@/context/ExhibitionContext';
import { Cormorant_Garamond, Manrope } from '@next/font/google';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
  weight: '400',
  style: 'normal',
});

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: '400',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${cormorant.variable} ${manrope.variable}`}>
      <ExhibitionProvider>
        <Component {...pageProps} />
      </ExhibitionProvider>
    </div>
  );
}
