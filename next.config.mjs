/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ik.imagekit.io'],
  },
  // Allow wildcard subdomain routing
  async rewrites() {
    return [];
  },
};

export default nextConfig;
