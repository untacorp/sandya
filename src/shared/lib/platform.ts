/**
 * Utility pendeteksi platform runtime dan sistem operasi klien.
 * Digunakan untuk isolasi Web vs Tauri dan penyesuaian unduhan rilis.
 */

export type SupportedOS = "windows" | "macos" | "linux" | "android" | "ios" | "unknown";

export interface PlatformDetails {
  os: SupportedOS;
  label: string;
  defaultArchitecture: "x64" | "arm64" | "universal";
  suggestedFileExt: string;
  suggestedFileName: string;
}

/**
 * Cek apakah aplikasi sedang berjalan di dalam container desktop/mobile Tauri.
 */
export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as Record<string, unknown>;
  return Boolean(win.__TAURI_INTERNALS__ || win.__TAURI__);
}

/**
 * Deteksi sistem operasi pengunjung berbasis navigator user-agent / platform.
 */
export function detectClientOS(): SupportedOS {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = (navigator.userAgent || "").toLowerCase();
  const platform = (
    (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    ""
  ).toLowerCase();

  if (/android/i.test(userAgent)) {
    return "android";
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "ios";
  }
  if (/win/i.test(platform) || /windows/i.test(userAgent)) {
    return "windows";
  }
  if (/mac/i.test(platform) || /macintosh|mac os x/i.test(userAgent)) {
    return "macos";
  }
  if (/linux/i.test(platform) || /linux/i.test(userAgent)) {
    return "linux";
  }

  return "unknown";
}

/**
 * Dapatkan detail lengkap platform untuk tombol download cerdas.
 */
export function getPlatformDetails(os: SupportedOS, version = "1.0.0"): PlatformDetails {
  const cleanVer = version.replace(/^v/, "");

  switch (os) {
    case "windows":
      return {
        os: "windows",
        label: "Windows (64-bit)",
        defaultArchitecture: "x64",
        suggestedFileExt: ".exe",
        suggestedFileName: `sandya_${cleanVer}_x64-setup.exe`,
      };
    case "macos":
      return {
        os: "macos",
        label: "macOS (Apple Silicon / Intel)",
        defaultArchitecture: "universal",
        suggestedFileExt: ".dmg",
        suggestedFileName: `sandya_${cleanVer}_universal.dmg`,
      };
    case "linux":
      return {
        os: "linux",
        label: "Linux (AppImage / .deb)",
        defaultArchitecture: "x64",
        suggestedFileExt: ".AppImage",
        suggestedFileName: `sandya_${cleanVer}_amd64.AppImage`,
      };
    case "android":
      return {
        os: "android",
        label: "Android (APK)",
        defaultArchitecture: "arm64",
        suggestedFileExt: ".apk",
        suggestedFileName: `sandya_${cleanVer}.apk`,
      };
    case "ios":
      return {
        os: "ios",
        label: "iOS (Bundle App / IPA)",
        defaultArchitecture: "arm64",
        suggestedFileExt: ".zip",
        suggestedFileName: `sandya_${cleanVer}_ios.zip`,
      };
    default:
      return {
        os: "unknown",
        label: "Pilih Sistem Operasi",
        defaultArchitecture: "x64",
        suggestedFileExt: ".AppImage",
        suggestedFileName: `sandya_${cleanVer}_amd64.AppImage`,
      };
  }
}
