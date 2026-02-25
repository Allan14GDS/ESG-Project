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
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [import.meta.url],
        },
        compression: false,
        maxMemoryGenerations: 1,
      }
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: "error",
      }
    }
    return config
  },
}

export default nextConfig
