"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export function PoskoNotFoundState({ poskoId }: { poskoId: string }) {
  const { session, poskos, missions } = usePoskoStore();

  const currentMission = missions.find((m) => m.id === session.missionId) || null;
  const availablePoskos = poskos.filter((p) => !session.missionId || p.missionId === session.missionId);

  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between p-4 sm:p-8">
  {/* Top Header */}
  <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
  <Link
  href={currentMission ? `/missions/${currentMission.id}` : "/"}
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors py-1 px-2 rounded-lg hover:bg-surface-muted"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>{currentMission ? "Markas Wilayah" : "Beranda"}</span>
  </Link>
  </header>

  {/* Center Container */}
  <main className="max-w-md mx-auto w-full my-auto py-6">
  <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs text-center space-y-4">
  <div className="w-14 h-14 mx-auto rounded-full bg-status-warning/10 text-status-warning flex items-center justify-center">
  <Icon name="home" variant="bold" size={30} />
  </div>

  <div className="space-y-1.5">
  <h1 className="text-lg font-bold text-text-main tracking-tight">
  Posko Lapangan Tidak Ditemukan
  </h1>
  <p className="text-xs text-text-muted leading-relaxed">
  Posko dengan ID <span className="font-mono text-text-main font-semibold bg-surface-muted px-1.5 py-0.5 rounded border border-border">{poskoId}</span> tidak ditemukan pada basis data lokal perangkat ini.
  </p>
  </div>

  {/* Available Poskos Picker */}
  {availablePoskos.length > 0 && (
  <div className="space-y-2 text-left pt-2 border-t border-border">
  <p className="text-xs font-semibold text-text-muted">
  Pilih Posko Lapangan Aktif:
  </p>
  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
  {availablePoskos.map((p) => (
  <Link
  key={p.id}
  href={`/posko/${p.id}`}
  className="block p-2.5 rounded-xl border border-border bg-surface-subtle hover:bg-surface-muted hover:border-primary/40 transition-colors"
  >
  <div className="flex items-center justify-between">
  <span className="text-xs font-bold text-text-main truncate">
  {p.name}
  </span>
  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-surface text-text-muted border border-border shrink-0">
  {p.id}
  </span>
  </div>
  <p className="text-[11px] text-text-muted truncate mt-0.5">
  {p.locationName} • Kapasitas: {p.capacity} Jiwa
  </p>
  </Link>
  ))}
  </div>
  </div>
  )}

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
  {currentMission && (
  <Link href={`/missions/${currentMission.id}/poskos/create`} className="flex-1">
  <Button
  variant="primary"
  className="w-full justify-center"
  icon="add-circle"
  iconVariant="bold"
  >
  Buka Posko Baru
  </Button>
  </Link>
  )}
  <Link href="/" className="flex-1">
  <Button
  variant="outline"
  className="w-full justify-center"
  icon="home"
  iconVariant="linear"
  >
  Ke Beranda
  </Button>
  </Link>
  </div>
  </div>
  </main>

  {/* Footer */}
  <footer className="max-w-md mx-auto w-full text-center text-[11px] text-text-subtle py-2">
  Sandya • Sistem Tanggap Darurat Bencana Mandiri
  </footer>
  </div>
  );
}
