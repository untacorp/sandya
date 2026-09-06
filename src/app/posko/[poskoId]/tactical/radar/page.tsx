"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useMeshSync } from "@/features/posko/hooks/use-mesh-sync";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { AlertBanner } from "@/shared/ui/alert-banner";

export const RADAR_CONSTANTS = {
  RSSI_VERY_CLOSE_THRESHOLD: -50,
  RSSI_CLOSE_THRESHOLD: -70,
  RSSI_MEDIUM_THRESHOLD: -85,
  DIRECT_HOP_COUNT: 1,
} as const;

export default function MeshRadarPage() {
  const { session, peers } = usePoskoStore();
  const { meshRadioStatus, isMeshActive, setIsMeshActive } = useMeshSync();

  const getProximityStatus = (rssi: number, hops: number) => {
  if (rssi >= RADAR_CONSTANTS.RSSI_VERY_CLOSE_THRESHOLD) {
  return {
  label: "Sangat Dekat (< 15m)",
  color: "text-status-safe",
  bgBadge: "bg-status-safe-bg text-status-safe border-status-safe-border",
  hopDesc: "Koneksi Langsung (1 Hop)",
  };
  }
  if (rssi >= RADAR_CONSTANTS.RSSI_CLOSE_THRESHOLD) {
  return {
  label: "Dekat (15-50m)",
  color: "text-status-safe",
  bgBadge: "bg-status-safe-bg text-status-safe border-status-safe-border",
  hopDesc: hops === RADAR_CONSTANTS.DIRECT_HOP_COUNT ? "Koneksi Langsung (1 Hop)" : `Relay Mesh (${hops} Hops)`,
  };
  }
  if (rssi >= RADAR_CONSTANTS.RSSI_MEDIUM_THRESHOLD) {
  return {
  label: "Jarak Sedang",
  color: "text-status-warning",
  bgBadge: "bg-status-warning-bg text-status-warning border-status-warning-border",
  hopDesc: `Relay Mesh (${hops} Hops)`,
  };
  }
  return {
  label: "Jarak Jauh / Sinyal Lemah",
  color: "text-status-danger",
  bgBadge: "bg-status-danger-bg text-status-danger border-status-danger-border",
  hopDesc: `Relay Mesh (${hops} Hops)`,
  };
  };

  return (
  <div className="space-y-4">
  {/* Top Header */}
  <div className="flex items-center justify-between">
  <Link href={`/posko/${session.poskoId}/tactical`}>
  <Button variant="secondary" size="sm" className="font-bold">
  <Icon name="arrow-left" variant="linear" size={14} className="mr-1" />
  Kembali ke Radio HT Posko
  </Button>
  </Link>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setIsMeshActive(!isMeshActive)}
      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-colors cursor-pointer"
    >
      Bluetooth: <span className={isMeshActive ? "text-status-safe font-bold" : "text-status-danger font-bold"}>{isMeshActive ? "ON" : "OFF"}</span>
    </button>
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border shadow-2xs text-xs font-bold text-text-main">
      <span className={`w-2 h-2 rounded-full ${
        meshRadioStatus === "RADIO_OFF" || meshRadioStatus === "UNAVAILABLE"
          ? "bg-status-danger"
          : meshRadioStatus === "SCANNING"
          ? "bg-status-warning animate-ping"
          : "bg-status-safe animate-pulse"
      }`} />
      <span>
        {meshRadioStatus === "RADIO_OFF"
          ? "Radio BLE Mati"
          : meshRadioStatus === "UNAVAILABLE"
          ? "Radio Tidak Tersedia"
          : `${peers.length} Petugas Terhubung`}
      </span>
    </div>
  </div>
  </div>

  {/* Radio Fallback Banner if BLE is Off / Unavailable */}
  {(meshRadioStatus === "RADIO_OFF" || meshRadioStatus === "UNAVAILABLE") && (
    <div className="space-y-2">
      <AlertBanner
        variant="warning"
        title="Modul Bluetooth Rendah Energi (BLE) Dinonaktifkan"
        description="Jaringan radar mesh nirkabel tidak aktif. Anda tetap dapat melakukan sinkronisasi data antar-posko nir-internet secara visual menggunakan Animated QR atau Poster Paritas Cetak."
        icon="shield"
      />
      <div className="flex flex-wrap gap-2 pt-1">
        <Link href={`/posko/${session.poskoId}/sync/animated-qr`}>
          <Button variant="secondary" size="sm" className="text-xs font-bold">
            <Icon name="qr-code" variant="bold" size={14} className="mr-1.5" />
            Buka Sinkronisasi Animated QR
          </Button>
        </Link>
        <Link href={`/posko/${session.poskoId}/sync/poster`}>
          <Button variant="secondary" size="sm" className="text-xs font-bold">
            <Icon name="printer" variant="bold" size={14} className="mr-1.5" />
            Buka Poster Paritas Cetak
          </Button>
        </Link>
      </div>
    </div>
  )}

  {/* Topologi Card */}
  <Card className="shadow-2xs">
  <CardHeader>
  <CardTitle className="text-sm flex items-center justify-between">
  <span className="flex items-center gap-1.5">
  <Icon name="radar" variant="bold" size={16} className="text-primary" />
  Status Jaring Komunikasi Nirkabel Lapangan (BLE Mesh)
  </span>
  </CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  Perangkat petugas yang saling terhubung secara otomatis di sekitar posko tanpa internet.
  </p>
  </CardHeader>
  <CardContent className="space-y-3">
  <div className="p-4 rounded-xl bg-surface-subtle border border-border flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs shrink-0">
  <Icon name="user" variant="bold" size={18} />
  </div>
  <div>
  <h4 className="text-sm font-bold text-text-main">
  {session.userName} (Perangkat Anda)
  </h4>
  <p className="text-xs text-text-muted">
  Peran: {session.userRole.replace(/_/g, " ")} • Posko: {session.poskoName}
  </p>
  </div>
  </div>
  <Badge variant="primary" size="md">
  Mode Siaga Aktif
  </Badge>
  </div>
  </CardContent>
  </Card>

  {/* Peers List */}
  <div className="space-y-3">
    <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
      <Icon name="users" variant="bold" size={14} className="text-primary" />
      Daftar Petugas & Relawan di Sekitar
    </h3>

    {peers.length === 0 ? (
      <div className="p-6 rounded-2xl border border-border bg-surface text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted text-text-muted flex items-center justify-center">
          <Icon name="radar" variant="bold" size={24} className="animate-pulse text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-text-main">
            Memindai Simpul Relawan di Sekitar...
          </h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Belum ada perangkat petugas lain yang terdeteksi dalam jangkauan Bluetooth Low Energy (BLE). Perangkat Anda akan terhubung otomatis saat berdekatan dengan relawan lain.
          </p>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {peers.map((peer) => {
          const proximity = getProximityStatus(peer.rssi, peer.hops);
          return (
            <Card key={peer.peerId} className="p-3.5 space-y-2 border-border bg-surface shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-text-main">
                    {peer.aliasName}
                  </h4>
                  <p className="text-xs text-text-muted font-semibold mt-0.5">
                    {peer.role.replace(/_/g, " ")}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${proximity.bgBadge} shrink-0`}>
                  {proximity.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-border text-text-muted">
                <span>Jalur Transmisi:</span>
                <span className="font-semibold text-text-main">
                  {proximity.hopDesc}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    )}
  </div>
  </div>
  );
}
