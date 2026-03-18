import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'grundfospumpepood.vercel.app' }],
        destination: 'https://ipumps.outline.ee/:path*',
        permanent: false,
      },
    ]
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avfvouczlgbtrhtqgokx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Alias 'next-intl/config' → i18n/request.ts so next-intl server internals
  // (getFormats, getTimeZone, getConfigNow) can read the i18n request config.
  // This replicates the only essential thing createNextIntlPlugin does, without
  // the plugin wrapper that was causing Vercel build failures.
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',
    },
  },
  webpack(config) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(config.resolve as any).alias['next-intl/config'] = path.resolve(
      process.cwd(),
      'i18n/request.ts'
    )
    return config
  },
}

export default nextConfig
