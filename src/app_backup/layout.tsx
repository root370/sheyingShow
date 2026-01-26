import './globals.css'
// import { Cormorant_Garamond, Manrope } from '@next/font/google'

// const cormorant = Cormorant_Garamond({ 
//   subsets: ['latin'],
//   variable: '--font-cormorant-garamond',
//   display: 'swap',
//   weight: '400',
//   style: 'normal',
// })

// const manrope = Manrope({ 
//   subsets: ['latin'],
//   variable: '--font-manrope',
//   display: 'swap',
//   weight: '400',
// })

import { ExhibitionProvider } from '@/context/ExhibitionContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark`} suppressHydrationWarning>
      <body className="font-sans bg-[#030303] text-white min-h-screen selection:bg-[#E5D0AC] selection:text-black">
        <ExhibitionProvider>
          {/* Global SVG Filters */}
          <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
              <filter id="liquid-distortion">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" result="warp" />
                <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" />
              </filter>
              <filter id="liquid-hover">
                 <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
                 <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G">
                   <animate attributeName="scale" from="0" to="20" dur="0.4s" begin="mouseenter" fill="freeze" />
                   <animate attributeName="scale" from="20" to="0" dur="0.4s" begin="mouseleave" fill="freeze" />
                 </feDisplacementMap>
              </filter>
            </defs>
          </svg>
          {children}
        </ExhibitionProvider>
      </body>
    </html>
  )
}
