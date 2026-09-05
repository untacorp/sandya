import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
  name: "Sandya — Platform Siaga Tanggap Darurat Bencana",
  short_name: "Sandya",
  description:
  "Sistem operasi penanganan bencana offline-first untuk pendataan warga, logistik gudang posko, triase medis, dan komunikasi mesh.",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#0f172a",
  orientation: "portrait-primary",
  icons: [
  {
  src: "/icon-192.png",
  sizes: "192x192",
  type: "image/png",
  },
  {
  src: "/icon-512.png",
  sizes: "512x512",
  type: "image/png",
  },
  ],
  categories: ["utilities", "medical", "productivity"],
  };
}
