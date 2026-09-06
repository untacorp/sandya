"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

interface InventoryStock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  burnRateDays: number;
  minimumReserve: number;
}

const INITIAL_STOCKS: InventoryStock[] = [
  {
    id: "LOG-01",
    name: "Beras Sentra Cugenang",
    category: "Pangan Pokok",
    quantity: 350,
    unit: "kg",
    burnRateDays: 4,
    minimumReserve: 100,
  },
  {
    id: "LOG-02",
    name: "Selimut Wol Tebal",
    category: "Papan & Hangat",
    quantity: 120,
    unit: "lembar",
    burnRateDays: 6,
    minimumReserve: 30,
  },
  {
    id: "LOG-03",
    name: "Paket Antibiotik & P3K",
    category: "Medis Darurat",
    quantity: 45,
    unit: "kotak",
    burnRateDays: 2,
    minimumReserve: 20,
  },
];

export function InteractiveLogisticsLedger() {
  const [stocks, setStocks] = React.useState<InventoryStock[]>(INITIAL_STOCKS);
  const [recentTx, setRecentTx] = React.useState<string>(
    "Sistem siap: Menunggu instruksi mutasi logistik posko."
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleDisburse = (id: string, amount: number) => {
    setErrorMessage(null);
    setStocks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.quantity < amount) {
          setErrorMessage(
            `Gagal mutasi: Stok ${item.name} tidak mencukupi (sisa ${item.quantity} ${item.unit}). Mutasi dibatalkan otomatis.`
          );
          return item;
        }
        const newQty = item.quantity - amount;
        setRecentTx(`Pengeluaran: -${amount} ${item.unit} ${item.name} berhasil diverifikasi.`);
        return {
          ...item,
          quantity: newQty,
          burnRateDays: Math.max(1, Math.round((newQty / (item.minimumReserve || 1)) * 2)),
        };
      })
    );
  };

  const handleRestock = (id: string, amount: number) => {
    setErrorMessage(null);
    setStocks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = item.quantity + amount;
        setRecentTx(`Penerimaan pasokan: +${amount} ${item.unit} ${item.name} dicatat ke buku.`);
        return {
          ...item,
          quantity: newQty,
          burnRateDays: Math.round((newQty / (item.minimumReserve || 1)) * 2),
        };
      })
    );
  };

  const handleReset = () => {
    setStocks(INITIAL_STOCKS);
    setErrorMessage(null);
    setRecentTx("Buku logistik direset ke nilai awal simulasi.");
  };

  return (
    <div className="rounded-xl border-[1.5px] border-border bg-surface overflow-hidden shadow-2xs">
      <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-main text-base">
            Simulator Logistik Gudang (Satu Pemegang Buku)
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Mencegah bantuan ganda dan stok fiktif saat jaringan komunikasi terputus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted bg-surface px-2.5 py-1 rounded-md border border-border">
            Single-Writer Invariant
          </span>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7 px-2">
            Reset Data
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Status Mutasi Terakhir */}
        <div className="text-xs p-3 rounded-lg border border-border bg-surface-subtle flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-text-muted min-w-0">
            <Icon name="waybill" variant="linear" size={16} className="shrink-0 text-text-muted" />
            <span className="truncate">{recentTx}</span>
          </div>
          <span className="font-mono text-xs text-status-safe shrink-0 font-medium">
            Terkunci Ed25519
          </span>
        </div>

        {errorMessage && (
          <div className="text-xs p-3 rounded-lg border border-status-danger-border bg-status-danger-bg text-status-danger flex items-start gap-2">
            <Icon name="shield" variant="bold" size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tabel Stok Barang */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {stocks.map((item) => {
            const isLow = item.quantity <= item.minimumReserve;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border-[1.5px] border-border bg-surface hover:border-border-hover transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-text-muted uppercase">
                      {item.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isLow
                          ? "bg-status-danger-bg text-status-danger border border-status-danger-border"
                          : "bg-surface-muted text-text-muted border border-border"
                      }`}
                    >
                      {item.burnRateDays} hari ketahanan
                    </span>
                  </div>

                  <h4 className="font-semibold text-text-main text-sm mt-1">
                    {item.name}
                  </h4>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-text-main">
                      {item.quantity}
                    </span>
                    <span className="text-xs text-text-muted font-medium">
                      {item.unit}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs justify-center"
                    onClick={() => handleDisburse(item.id, item.id === "LOG-01" ? 50 : 15)}
                  >
                    Salurkan (-{item.id === "LOG-01" ? 50 : 15})
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs px-2.5"
                    onClick={() => handleRestock(item.id, 50)}
                  >
                    + Masuk
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
