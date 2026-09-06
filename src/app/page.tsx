"use client";

import * as React from "react";
import { isTauriRuntime } from "@/shared/lib/platform";
import { LandingGatewayPage } from "@/features/auth/components/landing-gateway-page";
import { WebLandingPage } from "@/features/landing/components/web-landing-page";

const emptySubscribe = () => () => {};
const isCompileTimeTauri = process.env.TAURI_BUILD === "true";

export default function RootPage() {
  const isTauri = React.useSyncExternalStore(
    emptySubscribe,
    () => isCompileTimeTauri || isTauriRuntime(),
    () => isCompileTimeTauri
  );

  // Di dalam container native Tauri, tampilkan langsung gerbang operasional posko
  if (isTauri) {
    return <LandingGatewayPage />;
  }

  // Di peramban web biasa, tampilkan Web Landing Page mandiri
  return <WebLandingPage />;
}
