import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ["rylsports.lobocrea.pro"] } },
};

export default nextConfig;
