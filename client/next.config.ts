import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable Turbopack for @prisma/client to avoid async import issues
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
