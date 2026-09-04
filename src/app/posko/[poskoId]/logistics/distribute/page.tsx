"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Tabs } from "@/shared/ui/tabs";

export default function LogisticsDistributePage() {
  const { session, needsTickets, inventory, allocateStock, completeDelivery } = usePoskoStore();

  const isLogisticsOfficer = session.userRole === "PETUGAS_LOGISTIK" || session.userRole === "KOORDINATOR_POSKO";

  const handleApprove = (ticketId: string, itemName: string, qty: number) => {
    const item = inventory.find((i) => i.itemName.toLowerCase().includes(itemName.toLowerCase()));
    if (item) {
      allocateStock(ticketId, item.id, qty);
    } else if (inventory.length > 0) {
      allocateStock(ticketId, inventory[0].id, qty);
    }
  };

  const pendingTickets = needsTickets.filter((t) => t.status === "PENDING");
  const allocatedTickets = needsTickets.filter((t) => t.status === "ALLOCATED");
  const completedTickets = needsTickets.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <Tabs
        items={[
          { id: "stock", label: "Stok Gudang", icon: "box", href: `/posko/${session.poskoId}/logistics` },
          { id: "distribute", label: "Distribusi Bantuan", icon: "delivery", badgeCount: pendingTickets.length, href: `/posko/${session.poskoId}/logistics/distribute` },
          { id: "waybills", label: "Surat Jalan Antar-Posko", icon: "waybill", href: `/posko/${session.poskoId}/logistics/waybills` },
        ]}
        activeId="distribute"
        variant="segmented"
        className="w-full sm:w-auto"
      />

      {/* 3 Column Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Pending */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border-[1.5px] border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
                Permintaan Masuk
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Menunggu persetujuan gudang
              </p>
            </div>
            <span className="text-xs font-bold text-text-muted px-2 py-0.5 rounded-full bg-surface-muted border border-border">
              {pendingTickets.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-subtle border border-dashed border-border rounded-xl">
                Tidak ada permintaan tertunda
              </div>
            ) : (
              pendingTickets.map((t) => (
                <Card key={t.id} className="p-3.5 space-y-2.5 border-border bg-surface">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={t.urgency === "HIGH" ? "danger" : "warning"} size="sm">
                      {t.urgency === "HIGH" ? "Mendesak" : "Menunggu"}
                    </Badge>
                    <span className="text-[11px] font-mono text-text-muted">
                      {t.id}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-main">
                      {t.quantity} {t.unit} {t.itemName}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Untuk: {t.refugeeName} ({t.shelterLocation})
                    </p>
                  </div>

                  {isLogisticsOfficer ? (
                    <Button
                      variant="warning"
                      size="sm"
                      className="w-full justify-center"
                      icon="check"
                      iconVariant="bold"
                      onClick={() => handleApprove(t.id, t.itemName, t.quantity)}
                    >
                      Setujui & Kurangi Stok
                    </Button>
                  ) : (
                    <p className="text-xs text-center text-text-subtle">
                      Menunggu persetujuan petugas gudang
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Allocated */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border-[1.5px] border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-safe" />
                Siap Diantar
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Barang siap diantar ke tenda
              </p>
            </div>
            <span className="text-xs font-bold text-text-muted px-2 py-0.5 rounded-full bg-surface-muted border border-border">
              {allocatedTickets.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {allocatedTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-subtle border border-dashed border-border rounded-xl">
                Tidak ada barang siap antar
              </div>
            ) : (
              allocatedTickets.map((t) => (
                <Card key={t.id} className="p-3.5 space-y-2.5 border-border bg-surface">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="safe" size="sm">
                      Siap Antar
                    </Badge>
                    <span className="text-[11px] font-mono text-text-muted">
                      {t.id}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-main">
                      {t.quantity} {t.unit} {t.itemName}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Tujuan: {t.refugeeName} ({t.shelterLocation})
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    icon="delivery"
                    iconVariant="bold"
                    onClick={() => completeDelivery(t.id)}
                  >
                    Konfirmasi Diterima di Tenda
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border-[1.5px] border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-text-subtle" />
                Telah Diterima
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Bantuan selesai disalurkan
              </p>
            </div>
            <span className="text-xs font-bold text-text-muted px-2 py-0.5 rounded-full bg-surface-muted border border-border">
              {completedTickets.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {completedTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-subtle border border-dashed border-border rounded-xl">
                Belum ada bantuan selesai
              </div>
            ) : (
              completedTickets.map((t) => (
                <Card key={t.id} className="p-3.5 space-y-2 border-border bg-surface opacity-85">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="neutral" size="sm">
                      Selesai
                    </Badge>
                    <span className="text-[11px] font-mono text-text-muted">
                      {t.id}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-main">
                      {t.quantity} {t.unit} {t.itemName}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Penerima: {t.refugeeName} ({t.shelterLocation})
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
