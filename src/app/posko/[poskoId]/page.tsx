"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export default function PoskoDashboardPage() {
  const { session, refugees, inventory, peers } = usePoskoStore();

  const totalRefugees = refugees.length + 508;
  const balitaCount = refugees.filter((r) => r.vulnerabilities.includes("BALITA")).length + 42;
  const bumilCount = refugees.filter((r) => r.vulnerabilities.includes("IBU_HAMIL")).length + 18;
  const lansiaCount = refugees.filter((r) => r.vulnerabilities.includes("LANSIA")).length + 31;
  const disabilitasCount = refugees.filter((r) => r.vulnerabilities.includes("DISABILITAS")).length + 6;

  const redTriage = refugees.filter((r) => r.triageStatus === "RED").length + 3;
  const yellowTriage = refugees.filter((r) => r.triageStatus === "YELLOW").length + 12;

  // Critical inventory items (burn rate <= 1 day)
  const criticalItems = inventory.filter((i) => i.burnRateDays <= 1 || i.currentQuantity <= 10);

  return (
    <div className="space-y-4">
      {/* 1. Header Ringkas Posko */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main">
              {session.poskoName}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-status-safe-bg text-status-safe border border-status-safe-border">
              Aktif
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            128 Kepala Keluarga • {totalRefugees} Jiwa Terdaftar
          </p>
        </div>

        {/* Tombol Aksi Cepat */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/posko/${session.poskoId}/refugees`}>
            <Button variant="primary" size="sm" icon="users" iconVariant="bold">
              Lihat Daftar Warga
            </Button>
          </Link>
          <Link href={`/posko/${session.poskoId}/logistics`}>
            <Button variant="secondary" size="sm" icon="box" iconVariant="bold">
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
          <Link href={`/posko/${session.poskoId}/logistics`} className="shrink-0">
            <Button variant="danger" size="sm">
              Minta Tambahan Stok
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Tiga Kartu Ringkasan Utama (Spasi Rasional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Warga */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Total Warga Terdata</span>
            <Icon name="users" variant="linear" size={18} />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-bold text-text-main tracking-tight">
              {totalRefugees}
            </span>
            <span className="text-xs text-text-muted">Jiwa</span>
          </div>
          <p className="text-[11px] text-text-muted">
            Kapasitas tenda terisi ~85%
          </p>
        </div>

        {/* Pemeriksaan Kesehatan */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Pemeriksaan Kesehatan</span>
            <Icon name="health" variant="linear" size={18} className="text-status-danger" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-status-danger">
              {redTriage}
            </span>
            <span className="text-xs text-status-danger font-medium">Perlu Segera</span>
            <span className="text-lg font-semibold text-status-warning ml-1">
              {yellowTriage}
            </span>
            <span className="text-xs text-status-warning font-medium">Rawat Jalan</span>
          </div>
          <p className="text-[11px] text-text-muted">
            <Link href={`/posko/${session.poskoId}/refugees/triage`} className="text-primary hover:underline">
              Buka menu pemeriksaan medis &rarr;
            </Link>
          </p>
        </div>

        {/* Kelompok Rentan */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold">Kelompok Rentan</span>
            <Icon name="health" variant="linear" size={18} className="text-status-warning" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-bold text-text-main">
              {balitaCount + bumilCount + lansiaCount + disabilitasCount}
            </span>
            <span className="text-xs text-text-muted">Orang Prioritas</span>
          </div>
          <p className="text-[11px] text-text-muted truncate">
            {balitaCount} Balita • {bumilCount} Bumil • {lansiaCount} Lansia
          </p>
        </div>
      </div>

      {/* 4. Dua Panel Informasi Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Panel Kiri: Ketersediaan Stok Logistik (7 Kolom) */}
        <div className="md:col-span-7 p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-main">
              Stok Bantuan di Posko
            </h2>
            <Link href={`/posko/${session.poskoId}/logistics`}>
              <span className="text-xs text-primary font-semibold hover:underline">
                Kelola Semua Stok
              </span>
            </Link>
          </div>

          <div className="divide-y divide-border text-xs">
            {inventory.slice(0, 4).map((item) => (
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
            ))}
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
            <Link href={`/posko/${session.poskoId}/tactical`}>
              <span className="text-xs text-primary font-semibold hover:underline">
                Buka Obrolan
              </span>
            </Link>
          </div>

          <div className="divide-y divide-border text-xs">
            {peers.map((peer) => (
              <div
                key={peer.peerId}
                className="py-2.5 flex items-center justify-between gap-2 first:pt-0 last:pb-0"
              >
                <div>
                  <span className="font-semibold text-text-main block">
                    {peer.aliasName}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {peer.role.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted">
                  Terhubung
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
