import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import { ExhibitionProvider } from '@/context/ExhibitionContext';

// Use 'swap' to prevent blocking and specify fallback fonts
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  fallback: ['Times New Roman', 'serif']
})

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
  adjustFontFallback: false // Disable automatic fallback adjustment which might trigger downloads
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ExhibitionProvider>
      <main className={`${cormorant.variable} ${manrope.variable} font-sans`}>
        <Component {...pageProps} />
      </main>
    </ExhibitionProvider>
  )
}
