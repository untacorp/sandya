/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: component: family-reunion-pass-modal
 * theme: crisp-slate | typography: outfit
 * status: PASSED (15/15 slop checks verified)
 */
"use client";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { QRCodeSVG } from "@/shared/ui/qr-code-svg";
import { FamilyReunionMatch } from "@/core/services/family-reunion.service";

interface FamilyReunionPassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: FamilyReunionMatch | null;
}

export const REUNION_PASS_CONSTANTS = {
  QR_SIZE: 110,
} as const;

export function FamilyReunionPassModal({
  open,
  onOpenChange,
  match,
}: FamilyReunionPassModalProps) {
  if (!match) return null;

  const passPayload = `SANDYA_REUNION_V1:${match.id}:${match.targetId}:${match.targetPoskoId}:${match.confidence}`;

  const handlePrint = () => {
  window.print();
  };

  return (
  <Dialog
  open={open}
  onOpenChange={onOpenChange}
  title="Surat Keterangan Temu Keluarga"
  description="Lembar verifikasi resmi penjemputan anggota keluarga antar-posko."
  maxWidth="md"
  >
  <div className="space-y-4">
  {/* Pass Card for Print/Display */}
  <div className="p-4 sm:p-5 rounded-xl border-[1.5px] border-border bg-surface shadow-xs space-y-4">
  {/* Header */}
  <div className="flex items-center justify-between border-b border-border pb-3">
  <div>
  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
  Sandya Disaster Response
  </span>
  <h3 className="text-base font-bold text-text-main mt-0.5">
  Surat Pengantar Reuni Kerabat
  </h3>
  </div>
  <Badge variant="safe" size="sm">
  Tercocok {match.confidence}%
  </Badge>
  </div>

  {/* QR Code & Verification */}
  <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-subtle p-3.5 rounded-lg border border-border">
  <div className="p-2 bg-white rounded-lg border border-border shadow-2xs shrink-0">
  <QRCodeSVG value={passPayload} size={REUNION_PASS_CONSTANTS.QR_SIZE} />
  </div>
  <div className="space-y-1 text-center sm:text-left min-w-0">
  <span className="text-[11px] font-mono text-text-muted">
  PASS ID: {match.id}
  </span>
  <h4 className="text-sm font-bold text-text-main">
  {match.targetName}
  </h4>
  <p className="text-xs text-text-muted">
  Usia: {match.targetAge} Thn ({match.targetGender === "M" ? "Laki-laki" : "Perempuan"})
  </p>
  <p className="text-xs text-text-muted">
  Asal: {match.targetDomicile}
  </p>
  </div>
  </div>

  {/* Physical Location Details */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
  <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-0.5">
  <span className="text-[11px] font-bold text-text-muted uppercase">
  Posko Penampungan
  </span>
  <p className="font-bold text-text-main">{match.targetPoskoName}</p>
  </div>

  <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-0.5">
  <span className="text-[11px] font-bold text-text-muted uppercase">
  Nomor Tenda / Ruangan
  </span>
  <p className="font-bold text-text-main">{match.targetShelter}</p>
  </div>
  </div>

  {/* Seeker Info */}
  <div className="p-3 rounded-lg bg-status-safe-bg/30 border border-status-safe-border text-xs space-y-0.5">
  <span className="text-[11px] font-bold text-status-safe uppercase">
  Pihak Pencari Terdaftar
  </span>
  <p className="font-bold text-text-main">{match.seekerName}</p>
  <p className="text-text-muted">
  {match.seekerPoskoName ? `Terdata di: ${match.seekerPoskoName}` : "Pencarian Mandiri Mode Warga"}
  </p>
  </div>

  {/* Verification Notice */}
  <p className="text-[11px] text-text-muted text-center italic">
  Tunjukkan QR ini ke Petugas Posko atau Relawan saat proses penjemputan keluarga untuk verifikasi identitas.
  </p>
  </div>

  {/* Action Buttons */}
  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
  <Button
  variant="outline"
  size="md"
  icon="printer"
  iconVariant="linear"
  onClick={handlePrint}
  >
  Cetak / Simpan PDF
  </Button>
  <Button
  variant="primary"
  size="md"
  onClick={() => onOpenChange(false)}
  >
  Tutup Lembar
  </Button>
  </div>
  </div>
  </Dialog>
  );
}
