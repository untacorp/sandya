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
  <body className="min-h-screen bg-neutral-100 text-neutral-900 flex items-center justify-center p-4 font-sans">
  <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-neutral-200 shadow-md text-center space-y-4">
  <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl">
  !
  </div>
  <h2 className="text-base font-bold">Terjadi Kendala Sistem Utama</h2>
  <p className="text-xs text-neutral-500">
  Aplikasi mengalami kendala fatal. Silakan muat ulang untuk menginisialisasi ulang antarmuka.
  </p>
  <div className="pt-2">
  <button
  onClick={() => reset()}
  className="w-full py-2.5 px-4 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-colors"
  >
  Muat Ulang Aplikasi
  </button>
  </div>
  </div>
  </body>
  </html>
  );
}
