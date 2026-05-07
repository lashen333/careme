/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: { buildActivity: false, appIsrStatus: false },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig
