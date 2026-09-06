"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";

interface LogisticsLedgerProps {
  transactions: Array<{
    id: string;
    quantityChange: number;
    note?: string;
    officerName: string;
    referenceTicketId?: string | null;
    txType: string;
  }>;
}

export function LogisticsLedger({ transactions }: LogisticsLedgerProps) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      let matchType = true;
      if (filterType === "RESTOCK") matchType = tx.txType === "RESTOCK";
      else if (filterType === "DISTRIBUTION") matchType = tx.txType === "DISTRIBUTION";
      else if (filterType === "DAMAGE") matchType = tx.txType === "DAMAGE";
      else if (filterType === "TRANSFER") matchType = tx.txType === "TRANSFER_IN" || tx.txType === "TRANSFER_OUT" || tx.txType === "TRANSFER";

      // Search Query
      let matchSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchSearch =
          (tx.note?.toLowerCase().includes(q) ?? false) ||
          tx.officerName.toLowerCase().includes(q) ||
          (tx.referenceTicketId?.toLowerCase().includes(q) ?? false) ||
          tx.txType.toLowerCase().includes(q);
      }

      return matchType && matchSearch;
    });
  }, [transactions, filterType, searchQuery]);

  const totalIn = useMemo(() => {
    return transactions
      .filter((t) => t.quantityChange > 0)
      .reduce((acc, t) => acc + t.quantityChange, 0);
  }, [transactions]);

  const totalOut = useMemo(() => {
    return transactions
      .filter((t) => t.quantityChange < 0)
      .reduce((acc, t) => acc + Math.abs(t.quantityChange), 0);
  }, [transactions]);

  return (
    <Card className="shadow-2xs h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Icon name="waybill" variant="bold" size={16} className="text-primary" />
            Buku Kas Mutasi Stok
          </span>
          <span className="text-xs font-normal text-text-muted">
            {transactions.length} Transaksi
          </span>
        </CardTitle>

        {/* Ringkasan Masuk vs Keluar */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="p-2 rounded-lg bg-status-safe-bg/30 border border-status-safe-border flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted">Total Masuk</span>
            <span className="text-xs font-black text-status-safe">+{totalIn.toLocaleString()}</span>
          </div>
          <div className="p-2 rounded-lg bg-surface-subtle border border-border flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted">Total Keluar</span>
            <span className="text-xs font-black text-text-main">-{totalOut.toLocaleString()}</span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-2 pt-2">
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi / petugas..."
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { id: "ALL", label: "Semua" },
              { id: "RESTOCK", label: "Masuk" },
              { id: "DISTRIBUTION", label: "Disalurkan" },
              { id: "DAMAGE", label: "Rusak" },
              { id: "TRANSFER", label: "Transfer" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${
                  filterType === tab.id
                    ? "bg-primary text-white"
                    : "bg-surface-subtle text-text-muted hover:bg-surface-hover"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border text-xs">
          {filteredTransactions.length === 0 ? (
            <p className="text-xs text-text-subtle py-8 text-center">
              {transactions.length === 0
                ? "Belum ada catatan transaksi stok."
                : "Tidak ada transaksi yang cocok dengan filter."}
            </p>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md font-black text-[11px] shrink-0 ${
                      tx.quantityChange > 0
                        ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                        : tx.txType === "DAMAGE"
                        ? "bg-status-danger-bg text-status-danger border border-status-danger-border"
                        : "bg-surface-muted text-text-muted border border-border"
                    }`}
                  >
                    {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-text-main truncate">
                      {tx.note || "Perubahan Saldo Stok Fisik"}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      Otorisasi: {tx.officerName}
                      {tx.referenceTicketId ? ` • Ref: ${tx.referenceTicketId}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge
                    variant={
                      tx.txType === "RESTOCK"
                        ? "safe"
                        : tx.txType === "DISTRIBUTION"
                        ? "neutral"
                        : tx.txType === "DAMAGE"
                        ? "danger"
                        : "warning"
                    }
                    size="sm"
                  >
                    {tx.txType === "RESTOCK"
                      ? "Barang Masuk"
                      : tx.txType === "DISTRIBUTION"
                      ? "Disalurkan"
                      : tx.txType === "DAMAGE"
                      ? "Rusak"
                      : "Transfer"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
