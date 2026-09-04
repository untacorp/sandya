import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  // Static HTML export is conditional for Tauri build or standalone server
  output: process.env.TAURI_ENV_PLATFORM || process.env.NEXT_EXPORT === "true" ? "export" : undefined,
  // Next.js Image Optimization requires a server, so we disable it for static export
  images: {
    unoptimized: true,
  },
  // Optional: assetPrefix if needed when loading local files in dev/prod
};

export default nextConfig;

