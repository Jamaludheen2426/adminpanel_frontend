import type { NextConfig } from "next";

// Derive the backend origin from NEXT_PUBLIC_API_URL (strip /api/v1 suffix)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const backendOrigin = apiUrl.replace(/\/api\/v\d+\/?$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy /uploads/* requests to the backend so images (avatars, logos, etc.) load correctly
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
