/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {}, // Linha adicionada para habilitar o motor novo sem conflito
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce infrastructure log noise in dev mode
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: "error",
      };
    }
    return config;
  },
};

export default nextConfig;
