/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { turbo: { turbopack: true } },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    domains: [],
  },

  headers: async () => {
    return [
      {
        source: "/serviceWorker.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
    ];
  },
};

const withPWA = require("next-pwa")({
  dest: "public",

  disable: process.env.NODE_ENV === "development", // Disable in dev, enable in prod
  register: true,
  skipWaiting: true,
  swSrc: "public/serviceWorker.js",
});

module.exports = withPWA(nextConfig);
