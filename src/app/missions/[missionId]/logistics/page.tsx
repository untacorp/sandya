"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";

export default function MissionLogisticsHubPage() {
  const { session, centralInventory, missionWaybills, poskos, issueMissionWaybill } = usePoskoStore();

  const [dispatchModalOpen, setDispatchModalOpen] = React.useState(false);
  const [selectedPoskoId, setSelectedPoskoId] = React.useState("POS-01");
  const [selectedItem, setSelectedItem] = React.useState("Beras Premium 50kg");
  const [qty, setQty] = React.useState(20);
  const [driverName, setDriverName] = React.useState("Sopian (Truk Logistik #02)");

  const [waybillModal, setWaybillModal] = React.useState<any | null>(null);

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetP = poskos.find((p) => p.id === selectedPoskoId);

    issueMissionWaybill({
      missionId: session.missionId,
      sourceHub: "Gudang Sentral GOR Pacet",
      targetPoskoId: selectedPoskoId,
      targetPoskoName: targetP?.name || "Posko Lapangan",
      itemName: selectedItem,
      quantity: Number(qty),
      unit: "SAK",
      status: "IN_TRANSIT",
      driverName,
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
            <select
              value={selectedPoskoId}
              onChange={(e) => setSelectedPoskoId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {poskos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.locationName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Komoditas Barang
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {centralInventory.map((i) => (
                  <option key={i.id} value={i.itemName}>
                    {i.itemName} (Stok: {i.currentQuantity} {i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Jumlah
              </label>
              <Input
                type="number"
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
            <Input
              value={driverName}
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
            <div className="w-48 h-48 mx-auto p-4 rounded-xl bg-surface border border-border flex flex-col items-center justify-center space-y-2 shadow-xs">
              <Icon name="qr-code" variant="bold" size={130} className="text-primary" />
            </div>

            <div className="text-xs text-text-muted space-y-0.5">
              <p className="font-bold text-text-main text-sm">
                {waybillModal.quantity} {waybillModal.unit} {waybillModal.itemName}
              </p>
              <p>Tujuan: {waybillModal.targetPoskoName}</p>
              <p>Pengemudi: {waybillModal.driverName}</p>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setWaybillModal(null)}
            >
              Tutup
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
