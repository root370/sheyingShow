/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rive-app/react-canvas', '@rive-app/canvas'],
  images: {
    domains: [
      'images.unsplash.com', 
      'kvjmgtigzilketuaigwi.supabase.co',
      'latentspace.top',
      'latentspace.top.com',
      'sheying-1258534340.cos.ap-shanghai.myqcloud.com',
      'static.latentspace.top', // 添加这一行
    ],
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