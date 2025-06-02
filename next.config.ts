import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Optimize for production
  swcMinify: true,

  // Compress responses
  compress: true,

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Performance optimizations
  eslint: {
    // Disable eslint during builds to save memory
    ignoreDuringBuilds: true,
  },

  typescript: {
    // Disable type checking during builds to save memory
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
