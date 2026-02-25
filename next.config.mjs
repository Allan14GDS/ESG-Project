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
      // Suppress the "Serializing big strings" warning by raising the threshold
      // and reducing infrastructure log noise
      config.cache = {
        ...config.cache,
        type: "memory",
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
