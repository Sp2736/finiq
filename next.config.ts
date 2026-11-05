import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/finiq",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
