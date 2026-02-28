import type { NextConfig } from "next";

// Strip any /api/vN suffix to get the bare backend origin (e.g. http://localhost:5000)
// This is used for the /uploads/* rewrite so local images load via same-origin proxy.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const backendOrigin = rawApiUrl.replace(/\/api(\/v\d+)?\/?$/, "").replace(/\/$/, "") || "http://localhost:5000";

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
