import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Fix for Next.js 16+ dev resources block on lvh.me
  allowedDevOrigins: ['lvh.me', '*.lvh.me', 'localhost:3000'],
  experimental: {
    serverActions: {
      allowedOrigins: ['lvh.me:3000', '*.lvh.me:3000'],
    },
  },
};

export default nextConfig;
