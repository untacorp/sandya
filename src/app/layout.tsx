import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sandya.id"),
  title: {
  default: "Sandya — Platform Siaga Tanggap Darurat Bencana Mandiri",
  template: "%s | Sandya",
  },
  description:
  "Platform operasi tanggap darurat bencana offline-first untuk pendataan pengungsi, triase medis lapangan, logistik gudang posko, temu keluarga terpisah, dan komunikasi taktis PTT.",
  applicationName: "Sandya",
  authors: [{ name: "Sandya Humanitarian Project", url: "https://sandya.id" }],
  creator: "Sandya Humanitarian Project",
  publisher: "Sandya Humanitarian Project",
  generator: "Next.js",
  keywords: [
  "Sandya",
  "tanggap bencana",
  "posko pengungsi",
  "triase medis START",
  "logistik bencana",
  "reuni keluarga terpisah",
  "offline first",
  "disaster recovery",
  "humanitarian aid",
  "BLE mesh",
  "ICRC RFL",
  "emergency management",
  ],
  manifest: "/manifest.webmanifest",
  category: "Humanitarian / Disaster Management",
  appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "Sandya",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  formatDetection: {
  telephone: true,
  date: true,
  address: true,
  email: true,
  url: true,
  },
  openGraph: {
  title: "Sandya — Platform Siaga Tanggap Darurat Bencana Mandiri",
  description:
  "Sistem komando dan koordinasi penanganan pengungsi, logistik posko, dan triase medis lapangan dengan ketahanan 100% offline.",
  url: "https://sandya.id",
  siteName: "Sandya",
  locale: "id_ID",
  type: "website",
  },
  twitter: {
  card: "summary_large_image",
  title: "Sandya — Platform Siaga Tanggap Darurat Bencana Mandiri",
  description:
  "Sistem koordinasi penanganan pengungsi, logistik posko, dan triase medis lapangan offline-first.",
  creator: "@sandyaproject",
  },
  robots: {
  index: true,
  follow: true,
  googleBot: {
  index: true,
  follow: true,
  "max-video-preview": -1,
  "max-image-preview": "large",
  "max-snippet": -1,
  },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html
  lang="id"
  className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
  >
  <body className="min-h-[100dvh] flex flex-col bg-canvas text-text-main font-sans">{children}</body>
  </html>
  );
}
