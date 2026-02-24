/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Optimize webpack cache to handle large JSON files
    config.cache = {
      ...config.cache,
      compression: 'gzip',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }

    // Exclude large schema files from webpack processing
    config.module.rules.push({
      test: /schema\.json$/,
      type: 'json',
      parser: {
        parse: JSON.parse,
      },
    })

    return config
  },
}

export default nextConfig
