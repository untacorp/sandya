"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { type Posko } from "@/shared/types";
import { DashboardCharts } from "./dashboard-charts";
import { getRoleBadgeLabel } from "@/features/auth/utils/role-routing";

export default function PoskoDashboardPage() {
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const { session, poskos, refugees, inventory, peers } = usePoskoStore();

  const effectivePoskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));
  const matchedPosko = poskos.find((p) => p.id === effectivePoskoId);

  const poskoRefugees = refugees.filter((r) => r.postId === effectivePoskoId);
  const poskoInventory = inventory.filter((i) => i.postId === effectivePoskoId);

  const currentPosko: Posko = matchedPosko || {
    id: effectivePoskoId,
    orgId: session.orgId || "ORG-01",
    missionId: session.missionId || "MSN-01",
    name: session.poskoName || `Posko ${effectivePoskoId}`,
    postType: "FIELD_SHELTER",
    status: "OPERATIONAL_NORMAL",
    capacity: 500,
    currentRefugees: poskoRefugees.length,
    locationName: "Area Operasi Lapangan",
    createdAt: 1740000000000,
  };

  const totalRefugees = poskoRefugees.length;
  const balitaCount = poskoRefugees.filter((r) => r.vulnerabilities.includes("BALITA")).length;
  const bumilCount = poskoRefugees.filter((r) => r.vulnerabilities.includes("IBU_HAMIL")).length;
  const lansiaCount = poskoRefugees.filter((r) => r.vulnerabilities.includes("LANSIA")).length;
  const disabilitasCount = poskoRefugees.filter((r) => r.vulnerabilities.includes("DISABILITAS")).length;

  const redTriage = poskoRefugees.filter((r) => r.triageStatus === "RED").length;
  const yellowTriage = poskoRefugees.filter((r) => r.triageStatus === "YELLOW").length;
  const greenTriage = poskoRefugees.filter((r) => r.triageStatus === "GREEN" || !r.triageStatus).length;
  const blackTriage = poskoRefugees.filter((r) => r.triageStatus === "BLACK").length;

  const uniqueShelters = new Set(poskoRefugees.map((r) => r.shelterLocation)).size;
  const capacity = currentPosko.capacity || 500;
  const occupancyPercent = Math.min(100, Math.round((totalRefugees / capacity) * 100));

  // Critical inventory items (burn rate <= 1 day) for this posko
  const criticalItems = poskoInventory.filter((i) => i.burnRateDays <= 1 || i.currentQuantity <= 10);

  return (
  <div className="space-y-4">
  {/* 1. Header Ringkas Posko */}
  <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
  <div>
  <h1 className="text-lg font-bold text-text-main">
  {currentPosko.name}
  </h1>
  <p className="text-xs text-text-muted mt-0.5">
  {uniqueShelters > 0 ? `${uniqueShelters} Area Hunian • ` : ""}{totalRefugees} Jiwa Terdaftar
  </p>
  </div>

  {/* Tombol Aksi Cepat */}
  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto">
  <Link href={`/posko/${effectivePoskoId}/refugees`} className="flex-1 sm:flex-initial">
  <Button variant="primary" size="sm" icon="users" iconVariant="bold" className="w-full sm:w-auto justify-center">
  Lihat Daftar Warga
  </Button>
  </Link>
  <Link href={`/posko/${effectivePoskoId}/logistics`} className="flex-1 sm:flex-initial">
  <Button variant="secondary" size="sm" icon="box" iconVariant="bold" className="w-full sm:w-auto justify-center">
  Stok Barang
  </Button>
  </Link>
  </div>
  </div>

  {/* 2. Peringatan Stok Menipis (Hanya Muncul Jika Ada) */}
  {criticalItems.length > 0 && (
  <div className="p-3 rounded-lg bg-status-danger-bg/40 border border-status-danger-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
  <div className="flex items-center gap-2.5 text-xs">
  <Icon name="sos" variant="bold" size={16} className="text-status-danger shrink-0" />
  <p className="text-text-main">
  Stok <strong>{criticalItems[0].itemName}</strong> tersisa{" "}
  <span className="font-bold text-status-danger">
  {criticalItems[0].currentQuantity} {criticalItems[0].unit}
  </span>{" "}
  (diprediksi habis dalam hitungan jam).
  </p>
  </div>
  <Link href={`/posko/${effectivePoskoId}/logistics`} className="shrink-0">
  <Button variant="danger" size="sm">
  Minta Tambahan Stok
  </Button>
  </Link>
  </div>
  )}

  {/* 3. Visualisasi Grafik Utama Ringkasan Posko */}
  <DashboardCharts
    effectivePoskoId={effectivePoskoId}
    totalRefugees={totalRefugees}
    capacity={capacity}
    occupancyPercent={occupancyPercent}
    redTriage={redTriage}
    yellowTriage={yellowTriage}
    greenTriage={greenTriage}
    blackTriage={blackTriage}
    balitaCount={balitaCount}
    bumilCount={bumilCount}
    lansiaCount={lansiaCount}
    disabilitasCount={disabilitasCount}
  />

  {/* 4. Dua Panel Informasi Ringkas */}
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
  {/* Panel Kiri: Ketersediaan Stok Logistik (7 Kolom) */}
  <div className="md:col-span-7 p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-3">
  <div className="flex items-center justify-between">
  <h2 className="text-xs font-bold uppercase tracking-wider text-text-main">
  Stok Bantuan di Posko
  </h2>
  <Link href={`/posko/${effectivePoskoId}/logistics`}>
  <span className="text-xs text-primary font-semibold hover:underline">
  Kelola Semua Stok
  </span>
  </Link>
  </div>

    <div className="divide-y divide-border text-xs">
      {poskoInventory.length === 0 ? (
        <div className="py-6 text-center text-xs text-text-subtle">
          Belum ada data stok bantuan di posko ini.
        </div>
      ) : (
        poskoInventory.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
          >
            <div>
              <p className="font-semibold text-text-main">{item.itemName}</p>
              <p className="text-[11px] text-text-muted">
                Estimasi cukup untuk ~{item.burnRateDays} hari
              </p>
            </div>
            <div className="text-right">
              <span className="font-bold text-text-main text-sm">
                {item.currentQuantity} {item.unit}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>

  {/* Panel Kanan: Petugas Terhubung di Sekitar (5 Kolom) */}
  <div className="md:col-span-5 p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-status-safe" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-main">
          Petugas di Sekitar ({peers.length})
        </h2>
      </div>
      <Link href={`/posko/${effectivePoskoId}/tactical`}>
        <span className="text-xs text-primary font-semibold hover:underline">
          Buka Obrolan
        </span>
      </Link>
    </div>

    <div className="divide-y divide-border text-xs">
      {peers.length === 0 ? (
        <div className="py-6 text-center text-xs text-text-subtle">
          Belum ada petugas lain yang terdeteksi di sekitar.
        </div>
      ) : (
        peers.map((peer) => (
          <div
            key={peer.peerId}
            className="py-2.5 flex items-center justify-between gap-2 first:pt-0 last:pb-0"
          >
            <div>
              <span className="font-semibold text-text-main block">
                {peer.aliasName}
              </span>
              <span className="text-[11px] text-text-muted">
                {getRoleBadgeLabel(peer.role)}
              </span>
            </div>
            <span className="text-[11px] text-text-muted">
              Terhubung
            </span>
          </div>
        ))
      )}
    </div>
  </div>
  </div>
  </div>
  );
}
