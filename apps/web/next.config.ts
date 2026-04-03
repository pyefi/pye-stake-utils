import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["pye-stake-utils"],
  turbopack: {},
};

export default nextConfig;
