"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";
import { QRCameraScanner } from "@/features/auth/components/qr-camera-scanner";
import { RolePassCodec, RolePassPayload } from "@/core/codecs/role-pass-codec";
import { type UserRole } from "@/shared/types";
import { StaffRole } from "@/core/shared/roles";
import { getRoleDisplayName, getRoleDefaultPath } from "@/features/auth/utils/role-routing";

function ActivatePassContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const { session, setFullSession } = usePoskoStore();

  const [mode, setMode] = React.useState<"SCAN" | "MANUAL">("SCAN");
  const [manualCode, setManualCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verifiedPass, setVerifiedPass] = React.useState<RolePassPayload | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  const handleBack = () => {
    // Turn off camera hardware immediately before starting route transition
    setMode("MANUAL");

    // 1. Explicit returnUrl query parameter
    if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")) {
      router.push(returnUrl);
      return;
    }

    // 2. Browser history from same origin
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      router.back();
      return;
    }

    // 3. Contextual fallback based on active role & hierarchy level
    if (session.userRole === "PEMIMPIN_ORGANISASI" || (!session.missionId && !session.poskoId && session.orgId)) {
      router.push("/org");
      return;
    }
    if (session.userRole === "KOMANDAN_MISI" || (session.missionId && !session.poskoId)) {
      router.push(`/missions/${session.missionId || "MSN-2026-01"}`);
      return;
    }
    if (session.poskoId && session.poskoId !== "POS-LOCAL") {
      router.push(`/posko/${session.poskoId}`);
      return;
    }
    if (session.missionId) {
      router.push(`/missions/${session.missionId}`);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

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
      const role = verifiedPass.role as UserRole;
      setFullSession({
        userId: verifiedPass.userId || `USR-${Math.floor(100 + Math.random() * 900)}`,
        userName: verifiedPass.userName || `Petugas (${role})`,
        userRole: role,
        poskoId: verifiedPass.poskoId,
        poskoName: verifiedPass.poskoName || `Posko ${verifiedPass.poskoId}`,
        missionId: verifiedPass.missionId || session.missionId,
        missionName: verifiedPass.missionName || session.missionName || `Misi ${verifiedPass.missionId}`,
        orgId: verifiedPass.orgId || session.orgId,
        orgName: verifiedPass.orgName || session.orgName || `Organisasi ${verifiedPass.orgId}`,
      });

      if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")) {
        router.push(returnUrl);
      } else {
        const targetPath = getRoleDefaultPath(role, {
          missionId: verifiedPass.missionId || session.missionId,
          poskoId: verifiedPass.poskoId || session.poskoId,
        });
        router.push(targetPath);
      }
    } else {
      router.push(getRoleDefaultPath(session.userRole, { poskoId: session.poskoId }));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-canvas text-text-main flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon="arrow-left"
            iconVariant="linear"
            onClick={handleBack}
            className="cursor-pointer"
          >
            Kembali
          </Button>
          <div className="flex items-center gap-2">
            <SandyaLogo size={20} className="text-primary" />
            <span className="text-xs font-semibold text-text-muted">Aktivasi Kartu Tugas</span>
          </div>
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

        {/* Status Loading Verifikasi */}
        {verifying && (
          <Card className="p-6 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-text-muted">
              Memverifikasi tanda tangan digital Ed25519...
            </p>
          </Card>
        )}

        {/* Error Verifikasi */}
        {verifyError && !verifying && (
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex items-start gap-2">
            <Icon name="alert" variant="bold" size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Aktivasi Gagal</p>
              <p className="text-[11px] opacity-90">{verifyError}</p>
            </div>
          </div>
        )}

        {/* Kartu Hasil Verifikasi */}
        {verifiedPass && !verifying && (
          <Card className="p-5 border-primary/40 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="primary" size="md">
                Kartu Tugas Sah
              </Badge>
              <span className="text-[11px] text-text-muted">
                Ed25519 Terverifikasi
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Nama Petugas
              </p>
              <p className="text-base font-bold text-text-main">{verifiedPass.userName}</p>
              <p className="text-xs text-text-muted font-mono">{verifiedPass.userId}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Wewenang Peran:</span>
                <span className="font-bold text-primary">
                  {getRoleDisplayName(verifiedPass.role)}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Penugasan Posko:</span>
                <span className="font-bold text-text-main truncate block">
                  {verifiedPass.poskoName || verifiedPass.poskoId}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={handleConfirmActivation}
            >
              Aktifkan & Mulai Bertugas
            </Button>
          </Card>
        )}

        {/* Pemindai Kamera */}
        {mode === "SCAN" && !verifiedPass && !verifying ? (
          <Card className="overflow-hidden p-0 border-border">
            <div className="aspect-square w-full max-w-[320px] mx-auto relative bg-black flex items-center justify-center">
              <QRCameraScanner
                active={mode === "SCAN" && !verifiedPass && !verifying}
                onScan={handleScanPass}
                onError={(err) => setVerifyError(err)}
                viewfinderText="Arahkan ke QR Kartu Tugas"
              />
            </div>
            <div className="p-3 bg-surface-subtle text-center text-xs text-text-muted">
              Pastikan kode QR berada tepat di dalam bingkai kamera.
            </div>
          </Card>
        ) : null}

        {/* Input Manual Kode Cadangan */}
        {mode === "MANUAL" && !verifiedPass && !verifying ? (
          <Card className="p-5 space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main block">
                  Kode Cadangan Kartu Tugas
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: SND-MED-491-X9A2 atau salin teks QR"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="font-mono text-sm"
                  autoFocus
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

      {/* Footer Bersih */}
      <footer className="border-t border-border bg-surface px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] text-center text-xs text-text-muted">
        Jika kartu tugas belum dicetak, minta Koordinator Posko Anda membuka menu anggota posko.
      </footer>
    </div>
  );
}

export default function ActivatePassPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[100dvh] bg-canvas flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ActivatePassContent />
    </React.Suspense>
  );
}
