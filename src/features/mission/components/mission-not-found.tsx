"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export function MissionNotFoundState({ missionId }: { missionId: string }) {
  const { missions } = usePoskoStore();

  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between p-4 sm:p-8">
  {/* Top Brand Header */}
  <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
  <Link
  href="/org"
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors py-1 px-2 rounded-lg hover:bg-surface-muted"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>Markas Induk</span>
  </Link>
  </header>

  {/* Center Not Found Container */}
  <main className="max-w-md mx-auto w-full my-auto py-6">
  <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs text-center space-y-4">
  <div className="w-14 h-14 mx-auto rounded-full bg-status-warning/10 text-status-warning flex items-center justify-center">
  <Icon name="radar" variant="bold" size={30} />
  </div>

  <div className="space-y-1.5">
  <h1 className="text-lg font-bold text-text-main tracking-tight">
  Operasi Misi Tidak Ditemukan
  </h1>
  <p className="text-xs text-text-muted leading-relaxed">
  Misi dengan ID <span className="font-mono text-text-main font-semibold bg-surface-muted px-1.5 py-0.5 rounded border border-border">{missionId}</span> tidak terdaftar pada pangkalan data lokal perangkat ini.
  </p>
  </div>

  {/* Available Missions Picker */}
  {missions.length > 0 && (
  <div className="space-y-2 text-left pt-2 border-t border-border">
  <p className="text-xs font-semibold text-text-muted">
  Pilih Operasi Misi yang Tersedia:
  </p>
  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
  {missions.map((m) => (
  <Link
  key={m.id}
  href={`/missions/${m.id}`}
  className="block p-2.5 rounded-xl border border-border bg-surface-subtle hover:bg-surface-muted hover:border-primary/40 transition-colors"
  >
  <div className="flex items-center justify-between">
  <span className="text-xs font-bold text-text-main truncate">
  {m.name}
  </span>
  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-surface text-text-muted border border-border shrink-0">
  {m.id}
  </span>
  </div>
  <p className="text-[11px] text-text-muted truncate mt-0.5">
  {m.location} • {m.targetDays} Hari Tanggap
  </p>
  </Link>
  ))}
  </div>
  </div>
  )}

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
  <Link href="/org/missions/create" className="flex-1">
  <Button
  variant="primary"
  className="w-full justify-center"
  icon="add-circle"
  iconVariant="bold"
  >
  Buka Misi Baru
  </Button>
  </Link>
  <Link href="/org" className="flex-1">
  <Button
  variant="outline"
  className="w-full justify-center"
  icon="buildings"
  iconVariant="linear"
  >
  Markas Organisasi
  </Button>
  </Link>
  </div>
  </div>
  </main>

  {/* Footer */}
  <footer className="max-w-md mx-auto w-full text-center text-[11px] text-text-subtle py-2">
  Sandya • Sistem Siaga Kebencanaan Tangguh Offline
  </footer>
  </div>
  );
}
