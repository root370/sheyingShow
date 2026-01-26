/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rive-app/react-canvas', '@rive-app/canvas'],
  images: {
    domains: ['images.unsplash.com', 'kvjmgtigzilketuaigwi.supabase.co'],
    unoptimized: true,
  },
  webpack: (config) => {
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    return config;
  },
}

module.exports = nextConfig;