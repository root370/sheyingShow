import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ExhibitionProvider } from '@/context/ExhibitionContext';

// 临时禁用 Google Fonts，改用系统字体以修复国内构建问题
// import { Cormorant_Garamond, Manrope } from 'next/font/google'

// const cormorant = Cormorant_Garamond({ ... })
// const manrope = Manrope({ ... })

import WelcomeLetter from '@/components/WelcomeLetter';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ExhibitionProvider>
      {/* 暂时移除字体变量 */}
      <main className={`font-sans`}>
        <WelcomeLetter />
        <Component {...pageProps} />
      </main>
    </ExhibitionProvider>
  )
}
