"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { QRCameraScanner } from "@/features/auth/components/qr-camera-scanner";
import { RolePassCodec, RolePassPayload } from "@/core/codecs/role-pass-codec";
import { type UserRole } from "@/shared/types";
import { StaffRole } from "@/core/shared/roles";

export default function ActivatePassPage() {
  const router = useRouter();
  const { session, setSessionRole, setSessionPosko, setSessionMission, setSessionOrg } = usePoskoStore();

  const [mode, setMode] = React.useState<"SCAN" | "MANUAL">("SCAN");
  const [manualCode, setManualCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verifiedPass, setVerifiedPass] = React.useState<RolePassPayload | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  const handleScanPass = async (qrData: string) => {
  setVerifying(true);
  setVerifyError(null);

  const result = await RolePassCodec.verifyAndDecodePass(qrData);
  setVerifying(false);

  if (result.ok) {
  setVerifiedPass(result.value);
  } else {
  setVerifyError(result.error.message || "Kartu tugas tidak valid atau tanda tangan digital palsu.");
  }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!manualCode.trim()) return;
  await handleScanPass(manualCode.trim());
  };

  const handleConfirmActivation = () => {
  if (verifiedPass) {
  // Map to UserRole
  const role = verifiedPass.role as UserRole;
  setSessionRole(role);
  setSessionPosko(verifiedPass.poskoId, verifiedPass.poskoName || `Posko ${verifiedPass.poskoId}`);
  if (verifiedPass.missionId) {
  setSessionMission(verifiedPass.missionId, verifiedPass.missionName || `Misi ${verifiedPass.missionId}`);
  }
  if (verifiedPass.orgId) {
  setSessionOrg(verifiedPass.orgId, verifiedPass.orgName || `Organisasi ${verifiedPass.orgId}`);
  }

  if (role === "PEMIMPIN_ORGANISASI") {
  router.push("/org");
  } else if (role === "KOMANDAN_MISI") {
  router.push(`/missions/${verifiedPass.missionId || session.missionId}`);
  } else {
  router.push(`/posko/${verifiedPass.poskoId || session.poskoId}`);
  }
  } else {
  router.push(`/posko/${session.poskoId}`);
  }
  };

  const getRoleDisplayName = (role: StaffRole | UserRole) => {
  switch (role) {
  case "PETUGAS_MEDIS":
  return "Petugas Medis (Kesehatan & Triase)";
  case "PETUGAS_LOGISTIK":
  return "Petugas Logistik (Gudang & Single-Writer)";
  case "RELAWAN_LAPANGAN":
  return "Relawan Lapangan (Pendataan 30s & Antar Bantuan)";
  case "KOORDINATOR_POSKO":
  return "Koordinator Posko (Otoritas Tenda)";
  case "KOMANDAN_MISI":
  return "Komandan Misi (Operasi Wilayah)";
  case "PEMIMPIN_ORGANISASI":
  return "Pimpinan Lembaga Induk";
  default:
  return "Petugas Lapangan";
  }
  };

  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between">
  {/* Header */}
  <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
  <div className="max-w-xl mx-auto w-full flex items-center justify-between">
  <Link href="/">
  <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
  Kembali
  </Button>
  </Link>
  <span className="text-xs font-semibold text-text-muted">Aktivasi Kartu Tugas</span>
  </div>
  </header>

  {/* Konten Utama */}
  <main className="max-w-md mx-auto w-full px-4 py-8 my-auto space-y-5">
  <div className="space-y-1 text-center">
  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
  Masuk sebagai Petugas
  </h1>
  <p className="text-xs text-text-muted">
  Pindai kode QR pada kartu tugas Anda untuk mengaktifkan wewenang posko.
  </p>
  </div>

  {/* Pilihan Metode */}
  <div className="flex p-1 rounded-lg border border-border bg-surface-muted text-xs font-semibold">
  <button
  type="button"
  onClick={() => {
  setMode("SCAN");
  setVerifiedPass(null);
  setVerifyError(null);
  }}
  className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
  mode === "SCAN"
  ? "bg-surface text-text-main shadow-2xs font-bold"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  Pindai Kamera
  </button>
  <button
  type="button"
  onClick={() => {
  setMode("MANUAL");
  setVerifiedPass(null);
  setVerifyError(null);
  }}
  className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
  mode === "MANUAL"
  ? "bg-surface text-text-main shadow-2xs font-bold"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  Ketik Kode Manual
  </button>
  </div>

  {/* Loading Verification */}
  {verifying && (
  <Card className="p-6 text-center space-y-2">
  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
  <p className="text-xs font-semibold text-text-main">
  Memverifikasi Tanda Tangan Kriptografi Ed25519...
  </p>
  </Card>
  )}

  {/* Error Alert */}
  {verifyError && !verifying && (
  <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger-border text-status-danger text-xs space-y-1">
  <div className="flex items-center gap-1.5 font-bold">
  <Icon name="shield" variant="bold" size={16} />
  <span>Verifikasi Gagal</span>
  </div>
  <p className="text-text-main">{verifyError}</p>
  <Button
  variant="outline"
  size="sm"
  onClick={() => setVerifyError(null)}
  className="mt-2 text-xs"
  >
  Coba Pindai Ulang
  </Button>
  </div>
  )}

  {/* Hasil Scan Sukses */}
  {verifiedPass && !verifying ? (
  <Card className="p-5 border-status-safe-border bg-surface space-y-4 shadow-2xs">
  <div className="flex items-start gap-3">
  <div className="w-10 h-10 rounded-lg bg-status-safe-bg border border-status-safe-border text-status-safe flex items-center justify-center shrink-0">
  <Icon name="check" variant="bold" size={20} />
  </div>
  <div className="space-y-1 min-w-0 flex-1">
  <div className="flex items-center gap-1.5">
  <Badge variant="triage-green" size="sm">Tanda Tangan Sah</Badge>
  </div>
  <h2 className="text-base font-bold text-text-main">
  {getRoleDisplayName(verifiedPass.role)}
  </h2>
  <div className="text-xs text-text-muted space-y-0.5">
  <p>Nama: <strong>{verifiedPass.userName}</strong></p>
  <p>Posko: <strong>{verifiedPass.poskoName || verifiedPass.poskoId}</strong></p>
  <p>Masa Berlaku: <strong>14 Hari</strong></p>
  </div>
  </div>
  </div>

  <div className="pt-2 border-t border-border flex items-center gap-2">
  <Button
  variant="secondary"
  size="md"
  onClick={() => setVerifiedPass(null)}
  className="flex-1"
  >
  Pindai Ulang
  </Button>
  <Button
  variant="primary"
  size="md"
  onClick={handleConfirmActivation}
  icon="arrow-right"
  iconVariant="bold"
  className="flex-1 justify-center"
  >
  Mulai Bekerja
  </Button>
  </div>
  </Card>
  ) : mode === "SCAN" && !verifying ? (
  /* Jendela Scanner Kamera Nyata */
  <div className="space-y-3">
  <QRCameraScanner onScan={handleScanPass} />

  {/* Opsi Cepat Pengujian Dev / Lapangan */}
  <div className="p-3 rounded-xl bg-surface border border-border space-y-1.5">
  <span className="text-[11px] text-text-muted font-medium block text-center">
  Pintasan Penugasan Cepat:
  </span>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
  <Button
  variant="secondary"
  size="sm"
  onClick={() => handleScanPass("SAN-MED-001-0001")}
  icon="health"
  iconVariant="bold"
  className="text-xs justify-center"
  >
  Medis
  </Button>
  <Button
  variant="secondary"
  size="sm"
  onClick={() => handleScanPass("SAN-LOG-001-0002")}
  icon="box"
  iconVariant="bold"
  className="text-xs justify-center"
  >
  Logistik
  </Button>
  <Button
  variant="secondary"
  size="sm"
  onClick={() => handleScanPass("SAN-REL-001-0003")}
  icon="users"
  iconVariant="bold"
  className="text-xs justify-center"
  >
  Relawan
  </Button>
  <Button
  variant="secondary"
  size="sm"
  onClick={() => handleScanPass("SAN-KOR-001-0004")}
  icon="home"
  iconVariant="bold"
  className="text-xs justify-center"
  >
  Koordinator
  </Button>
  </div>
  </div>
  </div>
  ) : !verifying ? (
  /* Ketik Kode Manual */
  <Card className="p-5 space-y-3.5 shadow-2xs">
  <form onSubmit={handleManualSubmit} className="space-y-3.5">
  <div className="space-y-1">
  <label className="text-xs font-semibold text-text-main block">
  Kode Penugasan
  </label>
  <Input
  placeholder="Contoh: SAN-MED-001-0001 atau tempel QR string"
  value={manualCode}
  onChange={(e) => setManualCode(e.target.value)}
  className="text-xs font-mono"
  required
  />
  <p className="text-[11px] text-text-muted">
  Masukkan kode yang tertera pada kartu tugas Anda.
  </p>
  </div>

  <Button
  type="submit"
  variant="primary"
  size="md"
  className="w-full justify-center"
  disabled={!manualCode.trim()}
  >
  Verifikasi & Masuk
  </Button>
  </form>
  </Card>
  ) : null}
  </main>

  {/* Footer */}
  <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-text-muted">
  Jika kartu tugas belum dicetak, minta Koordinator Posko Anda membuka menu anggota posko.
  </footer>
  </div>
  );
}
