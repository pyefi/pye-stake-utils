import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["pye-stake-utils"],
  turbopack: {},
  experimental: {
    nodeMiddleware: true,
  },
};

export default nextConfig;
