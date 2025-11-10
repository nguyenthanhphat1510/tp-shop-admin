import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ⚡ Tắt ESLint khi build
  },
  typescript: {
    ignoreBuildErrors: false, // Vẫn check TypeScript
  },

  // 👇 Thêm khối này vào
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;