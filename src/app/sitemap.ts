import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sandya.id";
  const now = new Date();

  return [
  {
  url: `${baseUrl}`,
  lastModified: now,
  changeFrequency: "daily",
  priority: 1.0,
  },
  {
  url: `${baseUrl}/guest`,
  lastModified: now,
  changeFrequency: "hourly",
  priority: 0.9,
  },
  {
  url: `${baseUrl}/activate`,
  lastModified: now,
  changeFrequency: "monthly",
  priority: 0.8,
  },
  {
  url: `${baseUrl}/org`,
  lastModified: now,
  changeFrequency: "daily",
  priority: 0.8,
  },
  ];
}
