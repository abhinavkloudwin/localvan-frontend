import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  "devIndicators":false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localvan.s3.ap-southeast-2.amazonaws.com",
        pathname: "/vehicle-images/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
