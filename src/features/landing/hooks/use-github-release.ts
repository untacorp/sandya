"use client";

import * as React from "react";
import { type SupportedOS, getPlatformDetails } from "@/shared/lib/platform";

export interface GitHubAsset {
  name: string;
  downloadUrl: string;
  sizeBytes: number;
}

export interface ReleaseInfo {
  version: string;
  publishedDate: string;
  releaseUrl: string;
  releaseNotes: string;
  assets: GitHubAsset[];
  isFallback: boolean;
  isLoading: boolean;
}

const GITHUB_REPO = "untacorp/sandya";
const CACHE_KEY = "sandya_github_release_cache";
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 menit

export function useGitHubRelease(): ReleaseInfo & {
  getAssetForOS: (os: SupportedOS) => { downloadUrl: string; fileName: string; isDirect: boolean };
} {
  const [releaseInfo, setReleaseInfo] = React.useState<ReleaseInfo>({
    version: "v0.1.0-alpha.1",
    publishedDate: "September 2026",
    releaseUrl: `https://github.com/${GITHUB_REPO}/releases`,
    releaseNotes: "Rilis stabil sistem operasi posko darurat mandiri (offline-first & BLE mesh).",
    assets: [],
    isFallback: true,
    isLoading: true,
  });

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchLatestRelease() {
      // 1. Cek local session cache
      try {
        const cachedRaw = sessionStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            if (!isCancelled) {
              setReleaseInfo({ ...cached.data, isLoading: false });
              return;
            }
          }
        }
      } catch {
        // Abaikan error session storage
      }

      // 2. Fetch ke GitHub API
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!res.ok) {
          // Jika 404 (belum ada rilis tagged) atau rate limited, fallback aman
          if (!isCancelled) {
            setReleaseInfo((prev) => ({ ...prev, isLoading: false }));
          }
          return;
        }

        const data = await res.json();
        const assets: GitHubAsset[] = (data.assets || []).map(
          (item: { name?: string; browser_download_url?: string; size?: number }) => ({
            name: item.name || "",
            downloadUrl: item.browser_download_url || "",
            sizeBytes: item.size || 0,
          })
        );

        const formattedDate = data.published_at
          ? new Date(data.published_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "September 2026";

        const parsedInfo: ReleaseInfo = {
          version: data.tag_name || "v1.0.0",
          publishedDate: formattedDate,
          releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
          releaseNotes: data.body || "Rilis stabil operasional lapangan.",
          assets,
          isFallback: assets.length === 0,
          isLoading: false,
        };

        if (!isCancelled) {
          setReleaseInfo(parsedInfo);
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: parsedInfo })
            );
          } catch {
            // Abaikan error session storage
          }
        }
      } catch {
        if (!isCancelled) {
          setReleaseInfo((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    fetchLatestRelease();

    return () => {
      isCancelled = true;
    };
  }, []);

  const getAssetForOS = React.useCallback(
    (os: SupportedOS) => {
      const details = getPlatformDetails(os, releaseInfo.version);

      // Cari di daftar real assets GitHub jika ada
      if (releaseInfo.assets.length > 0) {
        let matched: GitHubAsset | undefined;
        if (os === "windows") {
          matched = releaseInfo.assets.find((a) => a.name.endsWith(".exe") || a.name.endsWith(".msi"));
        } else if (os === "macos") {
          matched = releaseInfo.assets.find((a) => a.name.endsWith(".dmg"));
        } else if (os === "linux") {
          matched = releaseInfo.assets.find((a) => a.name.endsWith(".AppImage") || a.name.endsWith(".deb"));
        } else if (os === "android") {
          matched = releaseInfo.assets.find((a) => a.name.endsWith(".apk"));
        } else if (os === "ios") {
          matched = releaseInfo.assets.find((a) => a.name.endsWith(".ipa") || a.name.includes("ios"));
        }

        if (matched) {
          return {
            downloadUrl: matched.downloadUrl,
            fileName: matched.name,
            isDirect: true,
          };
        }
      }

      // Fallback: Arahkan ke halaman release resmi GitHub
      return {
        downloadUrl: releaseInfo.releaseUrl,
        fileName: details.suggestedFileName,
        isDirect: false,
      };
    },
    [releaseInfo]
  );

  return {
    ...releaseInfo,
    getAssetForOS,
  };
}
