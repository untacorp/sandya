"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";

export default function WaybillsPage() {
  const { session } = usePoskoStore();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [targetPosko, setTargetPosko] = React.useState("Gudang Sentral Misi GOR Pacet");
  const [requestItem, setRequestItem] = React.useState("Susu Formula Balita 400g");
  const [requestQty, setRequestQty] = React.useState(50);
  const [waybillModal, setWaybillModal] = React.useState<any | null>(null);

  const [waybills, setWaybills] = React.useState([
    {
      id: "WB-2026-081",
      from: "Gudang Sentral GOR Pacet",
      to: "Posko Lapangan RW 03 Kp. Cijedil",
      item: "Beras Premium 5kg",
      quantity: 500,
      unit: "KG",
      driverName: "Sopian (Sopir Truk #04)",
      status: "IN_TRANSIT",
      time: "Hari ini, 13:30 WIB",
    },
    {
      id: "WB-2026-079",
      from: "Posko Lapangan RW 02 Gasol",
      to: "Posko Lapangan RW 03 Kp. Cijedil",
      item: "Selimut Wool Hangat",
      quantity: 50,
      unit: "PCS",
      driverName: "Hendra (Relawan)",
      status: "DELIVERED",
      time: "Kemarin, 16:00 WIB",
    },
  ]);

  const handleCreateWaybill = (e: React.FormEvent) => {
    e.preventDefault();
    const newWb = {
      id: `WB-2026-0${waybills.length + 82}`,
      from: targetPosko,
      to: session.poskoName,
      item: requestItem,
      quantity: Number(requestQty),
      unit: "KOTAK",
      driverName: "Menunggu penugasan",
      status: "REQUESTED",
      time: "Baru saja",
    };
    setWaybills([newWb, ...waybills]);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          items={[
            { id: "stock", label: "Stok Gudang", icon: "box", href: `/posko/${session.poskoId}/logistics` },
            { id: "distribute", label: "Distribusi Bantuan", icon: "delivery", href: `/posko/${session.poskoId}/logistics/distribute` },
            { id: "waybills", label: "Surat Jalan Antar-Posko", icon: "waybill", badgeCount: 2, href: `/posko/${session.poskoId}/logistics/waybills` },
          ]}
          activeId="waybills"
          variant="segmented"
          className="w-full sm:w-auto"
        />

        <Button
          variant="primary"
          size="sm"
          icon="waybill"
          iconVariant="bold"
          onClick={() => setCreateOpen(true)}
        >
          + Minta Suplai Antar-Posko
        </Button>
      </div>

      {/* Waybills List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Daftar Pengiriman Antar-Posko
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {waybills.map((wb) => (
            <Card key={wb.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        wb.status === "DELIVERED"
                          ? "safe"
                          : wb.status === "IN_TRANSIT"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {wb.status === "DELIVERED"
                        ? "Telah Tiba"
                        : wb.status === "IN_TRANSIT"
                        ? "Dalam Perjalanan"
                        : "Diajukan"}
                    </Badge>
                    <span className="text-xs font-mono text-text-muted">
                      {wb.id}
                    </span>
                    <span className="text-xs text-text-muted">• {wb.time}</span>
                  </div>

                  <h4 className="text-base font-bold text-text-main">
                    {wb.quantity} {wb.unit} {wb.item}
                  </h4>

                  <p className="text-xs text-text-muted">
                    Dari: <strong>{wb.from}</strong> → Tujuan: <strong>{wb.to}</strong>
                  </p>

                  <p className="text-xs text-text-muted">
                    Kurir: {wb.driverName}
                  </p>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="qr-code"
                    iconVariant="bold"
                    onClick={() => setWaybillModal(wb)}
                  >
                    QR Surat Jalan
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Waybill Request Modal */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Pengajuan Suplai Antar-Posko"
        description="Menerbitkan permintaan kiriman bantuan ke posko lain."
        maxWidth="md"
      >
        <form onSubmit={handleCreateWaybill} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
              Posko Sasaran
            </label>
            <select
              value={targetPosko}
              onChange={(e) => setTargetPosko(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-surface text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Gudang Sentral Misi GOR Pacet">
                Gudang Sentral GOR Pacet
              </option>
              <option value="Posko Lapangan RW 02 Kp. Gasol">
                Posko RW 02 Kp. Gasol
              </option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
                Nama Barang
              </label>
              <Input
                value={requestItem}
                onChange={(e) => setRequestItem(e.target.value)}
                placeholder="Nama Barang"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
                Jumlah
              </label>
              <Input
                type="number"
                value={requestQty}
                onChange={(e) => setRequestQty(Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon="waybill"
              iconVariant="bold"
            >
              Kirim Pengajuan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* View QR Waybill Modal */}
      <Dialog
        open={Boolean(waybillModal)}
        onOpenChange={(open) => !open && setWaybillModal(null)}
        title={`Surat Jalan: ${waybillModal?.id || ""}`}
        description="Pindai QR ini saat armada pembawa bantuan tiba di posko."
        maxWidth="sm"
      >
        {waybillModal && (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-surface border-[2px] border-border rounded-2xl mx-auto w-52 h-52 flex flex-col items-center justify-center space-y-2">
              <Icon name="qr-code" variant="bold" size={120} className="text-primary" />
              <span className="text-[10px] font-mono text-text-muted">
                {waybillModal.id}
              </span>
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <p className="font-bold text-text-main text-sm">
                {waybillModal.quantity} {waybillModal.unit} {waybillModal.item}
              </p>
              <p>{waybillModal.driverName}</p>
            </div>

            <Button
              variant="primary"
              className="w-full"
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
