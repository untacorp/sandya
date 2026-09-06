"use client";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { QRCameraScanner } from "@/features/auth/components/qr-camera-scanner";
import { RolePassCodec, type RolePassPayload } from "@/core/codecs/role-pass-codec";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type UserRole } from "@/shared/types";
import { getRoleDisplayName } from "@/features/auth/utils/role-routing";

interface RoleActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated?: (payload: RolePassPayload) => void;
}

export function RoleActivationModal({
  open,
  onOpenChange,
  onActivated,
}: RoleActivationModalProps) {
  const { session, setFullSession } = usePoskoStore();

  const [mode, setMode] = React.useState<"SCAN" | "MANUAL">("SCAN");
  const [manualCode, setManualCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verifiedPass, setVerifiedPass] = React.useState<RolePassPayload | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = React.useState(false);

  // Reset state when opening or closing modal
  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setVerifiedPass(null);
        setVerifyError(null);
        setManualCode("");
        setActivatedSuccess(false);
        setVerifying(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleScanPass = async (qrData: string) => {
    if (verifying || verifiedPass) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const result = await RolePassCodec.verifyAndDecodePass(qrData);
      if (result.ok) {
        setVerifiedPass(result.value);
      } else {
        setVerifyError(
          result.error.message ||
            "Kartu tugas tidak valid atau tanda tangan digital Ed25519 tidak cocok."
        );
      }
    } catch {
      setVerifyError("Gagal memproses data kode QR. Pastikan kode QR dalam kondisi jelas.");
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || verifying) return;
    await handleScanPass(manualCode.trim());
  };

  const handleConfirmActivation = () => {
    if (!verifiedPass) return;

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

    setActivatedSuccess(true);
    if (onActivated) {
      onActivated(verifiedPass);
    }

    setTimeout(() => {
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Aktivasi Kartu Tugas Lapangan"
      description="Pindai kode QR atau ketik kode manual kartu tugas resmi Anda untuk beralih peran secara langsung."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Toggle Mode Tab */}
        {!verifiedPass && !activatedSuccess && (
          <div className="flex p-1 rounded-lg border border-border bg-surface-muted text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("SCAN");
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
        )}

        {/* Verification Loading State */}
        {verifying && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-text-muted">
              Memverifikasi tanda tangan digital Ed25519...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {verifyError && !verifying && !verifiedPass && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-xs text-danger">
            <Icon name="alert" variant="bold" size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold">Verifikasi Gagal</p>
              <p className="mt-0.5 text-text-muted">{verifyError}</p>
            </div>
            <button
              type="button"
              onClick={() => setVerifyError(null)}
              className="text-text-subtle hover:text-text-main text-xs font-bold cursor-pointer"
            >
              Ulangi
            </button>
          </div>
        )}

        {/* Active Scan Mode */}
        {!verifiedPass && !verifying && mode === "SCAN" && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-border bg-black/90 aspect-4/3 relative flex items-center justify-center">
              <QRCameraScanner
                active={open && mode === "SCAN" && !verifiedPass}
                onScan={handleScanPass}
                onError={(err) => setVerifyError(err)}
                viewfinderText="Arahkan ke QR Kartu Tugas"
              />
            </div>
            <p className="text-[11px] text-center text-text-muted">
              Pastikan kode QR tercakup penuh dalam bingkai pemindai kamera.
            </p>
          </div>
        )}

        {/* Active Manual Mode */}
        {!verifiedPass && !verifying && mode === "MANUAL" && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="manual-code-input" className="text-xs font-semibold text-text-main">
                Kode Cadangan Kartu Tugas
              </label>
              <Input
                id="manual-code-input"
                placeholder="Contoh: SND-MED-491-X9A2 atau salin teks QR"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoComplete="off"
                autoFocus
              />
              <p className="text-[11px] text-text-muted">
                Dapat berupa string ringkas dari kartu cetak atau teks payload JSON bertanda tangan.
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!manualCode.trim()}
              icon="shield"
            >
              Verifikasi Kode
            </Button>
          </form>
        )}

        {/* Verified Pass Card */}
        {verifiedPass && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" size="sm" className="font-bold">
                  KARTU TUGAS TERVERIFIKASI SAH
                </Badge>
                <span className="text-[11px] text-text-muted">
                  Ed25519 Valid
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-text-muted">Nama Petugas</p>
                <p className="text-base font-bold text-text-main">{verifiedPass.userName}</p>
                <p className="text-xs text-text-muted">ID: {verifiedPass.userId}</p>
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
                {verifiedPass.missionName && (
                  <div className="col-span-2">
                    <span className="text-text-muted block text-[11px]">Misi Bencana:</span>
                    <span className="font-medium text-text-main">
                      {verifiedPass.missionName} ({verifiedPass.missionId})
                    </span>
                  </div>
                )}
                {verifiedPass.expiresAt && (
                  <div className="col-span-2">
                    <span className="text-text-muted block text-[11px]">Masa Berlaku:</span>
                    <span className="font-medium text-text-main">
                      Hingga {new Date(verifiedPass.expiresAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {activatedSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center font-bold text-xs flex items-center justify-center gap-2">
                <Icon name="check" variant="bold" size={16} />
                <span>Sesi berhasil diaktifkan! Menutup modal...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setVerifiedPass(null);
                    setVerifyError(null);
                  }}
                >
                  Pindai Ulang
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmActivation}
                  icon="check"
                >
                  Aktifkan & Mulai Bertugas
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
