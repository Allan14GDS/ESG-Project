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
      // Reduce infrastructure log noise in dev mode
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: "error",
      }
    }
    return config
  },
}

export default nextConfig
