import type { NextConfig } from "next";
import type { WebpackConfigContext } from "next/dist/server/config-shared";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config, { isServer }: WebpackConfigContext) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        async_hooks: false,
      };
    }
    return config;
  },

  experimental: {},
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
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  swSrc: "public/serviceWorker.js",
});

// Then export the combined configuration
module.exports = withPWA(nextConfig);
