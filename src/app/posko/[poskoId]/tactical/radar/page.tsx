"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export default function MeshRadarPage() {
  const { session, peers } = usePoskoStore();

  const getSignalQuality = (rssi: number) => {
    if (rssi >= -50) return { label: "Sangat Kuat", color: "text-status-safe" };
    if (rssi >= -70) return { label: "Kuat", color: "text-status-safe" };
    if (rssi >= -85) return { label: "Sedang", color: "text-status-warning" };
    return { label: "Lemah", color: "text-status-danger" };
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href={`/posko/${session.poskoId}/tactical`}>
          <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
            Kembali ke Radio HT
          </Button>
        </Link>
        <span className="text-xs font-semibold text-text-muted">
          {peers.length} Perangkat Terhubung
        </span>
      </div>

      {/* Radar Map */}
      <Card>
        <CardHeader>
          <CardTitle>Jaringan Komunikasi Lokal</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Perangkat petugas posko yang terhubung secara nirkabel offline.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-5 rounded-xl bg-surface-subtle border border-border text-center flex flex-col items-center justify-center min-h-[140px]">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-xs">
              <Icon name="radar" variant="bold" size={18} />
            </div>
            <h4 className="text-sm font-bold text-text-main mt-2">
              Perangkat Anda: {session.userName}
            </h4>
            <p className="text-xs text-text-muted">
              Mode Siaga Relai Lokal Aktif
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Peers List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Daftar Perangkat Petugas di Sekitar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {peers.map((peer) => {
            const signal = getSignalQuality(peer.rssi);
            return (
              <Card key={peer.peerId} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-xs text-text-main">
                      <Icon name="user" variant="linear" size={15} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-main">
                        {peer.aliasName}
                      </h4>
                      <p className="text-xs text-text-muted">{peer.role}</p>
                    </div>
                  </div>

                  <span className="text-xs text-text-muted font-medium">
                    {peer.hops} Lompatan
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                  <span className="text-text-muted">Kekuatan Sinyal:</span>
                  <span className={`font-semibold ${signal.color}`}>
                    {signal.label} ({peer.rssi} dBm)
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
