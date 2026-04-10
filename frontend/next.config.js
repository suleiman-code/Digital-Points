/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Vercel build should not fail on lint warnings.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
