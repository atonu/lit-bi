import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable Turbopack for @prisma/client to avoid async import issues
  serverExternalPackages: ['@prisma/client'],
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
