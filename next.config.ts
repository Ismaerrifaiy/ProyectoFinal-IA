import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // face-api.js y @tensorflow/tfjs son módulos CommonJS que necesitan transpilación
  transpilePackages: ['face-api.js'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // No intentar procesar face-api.js en el servidor
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'face-api.js']
    }
    // face-api.js necesita canvas en el servidor — lo ignoramos
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    return config
  },
};

export default nextConfig;
