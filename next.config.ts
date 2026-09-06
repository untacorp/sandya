import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isStaticExport = isProd && (process.env.NEXT_EXPORT === "true" || process.env.TAURI_BUILD === "true");

const nextConfig: NextConfig = {
  // Static HTML export is used only when explicitly requested in production build
  output: isStaticExport ? "export" : undefined,
  // Next.js Image Optimization requires a server, so we disable it for static export
  images: {
    unoptimized: true,
  },
  // Izinkan origin dev dari ngrok dan IP lokal
  allowedDevOrigins: [
    "192.168.101.15",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
