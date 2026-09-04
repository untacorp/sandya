"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Tabs } from "@/shared/ui/tabs";
import { type ItemCategory } from "@/shared/types";

export default function LogisticsPage() {
  const { session, inventory, transactions, addRestock } = usePoskoStore();

  const [restockOpen, setRestockOpen] = React.useState(false);
  const [itemName, setItemName] = React.useState("");
  const [category, setCategory] = React.useState<ItemCategory>("FOOD");
  const [qty, setQty] = React.useState<number | "">("");
  const [unit, setUnit] = React.useState("KG");

  const isLogisticsOfficer = session.userRole === "PETUGAS_LOGISTIK" || session.userRole === "KOORDINATOR_POSKO";

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || qty === "") return;

    addRestock(itemName.trim(), category, Number(qty), unit.trim().toUpperCase());
    setItemName("");
    setQty("");
    setRestockOpen(false);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "FOOD":
        return "Bahan Makanan";
      case "MEDICAL":
        return "Obat & Medis";
      case "BABY_SUPPLIES":
        return "Kebutuhan Bayi";
      case "SHELTER":
        return "Tenda & Terpal";
      case "CLOTHING":
        return "Pakaian & Selimut";
      default:
        return "Logistik Umum";
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sub-Navigasi Logistik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          items={[
            { id: "stock", label: "Stok Barang", icon: "box", href: `/posko/${session.poskoId}/logistics` },
            { id: "distribute", label: "Salurkan Bantuan", icon: "delivery", href: `/posko/${session.poskoId}/logistics/distribute` },
            { id: "waybills", label: "Kirim Antar-Posko", icon: "waybill", href: `/posko/${session.poskoId}/logistics/waybills` },
          ]}
          activeId="stock"
          variant="segmented"
          className="w-full sm:w-auto"
        />

        {isLogisticsOfficer && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRestockOpen(true)}
          >
            + Catat Barang Masuk
          </Button>
        )}
      </div>

      {/* 2. Grid Stok Barang (Spasi Rasional) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Ketersediaan Stok di Posko
          </h2>
          <span className="text-xs text-text-muted">
            {inventory.length} Jenis Barang
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {inventory.map((item) => {
            const isCritical = item.burnRateDays <= 1 || item.currentQuantity <= 10;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border bg-surface shadow-2xs space-y-2.5 ${
                  isCritical ? "border-status-danger-border bg-status-danger-bg/15" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-text-muted font-medium block">
                      {getCategoryLabel(item.category)}
                    </span>
                    <h3 className="text-sm font-bold text-text-main mt-0.5">
                      {item.itemName}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${isCritical ? "text-status-danger" : "text-text-main"}`}>
                      {item.currentQuantity}
                    </p>
                    <span className="text-[11px] text-text-muted font-medium">{item.unit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/80">
                  <span className="text-text-muted">Perkiraan Habis:</span>
                  <span className={`font-semibold ${isCritical ? "text-status-danger" : "text-text-main"}`}>
                    {isCritical ? "Kurang dari 24 Jam" : `~${item.burnRateDays} Hari`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Riwayat Keluar-Masuk Barang */}
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="text-sm">Catatan Keluar-Masuk Barang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border text-xs">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      tx.quantityChange > 0
                        ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                        : "bg-surface-muted text-text-muted border border-border"
                    }`}
                  >
                    {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-main truncate">
                      {tx.note || "Perubahan Stok"}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Dicatat oleh: {tx.officerName}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-text-muted shrink-0">
                  {tx.txType === "RESTOCK" ? "Barang Masuk" : "Disalurkan"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Modal Terima Barang Masuk */}
      <Dialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        title="Catat Barang Masuk (Restock)"
        description="Masukkan data bantuan logistik yang baru tiba di gudang posko."
      >
        <form onSubmit={handleSaveRestock} className="space-y-3 pt-1 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-text-main block">Nama Barang</label>
            <Input
              placeholder="misal: Beras Premium 5kg / Selimut"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Jumlah</label>
              <Input
                type="number"
                placeholder="misal: 50"
                value={qty}
                onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                required
                min={1}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Satuan</label>
              <Input
                placeholder="KG / DUS / KOTAK"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setRestockOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 justify-center"
            >
              Simpan Stok Masuk
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
