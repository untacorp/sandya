"use client";
import { Select } from "@/shared/ui/select";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePoskoStore, type MacroWaybill } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { QRCodeSVG } from "@/shared/ui/qr-code-svg";

export default function MissionLogisticsHubPage() {
  const params = useParams();
  const routeMissionId = params?.missionId as string;
  const { session, centralInventory, missionWaybills, poskos, issueMissionWaybill } = usePoskoStore();

  const effectiveMissionId = routeMissionId || session.missionId;
  const missionPoskos = poskos.filter((p) => !effectiveMissionId || p.missionId === effectiveMissionId);

  const [dispatchModalOpen, setDispatchModalOpen] = React.useState(false);
  const [selectedPoskoId, setSelectedPoskoId] = React.useState(missionPoskos[0]?.id || "POS-01");
  const [selectedItem, setSelectedItem] = React.useState(centralInventory[0]?.itemName || "");
  const [qty, setQty] = React.useState(1);
  const [driverName, setDriverName] = React.useState("");

  React.useEffect(() => {
    if (missionPoskos.length > 0 && !missionPoskos.some((p) => p.id === selectedPoskoId)) {
      setSelectedPoskoId(missionPoskos[0].id);
    }
  }, [missionPoskos, selectedPoskoId]);

  const [waybillModal, setWaybillModal] = React.useState<MacroWaybill | null>(null);

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetP = poskos.find((p) => p.id === selectedPoskoId);

    issueMissionWaybill({
      missionId: effectiveMissionId,
      sourceHub: session.poskoName || "Gudang Sentral Logistik",
      targetPoskoId: selectedPoskoId,
      targetPoskoName: targetP?.name || "Posko Lapangan",
      itemName: selectedItem,
      quantity: Number(qty),
      unit: "SAK",
      status: "IN_TRANSIT",
      driverName: driverName || "Menunggu Penugasan Armada",
    });

    setDispatchModalOpen(false);
  };

  return (
  <div className="space-y-5">
  {/* Top Header without redundant back button */}
  <PageHeader
  title="Gudang Logistik Wilayah"
  >
  <Button
  variant="primary"
  size="sm"
  icon="delivery"
  iconVariant="bold"
  className="w-full sm:w-auto"
  onClick={() => setDispatchModalOpen(true)}
  >
  + Terbitkan Surat Jalan Truk
  </Button>
  </PageHeader>

  {/* Central Inventory Stock */}
  <div className="space-y-2.5">
  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
  Stok Bantuan di Gudang Wilayah
  </h3>
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
  {centralInventory.map((item) => (
  <StatCard
  key={item.id}
  title={item.itemName}
  value={item.currentQuantity.toLocaleString()}
  unit={item.unit}
  subtitle={`Ketahanan ~${item.burnRateDays} Hari`}
  icon="box"
  variant={item.category === "FOOD" ? "safe" : item.category === "MEDICAL" ? "danger" : "default"}
  />
  ))}
  </div>
  </div>

  {/* Waybills Dispatch List */}
  <Card>
  <CardHeader>
  <CardTitle>Pengiriman Bantuan ke Posko</CardTitle>
  </CardHeader>
  <CardContent>
  <div className="divide-y divide-border">
  {missionWaybills.map((wb) => (
  <div
  key={wb.id}
  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
  >
  <div className="space-y-1 min-w-0">
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
  : "Persiapan"}
  </Badge>
  <span className="text-xs font-mono text-text-muted">
  {wb.id}
  </span>
  </div>
  <h4 className="text-sm font-bold text-text-main truncate">
  {wb.quantity} {wb.unit} {wb.itemName}
  </h4>
  <p className="text-xs text-text-muted">
  Tujuan: <strong>{wb.targetPoskoName}</strong> • Sopir: {wb.driverName}
  </p>
  </div>

  <div className="flex items-center gap-2 shrink-0">
  <Button
  variant="secondary"
  size="sm"
  icon="qr-code"
  iconVariant="bold"
  className="w-full sm:w-auto"
  onClick={() => setWaybillModal(wb)}
  >
  Buka QR Surat Jalan
  </Button>
  </div>
  </div>
  ))}
  </div>
  </CardContent>
  </Card>

  {/* Dispatch Modal */}
  <Dialog
  open={dispatchModalOpen}
  onOpenChange={setDispatchModalOpen}
  title="Terbitkan Surat Jalan Pengiriman Bantuan"
  description="Menerbitkan dokumen pengantaran barang bantuan ke posko tujuan."
  maxWidth="md"
  >
  <form onSubmit={handleCreateDispatch} className="space-y-4">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Posko Lapangan Tujuan
  </label>
  <Select value={selectedPoskoId}
  onChange={(val) => setSelectedPoskoId(val)}
  options={missionPoskos.map((p) => ({ value: p.id, label: `${p.name} (${p.locationName})` }))}
  />
  </div>

  <div className="grid grid-cols-3 gap-2">
  <div className="col-span-2">
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Komoditas Barang
  </label>
  <Select value={selectedItem}
  onChange={(val) => setSelectedItem(val)}
  options={centralInventory.map((i) => ({ value: i.itemName, label: `${i.itemName} (Stok: ${i.currentQuantity} ${i.unit})` }))}
  />
  </div>
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Jumlah
  </label>
  <Input type="number"
  value={qty}
  onChange={(e) => setQty(Number(e.target.value))}
  min={1}
  required
  />
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Pengemudi / Nama Armada
  </label>
  <Input value={driverName}
  onChange={(e) => setDriverName(e.target.value)}
  placeholder="Contoh: Sopian (Truk #02)"
  icon="user"
  required
  />
  </div>

  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
  <Button
  type="button"
  variant="outline"
  className="w-full sm:w-auto"
  onClick={() => setDispatchModalOpen(false)}
  >
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  icon="delivery"
  iconVariant="bold"
  className="w-full sm:w-auto"
  >
  Terbitkan Surat Jalan
  </Button>
  </div>
  </form>
  </Dialog>

  {/* Waybill QR Modal */}
  <Dialog
  open={Boolean(waybillModal)}
  onOpenChange={(open) => !open && setWaybillModal(null)}
  title={`Surat Jalan: ${waybillModal?.id || ""}`}
  description="Pindai QR ini saat armada tiba di posko tujuan untuk konfirmasi penerimaan."
  maxWidth="sm"
  >
  {waybillModal && (
  <div className="space-y-4 text-center">
  <div className="p-4 bg-white border border-border rounded-2xl mx-auto w-52 h-52 flex flex-col items-center justify-center shadow-xs">
  <QRCodeSVG
  value={`SANDYA_WAYBILL_V1|${waybillModal.id}|${waybillModal.sourceHub}|${waybillModal.targetPoskoName}|${waybillModal.itemName}|${waybillModal.quantity}|${waybillModal.unit}|${waybillModal.dispatchedAt || Date.now()}`}
  size={180}
  className="mx-auto"
  />
  </div>

  <div className="text-xs text-text-muted space-y-0.5">
  <p className="font-bold text-text-main text-sm">
  {waybillModal.quantity} {waybillModal.unit} {waybillModal.itemName}
  </p>
  <p>Tujuan: <strong>{waybillModal.targetPoskoName}</strong></p>
  <p>Pengemudi: {waybillModal.driverName}</p>
  </div>

  <Button
  variant="primary"
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
