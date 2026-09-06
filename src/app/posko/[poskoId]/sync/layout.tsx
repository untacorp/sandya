"use client";

import * as React from "react";
import { usePathname, useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Tabs } from "@/shared/ui/tabs";

export default function SyncLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const { session } = usePoskoStore();

  const routePoskoId = (params?.poskoId as string) || (pathname.startsWith("/posko/") ? pathname.split("/")[2] : null);
  const poskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  let activeId = "hub";
  if (pathname.includes("/animated-qr")) activeId = "animated";
  else if (pathname.includes("/poster")) activeId = "poster";

  return (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
    <Tabs
      items={[
      { id: "hub", label: "Pusat Data", icon: "sync", href: `/posko/${poskoId}/sync` },
      { id: "animated", label: "Pindai Layar HP", icon: "qr-code", href: `/posko/${poskoId}/sync/animated-qr` },
      { id: "poster", label: "Cetak Berkas QR", icon: "printer", href: `/posko/${poskoId}/sync/poster` },
      ]}
      activeId={activeId}
      variant="segmented"
      className="w-full sm:w-auto"
    />
    </div>

    {children}
  </div>
  );
}
