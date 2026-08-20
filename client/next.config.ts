import type { NextConfig } from 'next'
import path from 'path'

/** Static export only for production builds (Firebase). Dev must not use `output: 'export'` — it breaks `next dev`. */
const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' as const } : {}),
  images: { unoptimized: true },
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
}

export default nextConfig
