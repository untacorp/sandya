"use client";

import * as React from "react";
import { usePathname, useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Tabs } from "@/shared/ui/tabs";

export default function RefugeesTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const { session, refugees } = usePoskoStore();

  const routePoskoId = (params?.poskoId as string) || (pathname.startsWith("/posko/") ? pathname.split("/")[2] : null);
  const poskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  const poskoRefugees = refugees.filter((r) => r.postId === poskoId);

  let activeId = "list";
  if (pathname.includes("/triage")) activeId = "triage";
  else if (pathname.includes("/reunion")) activeId = "reunion";

  return (
  <div className="space-y-4">
    {/* Sub-Navigasi Terpusat */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <Tabs
      items={[
      { id: "list", label: "Daftar Warga", icon: "users", badgeCount: poskoRefugees.length, href: `/posko/${poskoId}/refugees` },
      { id: "triage", label: "Pemeriksaan Medis", icon: "health", href: `/posko/${poskoId}/refugees/triage` },
      { id: "reunion", label: "Pencarian Keluarga", icon: "search", href: `/posko/${poskoId}/refugees/reunion` },
      ]}
      activeId={activeId}
      variant="segmented"
      className="w-full sm:w-auto"
    />

    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted hidden sm:inline">
      Total: <strong>{poskoRefugees.length} Warga</strong>
      </span>
    </div>
    </div>

    {children}
  </div>
  );
}
