"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
  <html lang="id">
  <body className="min-h-screen bg-canvas text-text-main flex items-center justify-center p-4 font-sans">
  <div className="max-w-md w-full p-6 bg-surface rounded-2xl border-[1.5px] border-border shadow-md text-center space-y-4">
  <div className="w-12 h-12 mx-auto rounded-full bg-status-danger-bg text-status-danger border border-status-danger-border flex items-center justify-center font-bold text-xl">
  !
  </div>
  <h2 className="text-base font-bold text-text-main">Terjadi Kendala Sistem Utama</h2>
  <p className="text-xs text-text-muted">
  Aplikasi mendeteksi kendala pada state runtime. Silakan muat ulang untuk menginisialisasi ulang sistem offline.
  </p>
  {error?.digest && (
  <p className="text-[10px] font-mono text-text-subtle">ID Digest: {error.digest}</p>
  )}
  <div className="pt-2">
  <button
  onClick={() => reset()}
  className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
  >
  Muat Ulang Aplikasi
  </button>
  </div>
  </div>
  </body>
  </html>
  );
}
