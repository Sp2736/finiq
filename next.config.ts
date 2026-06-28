import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: 'http://localhost:3000/api/:path*'
        // destination: "https://finiqapibeta.kaelivtech.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
