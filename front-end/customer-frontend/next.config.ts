import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.33.1', 'localhost'],
  transpilePackages: ['three'],
  devIndicators: false,
};

export default nextConfig;
