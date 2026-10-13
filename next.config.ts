import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/k-station-lab",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
