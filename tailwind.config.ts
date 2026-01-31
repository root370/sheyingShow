import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant-garamond)', 'Songti SC', 'STSong', 'serif'],
        sans: ['var(--font-manrope)', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        background: '#030303',
        surface: '#0A0A0A',
        accent: '#E5D0AC', // Champagne Gold
        matte: '#1C1C1C',
      },
    },
  },
  plugins: [],
}
export default config
