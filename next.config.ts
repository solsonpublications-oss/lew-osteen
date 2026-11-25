import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai"],
};

export default nextConfig;
