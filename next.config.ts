import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

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

  // Webpack configuration to handle path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };
    return config;
  },
};

export default nextConfig;
