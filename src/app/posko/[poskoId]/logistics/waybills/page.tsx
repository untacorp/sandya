"use client";

import * as React from "react";
import { usePoskoStore, type MacroWaybill } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { DISASTER_NEEDS_CATALOG } from "@/core/codecs/needs-catalog";
import { asPoskoId } from "@/core/shared/branded-types";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";
import { QRCodeSVG } from "@/shared/ui/qr-code-svg";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { EmptyState } from "@/shared/ui/empty-state";

interface WaybillRecord {
  id: string;
  from: string;
  to: string;
  item: string;
  quantity: number;
  unit: string;
  driverName: string;
  status: "REQUESTED" | "IN_TRANSIT" | "DELIVERED";
  time: string;
  qrPayload: string;
}

export default function WaybillsPage() {
  const { session, poskos, missionWaybills, issueMissionWaybill, receiveWaybill } = usePoskoStore();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [targetPoskoId, setTargetPoskoId] = React.useState("POS-03");
  const [selectedCatalogId, setSelectedCatalogId] = React.useState<number>(0x01);
  const [requestQty, setRequestQty] = React.useState(50);
  const [unit, setUnit] = React.useState("KG");
  const [driverName, setDriverName] = React.useState("Sopian (Truk Logistik #02)");
  const [waybillModal, setWaybillModal] = React.useState<MacroWaybill | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  const authorizedRoles = [
  "PETUGAS_LOGISTIK",
  "LOGISTIK",
  "KOORDINATOR_POSKO",
  "KOORDINATOR",
  "KOMANDAN_MISI",
  "PEMIMPIN_ORGANISASI",
  ];
  const isLogisticsOfficer = authorizedRoles.includes(session.userRole);

  const handleCreateWaybill = (e: React.FormEvent) => {
  e.preventDefault();
  const targetP = poskos.find((p) => p.id === targetPoskoId);
  const itemName = DISASTER_NEEDS_CATALOG[selectedCatalogId]?.nameId || "Bantuan Bencana";

  issueMissionWaybill({
  missionId: session.missionId,
  sourceHub: targetP?.name || "Gudang Sentral GOR Pacet",
  targetPoskoId: session.poskoId,
  targetPoskoName: session.poskoName,
  itemName,
  quantity: Number(requestQty),
  unit: unit.toUpperCase(),
  driverName: driverName || "Menunggu penugasan pengemudi",
  status: "IN_TRANSIT",
  });

  setSuccessToast(`Surat jalan suplai ${itemName} berhasil diterbitkan & armada dalam perjalanan.`);
  setTimeout(() => setSuccessToast(null), 4000);
  setCreateOpen(false);
  };

  const handleConfirmArrival = (wb: MacroWaybill) => {
  if (!isLogisticsOfficer) {
  alert("Akses ditolak: Hanya Petugas Logistik atau Koordinator yang berwenang menerima armada.");
  return;
  }

  receiveWaybill(wb.id);

  setSuccessToast(
  `Armada ${wb.id} dikonfirmasi tiba! Stok +${wb.quantity} ${wb.unit} ${wb.itemName} telah dicatat ke buku besar saldo gudang.`
  );
  setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
  <div className="space-y-4">
  {/* 1. Sub-Tabs */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <Tabs
  items={[
  { id: "stock", label: "Stok Gudang", icon: "box", href: `/posko/${session.poskoId}/logistics` },
  { id: "distribute", label: "Distribusi Bantuan", icon: "delivery", href: `/posko/${session.poskoId}/logistics/distribute` },
  { id: "waybills", label: "Surat Jalan Antar-Posko", icon: "waybill", badgeCount: missionWaybills.filter(w => w.status === "IN_TRANSIT").length, href: `/posko/${session.poskoId}/logistics/waybills` },
  ]}
  activeId="waybills"
  variant="segmented"
  className="w-full sm:w-auto"
  />

  <Button
  variant="primary"
  size="sm"
  disabled={!isLogisticsOfficer}
  onClick={() => setCreateOpen(true)}
  >
  <Icon name="waybill" variant="bold" size={14} className="mr-1" />
  Minta Suplai Antar-Posko
  </Button>
  </div>

  {/* 2. Banner Notifikasi */}
  {!isLogisticsOfficer && (
  <AlertBanner
  variant="warning"
  title="Mode Peninjauan (Read-Only)"
  description="Penerbitan surat jalan dan konfirmasi penerimaan muatan armada dibatasi khusus untuk Petugas Logistik atau Koordinator Posko."
  icon="shield"
  />
  )}

  {successToast && (
  <AlertBanner
  variant="safe"
  title="Surat Jalan Terverifikasi"
  description={successToast}
  icon="check"
  />
  )}

  {/* 3. Daftar Surat Jalan Antar-Posko */}
  <div className="space-y-3">
  <div className="flex items-center justify-between">
  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
  <Icon name="waybill" variant="bold" size={14} className="text-primary" />
  Daftar Pengiriman Antar-Posko & Truk Suplai
  </h3>
  <span className="text-xs text-text-muted">
  {missionWaybills.length} Surat Jalan
  </span>
  </div>

  {missionWaybills.length === 0 ? (
  <EmptyState
  icon="waybill"
  title="Belum Ada Surat Jalan Antar-Posko"
  description="Belum ada pergerakan suplai logistik atau armada transfer barang antar-posko yang tercatat untuk posko ini."
  actionLabel="+ Minta Suplai Antar-Posko"
  actionIcon="add-circle"
  onAction={() => setCreateOpen(true)}
  />
  ) : (
  <div className="grid grid-cols-1 gap-3">
  {missionWaybills.map((wb) => (
  <Card key={wb.id} className="p-4 sm:p-5 shadow-2xs border-border bg-surface">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="space-y-1.5 min-w-0">
  <div className="flex items-center gap-2">
  <Badge
  variant={
  wb.status === "ARRIVED"
  ? "safe"
  : wb.status === "IN_TRANSIT"
  ? "warning"
  : "neutral"
  }
  size="sm"
  >
  {wb.status === "ARRIVED"
  ? "Telah Tiba"
  : wb.status === "IN_TRANSIT"
  ? "Dalam Perjalanan"
  : "Disiapkan"}
  </Badge>
  <span className="text-xs font-mono font-bold text-text-muted">
  {wb.id}
  </span>
  <span className="text-xs text-text-muted">
  • {new Date(wb.dispatchedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
  </span>
  </div>

  <h4 className="text-base font-bold text-text-main truncate">
  {wb.quantity.toLocaleString()} {wb.unit} {wb.itemName}
  </h4>

  <p className="text-xs text-text-muted">
  Dari: <strong className="text-text-main">{wb.sourceHub}</strong> → Tujuan: <strong className="text-text-main">{wb.targetPoskoName}</strong>
  </p>

  <p className="text-xs text-text-muted">
  Kurir / Armada: <span className="font-semibold text-text-main">{wb.driverName}</span>
  </p>
  </div>

  <div className="flex sm:flex-col gap-2 shrink-0">
  <Button
  variant="secondary"
  size="sm"
  className="text-xs font-bold"
  onClick={() => setWaybillModal(wb)}
  >
  <Icon name="qr-code" variant="bold" size={14} className="mr-1" />
  QR Surat Jalan
  </Button>

  {wb.status === "IN_TRANSIT" && isLogisticsOfficer && (
  <Button
  variant="primary"
  size="sm"
  className="text-xs font-bold"
  onClick={() => handleConfirmArrival(wb)}
  >
  <Icon name="check" variant="bold" size={14} className="mr-1" />
  Konfirmasi Tiba
  </Button>
  )}
  </div>
  </div>
  </Card>
  ))}
  </div>
  )}
  </div>

  {/* 4. Modal Pengajuan Suplai Antar-Posko */}
  <Dialog
  open={createOpen}
  onOpenChange={setCreateOpen}
  title="Pengajuan Suplai Antar-Posko"
  description="Menerbitkan permintaan kiriman bantuan ke posko lain atau gudang sentral misi."
  >
  <form onSubmit={handleCreateWaybill} className="space-y-3 pt-1 text-xs">
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Posko / Hub Sasaran Suplai</label>
  <select
  value={targetPoskoId}
  onChange={(e) => setTargetPoskoId(e.target.value)}
  className="w-full h-10 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-text-main focus:ring-1 focus:ring-primary outline-none"
  >
  {poskos.map((p) => (
  <option key={p.id} value={p.id}>
  {p.name} ({p.locationName})
  </option>
  ))}
  </select>
  </div>

  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Komoditas Barang (Kamus uint8)</label>
  <select
  value={selectedCatalogId}
  onChange={(e) => setSelectedCatalogId(parseInt(e.target.value))}
  className="w-full h-10 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-text-main focus:ring-1 focus:ring-primary outline-none"
  >
  {Object.values(DISASTER_NEEDS_CATALOG).map((c) => (
  <option key={c.id} value={c.id}>
  [0x{c.id.toString(16).padStart(2, "0")}] {c.nameId} ({c.cluster})
  </option>
  ))}
  </select>
  </div>

  <div className="grid grid-cols-2 gap-2">
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Jumlah</label>
  <Input
  type="number"
  value={requestQty}
  onChange={(e) => setRequestQty(Number(e.target.value))}
  min={1}
  required
  className="h-9"
  />
  </div>
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Satuan</label>
  <select
  value={unit}
  onChange={(e) => setUnit(e.target.value)}
  className="w-full h-9 rounded-lg border border-border bg-surface px-2 text-xs font-semibold text-text-main focus:ring-1 focus:ring-primary outline-none"
  >
  <option value="KG">KG</option>
  <option value="LITER">LITER</option>
  <option value="KOTAK">KOTAK</option>
  <option value="DUS">DUS</option>
  <option value="STRIP">STRIP</option>
  <option value="PCS">PCS</option>
  <option value="SAK">SAK</option>
  <option value="GALON">GALON</option>
  <option value="TABUNG">TABUNG</option>
  <option value="UNIT">UNIT</option>
  </select>
  </div>
  </div>

  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Pengemudi / Nama Armada</label>
  <Input
  value={driverName}
  onChange={(e) => setDriverName(e.target.value)}
  placeholder="Contoh: Sopian (Truk Logistik #02)"
  className="h-9"
  />
  </div>

  <div className="pt-2 flex items-center gap-2">
  <Button
  type="button"
  variant="secondary"
  size="md"
  className="flex-1"
  onClick={() => setCreateOpen(false)}
  >
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  size="md"
  className="flex-1 justify-center font-bold"
  >
  Terbitkan Surat Jalan
  </Button>
  </div>
  </form>
  </Dialog>

  {/* 5. Modal QR Code Surat Jalan Real Offline SVG */}
  <Dialog
  open={Boolean(waybillModal)}
  onOpenChange={(open) => !open && setWaybillModal(null)}
  title={`Surat Jalan: ${waybillModal?.id || ""}`}
  description="Pindai QR ini saat armada pembawa bantuan tiba di posko penerima untuk verifikasi instan."
  >
  {waybillModal && (
  <div className="space-y-4 text-center pt-1 text-xs">
  <div className="p-4 bg-white border border-border rounded-2xl mx-auto w-52 h-52 flex flex-col items-center justify-center shadow-xs">
  <QRCodeSVG
  value={`SANDYA_WAYBILL_V1|${waybillModal.id}|${waybillModal.sourceHub}|${waybillModal.targetPoskoName}|${waybillModal.itemName}|${waybillModal.quantity}|${waybillModal.unit}|${waybillModal.dispatchedAt}`}
  size={180}
  className="mx-auto"
  />
  </div>

  <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-1 text-left">
  <p className="font-bold text-text-main text-sm">
  {waybillModal.quantity.toLocaleString()} {waybillModal.unit} {waybillModal.itemName}
  </p>
  <p className="text-[11px] text-text-muted">
  Dari: <strong>{waybillModal.sourceHub}</strong> → Tujuan: <strong>{waybillModal.targetPoskoName}</strong>
  </p>
  <p className="text-[11px] text-text-muted">
  Pengemudi: <span className="font-semibold text-text-main">{waybillModal.driverName}</span>
  </p>
  </div>

  <Button
  variant="primary"
  size="md"
  className="w-full justify-center font-bold"
  onClick={() => setWaybillModal(null)}
  >
  Tutup Lembar QR
  </Button>
  </div>
  )}
  </Dialog>
  </div>
  );
}
