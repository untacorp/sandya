"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface SandyaLogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
}

/**
 * Sandya Official Brand Logo Component
 *
 * Filosofi:
 * - Sandhi (Titik Temu & Persambungan): Dua telapak tangan yang ditangkupkan membentuk naungan perlindungan.
 * - Sandhyakala (Fajar di Tengah Krisis): Bukaan lensa/ufuk fajar pembawa harapan di tengah kegelapan bencana.
 * - Adaptif Lapangan: Skalabilitas instan dengan fill="currentColor" yang kontras di light mode maupun dark mode.
 */
export function SandyaLogo({
  size = 28,
  className,
  ...props
}: SandyaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-colors text-primary", className)}
      aria-label="Logo Sandya"
      {...props}
    >
      {/* Kelopak/Naungan Atas: Memayungi & Mengayomi */}
      <path
        d="M10 20C12.8 14.2 18 10 24 10C30 10 35.2 14.2 38 20C33.5 16.8 28.8 15.2 24 15.2C19.2 15.2 14.5 16.8 10 20Z"
        fill="currentColor"
      />

      {/* Kelopak/Penyangga Bawah: Menopang & Menampung */}
      <path
        d="M38 28C35.2 33.8 30 38 24 38C18 38 12.8 33.8 10 28C14.5 31.2 19.2 32.8 24 32.8C28.8 32.8 33.5 31.2 38 28Z"
        fill="currentColor"
      />
    </svg>
  );
}
