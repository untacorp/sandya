"use client";

import React from "react";
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
  return (
    <Card className="shadow-2xs h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Icon name="waybill" variant="bold" size={16} className="text-primary" />
            Catatan Keluar-Masuk
          </span>
          <span className="text-xs font-normal text-text-muted">
            {transactions.length} Transaksi
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border text-xs">
          {transactions.length === 0 ? (
            <p className="text-xs text-text-subtle py-4 text-center">
              Belum ada catatan transaksi stok.
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md font-black text-[11px] shrink-0 ${
                      tx.quantityChange > 0
                        ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                        : "bg-surface-muted text-text-muted border border-border"
                    }`}
                  >
                    {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-text-main truncate">
                      {tx.note || "Perubahan Saldo Stok Fisik"}
                    </p>
                    <p className="text-[11px] text-text-muted">
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
