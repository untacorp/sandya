"use client";

import * as React from "react";
import { usePathname, useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Tabs } from "@/shared/ui/tabs";

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const { session, needsTickets, missionWaybills } = usePoskoStore();

  const routePoskoId = (params?.poskoId as string) || (pathname.startsWith("/posko/") ? pathname.split("/")[2] : null);
  const poskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  let activeId = "stock";
  if (pathname.includes("/distribute")) activeId = "distribute";
  else if (pathname.includes("/waybills")) activeId = "waybills";

  const pendingTickets = needsTickets.filter((t) => t.status === "PENDING" || t.status === "ALLOCATED");
  const inTransitWaybills = missionWaybills.filter((w) => w.status === "IN_TRANSIT");

  return (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <Tabs
      items={[
      { id: "stock", label: "Stok Gudang", icon: "box", href: `/posko/${poskoId}/logistics` },
      { id: "distribute", label: "Distribusi Bantuan", icon: "delivery", badgeCount: pendingTickets.length, href: `/posko/${poskoId}/logistics/distribute` },
      { id: "waybills", label: "Surat Jalan Antar-Posko", icon: "waybill", badgeCount: inTransitWaybills.length, href: `/posko/${poskoId}/logistics/waybills` },
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
