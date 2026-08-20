import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'react-router-dom': path.resolve(__dirname, 'src/shims/react-router-dom.tsx'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'src/shims/react-router-dom.tsx'),
    }
    return config
  },
  async redirects() {
    return [
      { source: '/simulations', destination: '/recent-simulations', permanent: false },
      { source: '/simulations/new', destination: '/start-simulation', permanent: false },
      { source: '/app', destination: '/dashboard', permanent: false },
    ]
  },
}

export default nextConfig
