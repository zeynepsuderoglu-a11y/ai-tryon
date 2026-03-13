import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.replicate.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "studyoima.com" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "*.replicate.delivery" },
      { protocol: "https", hostname: "pbxt.replicate.delivery" },
      { protocol: "https", hostname: "cdn.fashn.ai" },
      { protocol: "https", hostname: "*.fashn.ai" },
    ],
  },
};

export default nextConfig;
