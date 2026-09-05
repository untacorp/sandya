"use client";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { QRCodeSVG } from "@/shared/ui/qr-code-svg";
import { RolePassCodec, RolePassPayload, ROLE_PASS_CONSTANTS } from "@/core/codecs/role-pass-codec";
import { StaffRole } from "@/core/shared/roles";

interface RolePassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: StaffRole;
  officerName: string;
  poskoId: string;
  poskoName: string;
  missionId: string;
  missionName: string;
  orgId: string;
  masterPrivateKeyHex?: string;
  masterPublicKeyHex?: string;
}

export const ROLE_PASS_MODAL_CONSTANTS = {
  RANDOM_USER_ID_BASE: 100,
  RANDOM_USER_ID_RANGE: 900,
  COPY_FEEDBACK_TIMEOUT_MS: 2000,
  QR_DISPLAY_SIZE: 200,
} as const;

export function RolePassModal({
  open,
  onOpenChange,
  role,
  officerName,
  poskoId,
  poskoName,
  missionId,
  missionName,
  orgId,
  masterPrivateKeyHex,
  masterPublicKeyHex,
}: RolePassModalProps) {
  const [passString, setPassString] = React.useState<string>("");
  const [manualCode, setManualCode] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
  if (!open) return;

  let isMounted = true;
  const randomUserSuffix = Math.floor(
  ROLE_PASS_MODAL_CONSTANTS.RANDOM_USER_ID_BASE +
  Math.random() * ROLE_PASS_MODAL_CONSTANTS.RANDOM_USER_ID_RANGE
  );

  const payload: RolePassPayload = {
  orgId: orgId || "ORG-01",
  orgName: "PMI Kabupaten Cianjur",
  missionId: missionId || "MSN-01",
  missionName: missionName || "Tanggap Gempa Cianjur 2026",
  poskoId: poskoId || "POS-01",
  poskoName: poskoName || "Posko Lapangan RW 03 Cijedil",
  role,
  userId: `USR-${randomUserSuffix}`,
  userName: officerName,
  issuedAt: Date.now(),
  expiresAt: Date.now() + ROLE_PASS_CONSTANTS.DEFAULT_EXPIRATION_MS, // 14 days emergency duration
  };

  const code = RolePassCodec.generateManualCode(payload);
  setManualCode(code);

  // If master private key is provided, sign with it, otherwise generate with fallback/mock key
  const privKey = masterPrivateKeyHex || "302e020100300506032b6570042204207a9f81bc92e3419bb6a20d43f01948275f112e3419bb6a20d43f01948275f112";
  const pubKey = masterPublicKeyHex || "302a300506032b65700321005f3c12aa89bb0c918a3d5e21976a40df612803b392a76f2d918a3d5e21976a40";

  RolePassCodec.issuePassAsync(payload, privKey, pubKey).then((qrStr) => {
  if (isMounted) {
  setPassString(qrStr);
  }
  });

  return () => {
  isMounted = false;
  };
  }, [
  open,
  role,
  officerName,
  poskoId,
  poskoName,
  missionId,
  missionName,
  orgId,
  masterPrivateKeyHex,
  masterPublicKeyHex,
  ]);

  const handleCopyCode = () => {
  if (manualCode && typeof navigator !== "undefined") {
  navigator.clipboard.writeText(manualCode);
  setCopied(true);
  setTimeout(() => setCopied(false), ROLE_PASS_MODAL_CONSTANTS.COPY_FEEDBACK_TIMEOUT_MS);
  }
  };

  const getRoleBadge = (r: StaffRole) => {
  switch (r) {
  case "PETUGAS_MEDIS":
  return <Badge variant="triage-yellow" size="sm">Petugas Medis</Badge>;
  case "PETUGAS_LOGISTIK":
  return <Badge variant="primary" size="sm">Petugas Logistik</Badge>;
  case "RELAWAN_LAPANGAN":
  return <Badge variant="neutral" size="sm">Relawan Lapangan</Badge>;
  case "KOORDINATOR_POSKO":
  return <Badge variant="danger" size="sm">Koordinator Posko</Badge>;
  default:
  return <Badge variant="neutral" size="sm">{r}</Badge>;
  }
  };

  return (
  <Dialog
  open={open}
  onOpenChange={onOpenChange}
  title="Kartu Tugas Resmi Lapangan"
  description="Arahkan kamera HP petugas ke QR Code ini untuk aktivasi hak akses posko."
  maxWidth="sm"
  >
  <div className="space-y-4 text-center">
  {/* Role & Name Header */}
  <div className="space-y-1">
  <div className="flex justify-center">{getRoleBadge(role)}</div>
  <h3 className="text-base font-bold text-text-main">{officerName}</h3>
  <p className="text-xs text-text-muted">
  {poskoName} • Berlaku 14 Hari
  </p>
  </div>

  {/* Real Authentic QR Code */}
  <div className="flex justify-center p-3 rounded-xl bg-surface border border-border shadow-xs">
  {passString ? (
  <QRCodeSVG value={passString} size={ROLE_PASS_MODAL_CONSTANTS.QR_DISPLAY_SIZE} />
  ) : (
  <div className="w-48 h-48 rounded-lg bg-surface-subtle animate-pulse flex items-center justify-center">
  <span className="text-xs text-text-muted">Membuat tanda tangan kriptografis...</span>
  </div>
  )}
  </div>

  {/* Manual Code Fallback */}
  <div className="p-2.5 rounded-xl bg-surface-subtle border border-border space-y-1 text-left">
  <div className="flex items-center justify-between text-xs">
  <span className="text-text-muted font-medium">Kode Manual (Jika Kamera Rusak):</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              {copied && <Icon name="check" size={12} className="inline text-primary" />}
              <span>{copied ? "Tersalin" : "Salin"}</span>
            </button>
  </div>
  <p className="font-mono text-xs font-bold text-text-main bg-surface px-2.5 py-1 rounded-md border border-border text-center tracking-wider">
  {manualCode}
  </p>
  </div>

  {/* Action Button */}
  <Button
  variant="primary"
  className="w-full justify-center"
  onClick={() => onOpenChange(false)}
  >
  Selesai
  </Button>
  </div>
  </Dialog>
  );
}
