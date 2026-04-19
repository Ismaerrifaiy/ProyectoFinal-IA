import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // face-api.js solo corre en el cliente — excluirlo del bundle del servidor
  serverExternalPackages: ['face-api.js', '@tensorflow/tfjs-node'],

  // Configuración de Turbopack (Next.js 16+)
  turbopack: {
    resolveAlias: {
      canvas: { browser: './src/lib/canvas-mock.ts' },
    },
  },
};

export default nextConfig;
