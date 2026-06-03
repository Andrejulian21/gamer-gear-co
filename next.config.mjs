/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.razer.com',
      },
      {
        protocol: 'https',
        hostname: '**.logitechg.com',
      },
      {
        protocol: 'https',
        hostname: '**.corsair.com',
      },
      {
        protocol: 'https',
        hostname: '**.hyperxgaming.com',
      },
      {
        protocol: 'https',
        hostname: '**.redragon.com',
      },
    ],
  },
};

export default nextConfig;
