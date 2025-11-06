import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ⚡ Tắt ESLint khi build
  },
  typescript: {
    ignoreBuildErrors: false, // Vẫn check TypeScript
  },
};

export default nextConfig;
