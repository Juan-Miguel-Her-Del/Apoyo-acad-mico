import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  ...(process.env.APOYO_TEST_DIST_DIR ? { distDir: process.env.APOYO_TEST_DIST_DIR } : {}),
};

export default nextConfig;
