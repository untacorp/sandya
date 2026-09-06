"use client";

import * as React from "react";
import QRCode from "qrcode";

export const QR_SVG_CONSTANTS = {
  DEFAULT_SIZE: 200,
  MARGIN_INCLUDED: 2,
  MARGIN_ZERO: 0,
} as const;

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

export function QRCodeSVG({
  value,
  size = QR_SVG_CONSTANTS.DEFAULT_SIZE,
  className = "",
  level = "M",
  includeMargin = true,
}: QRCodeSVGProps) {
  const [svgString, setSvgString] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    if (!value) {
      queueMicrotask(() => {
        if (isMounted) setSvgString("");
      });
      return () => {
        isMounted = false;
      };
    }
  QRCode.toString(value, {
  type: "svg",
  errorCorrectionLevel: level,
  margin: includeMargin ? QR_SVG_CONSTANTS.MARGIN_INCLUDED : QR_SVG_CONSTANTS.MARGIN_ZERO,
  width: size,
  color: {
  dark: "#0F172A", // Slate 900
  light: "#FFFFFF",
  },
  })
  .then((svg) => {
  if (isMounted) {
  setSvgString(svg);
  setError(null);
  }
  })
  .catch((err) => {
  if (isMounted) {
  setError(err.message || "Gagal menghasilkan QR Code");
  }
  });

  return () => {
  isMounted = false;
  };
  }, [value, size, level, includeMargin]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center max-w-full p-4 rounded-lg bg-status-danger-bg text-status-danger border border-status-danger-border text-xs text-center ${className}`}
        style={{ width: size, maxWidth: "100%", height: size }}
      >
        <span>Error QR: {error}</span>
      </div>
    );
  }

  if (!svgString) {
    return (
      <div
        className={`flex items-center justify-center max-w-full p-4 rounded-lg bg-surface-subtle border border-border animate-pulse ${className}`}
        style={{ width: size, maxWidth: "100%", height: size }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`inline-block max-w-full overflow-hidden rounded-lg bg-white p-1 border border-border shadow-2xs [&>svg]:max-w-full [&>svg]:h-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
