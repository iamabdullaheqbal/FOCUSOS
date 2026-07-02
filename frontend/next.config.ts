import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow importing SVG and other assets
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
