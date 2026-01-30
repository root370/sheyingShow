import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta name="description" content="High-end photography exhibition platform" />
        <link rel="icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <body className="font-sans bg-[#030303] text-white min-h-screen selection:bg-[#E5D0AC] selection:text-black">
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
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
