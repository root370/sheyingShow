import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ExhibitionProvider } from '@/context/ExhibitionContext';

// Temporarily removed next/font/google due to build timeout in CN server
// import { Cormorant_Garamond, Manrope } from '@next/font/google';

// const cormorant = Cormorant_Garamond({ 
//   subsets: ['latin'],
//   variable: '--font-cormorant-garamond',
//   display: 'swap',
//   weight: '400',
//   style: 'normal',
// });

// const manrope = Manrope({ 
//   subsets: ['latin'],
//   variable: '--font-manrope',
//   display: 'swap',
//   weight: '400',
// });

export default function App({ Component, pageProps }: AppProps) {
  return (
    // <div className={`${cormorant.variable} ${manrope.variable}`}>
    <div className="font-variable-fallback">
      <ExhibitionProvider>
        <Component {...pageProps} />
      </ExhibitionProvider>
    </div>
  );
}
