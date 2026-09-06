"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asPoskoId, asItemId } from "@/core/shared/branded-types";
import { InventoryAggregate, type InventoryCategory } from "@/core/domain/logistics/inventory.aggregate";

const toInventoryCategory = (cat: string): InventoryCategory => {
  if (cat === "BABY_SUPPLIES") return "INFANT";
  if (["FOOD", "CLOTHING", "MEDICAL", "HYGIENE", "SHELTER", "INFANT", "ASSISTIVE", "EMERGENCY_TOOLS"].includes(cat)) {
    return cat as InventoryCategory;
  }
  return "OTHER";
};
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { Dialog } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { type NeedsTicket } from "@/shared/types";

export default function LogisticsDistributePage() {
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const { session, needsTickets, inventory, allocateStock, completeDelivery } = usePoskoStore();
  const effectivePoskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : session.poskoId;

  const poskoTickets = React.useMemo(() => {
    return needsTickets.filter((t) => t.postId === effectivePoskoId);
  }, [needsTickets, effectivePoskoId]);

  const poskoInventory = React.useMemo(() => {
    return inventory.filter((i) => i.postId === effectivePoskoId);
  }, [inventory, effectivePoskoId]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const [selectedTicketForAllocation, setSelectedTicketForAllocation] = React.useState<NeedsTicket | null>(null);
  const [selectedItemId, setSelectedItemId] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const authorizedRoles = [
  "PETUGAS_LOGISTIK",
  "LOGISTIK",
  "KOORDINATOR_POSKO",
  "KOORDINATOR",
  "KOMANDAN_MISI",
  "PEMIMPIN_ORGANISASI",
  ];
  const isLogisticsOfficer = authorizedRoles.includes(session.userRole);

  const openApproveModal = (ticket: NeedsTicket) => {
  setErrorMessage(null);
  setSelectedTicketForAllocation(ticket);
  // Find best match in inventory
  const matched = poskoInventory.find((i) =>
  i.itemName.toLowerCase().includes(ticket.itemName.toLowerCase()) ||
  ticket.itemName.toLowerCase().includes(i.itemName.toLowerCase())
  );
  setSelectedItemId(matched?.id || (poskoInventory.length > 0 ? poskoInventory[0]?.id || "" : ""));
  };

  const handleExecuteApproval = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedTicketForAllocation || !selectedItemId) return;

  if (!isLogisticsOfficer) {
  setErrorMessage("Akses ditolak: Hanya Petugas Logistik atau Koordinator yang berhak memotong stok fisik.");
  return;
  }

  setIsProcessing(true);
  setErrorMessage(null);

  try {
  const targetItem = inventory.find((i) => i.id === selectedItemId);
  if (!targetItem) {
  setErrorMessage("Barang logistik tidak ditemukan di inventaris posko.");
  setIsProcessing(false);
  return;
  }

  if (targetItem.currentQuantity < selectedTicketForAllocation.quantity) {
  setErrorMessage(
  `Stok fisik ${targetItem.itemName} tidak mencukupi! Tersedia di gudang: ${targetItem.currentQuantity} ${targetItem.unit}, dibutuhkan: ${selectedTicketForAllocation.quantity} ${selectedTicketForAllocation.unit}.`
  );
  setIsProcessing(false);
  return;
  }

  const container = ServiceContainer.getInstance();

  // Pastikan item terdaftar di inventoryRepo SQLite backend (jika tersimpan dari sesi sebelumnya)
  const existingAggRes = await container.inventoryRepo.findById(asItemId(targetItem.id));
  if (!existingAggRes.ok || !existingAggRes.value) {
  const agg = InventoryAggregate.reconstitute({
  id: asItemId(targetItem.id),
  poskoId: asPoskoId(effectivePoskoId),
  itemName: targetItem.itemName,
  category: toInventoryCategory(targetItem.category),
  currentQuantity: targetItem.currentQuantity,
  unit: targetItem.unit,
  lastUpdatedAt: targetItem.lastUpdatedAt,
  version: 1,
  });
  await container.inventoryRepo.save(agg);
  }

  const mutateRes = await container.mutateStockUseCase.execute({
  poskoId: effectivePoskoId,
  itemId: targetItem.id,
  officerId: session.userId,
  officerRole: session.userRole,
  txType: "DISTRIBUTION",
  quantityChange: -selectedTicketForAllocation.quantity,
  referenceTicketId: selectedTicketForAllocation.id,
  logicalSeq: Date.now(),
  notes: `Alokasi bantuan warga: ${selectedTicketForAllocation.refugeeName} (${selectedTicketForAllocation.shelterLocation})`,
  });

  if (!mutateRes.ok) {
  setErrorMessage(mutateRes.error.message);
  setIsProcessing(false);
  return;
  }

  // Update zustand store
  allocateStock(selectedTicketForAllocation.id, targetItem.id, selectedTicketForAllocation.quantity);

  setSuccessToast(
  `Tiket ${selectedTicketForAllocation.id} disetujui. Stok ${targetItem.itemName} berhasil dikurangi ${selectedTicketForAllocation.quantity} ${targetItem.unit}.`
  );
  setTimeout(() => setSuccessToast(null), 4500);

  setSelectedTicketForAllocation(null);
  } catch (err: unknown) {
  setErrorMessage((err as Error)?.message || "Terjadi kesalahan saat memproses alokasi stok.");
  } finally {
  setIsProcessing(false);
  }
  };

  const handleCompleteDelivery = (ticket: NeedsTicket) => {
  completeDelivery(ticket.id);
  setSuccessToast(`Bantuan ${ticket.quantity} ${ticket.unit} ${ticket.itemName} telah diserahterimakan kepada ${ticket.refugeeName}.`);
  setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredTickets = React.useMemo(() => {
  if (!searchQuery.trim()) return poskoTickets;
  const q = searchQuery.toLowerCase();
  return poskoTickets.filter(
  (t) =>
  t.refugeeName.toLowerCase().includes(q) ||
  t.itemName.toLowerCase().includes(q) ||
  t.shelterLocation?.toLowerCase().includes(q) ||
  t.id.toLowerCase().includes(q)
  );
  }, [poskoTickets, searchQuery]);

  const pendingTickets = filteredTickets.filter((t) => t.status === "PENDING");
  const allocatedTickets = filteredTickets.filter((t) => t.status === "ALLOCATED");
  const completedTickets = filteredTickets.filter((t) => t.status === "COMPLETED");

  return (
  <div className="space-y-4">
  {/* 1. Sub-Tabs */}

  {/* 2. Banner Notifikasi RBAC & Sukses */}
  {!isLogisticsOfficer && (
  <AlertBanner
  variant="warning"
  title="Mode Peninjauan (Read-Only)"
  description="Penyaluran dan pemotongan stok fisik dari antrean permintaan hanya dapat disetujui oleh Petugas Logistik atau Koordinator Posko."
  icon="shield"
  />
  )}

  {successToast && (
  <AlertBanner
  variant="safe"
  title="Status Distribusi Diperbarui"
  description={successToast}
  icon="check"
  />
  )}

  {/* 3. Bar Pencarian */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border shadow-2xs">
  <div className="relative flex-1">
  <Icon
  name="search"
  variant="linear"
  size={16}
  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
  />
  <Input value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Cari tiket berdasarkan nama penerima, komoditas, atau nomor tiket..."
  className="pl-9 text-xs h-10"
  />
  </div>
  <div className="flex items-center gap-2">
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border text-xs font-semibold text-text-main">
  <Icon name="delivery" variant="bold" size={14} className="text-primary" />
  <span>Total Tiket: {needsTickets.length}</span>
  </div>
  </div>
  </div>

  {/* 4. 3-Column Kanban Board (High-Contrast & Outdoor-Ready) */}
  {needsTickets.length === 0 ? (
  <EmptyState
  icon="delivery"
  title="Belum Ada Tiket Kebutuhan Warga"
  description="Belum ada permintaan bantuan logistik atau resep farmasi yang diajukan untuk warga di posko ini."
  actionLabel="+ Lihat Daftar Warga"
  actionIcon="users"
  actionHref={`/posko/${session.poskoId}/refugees`}
  />
  ) : (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  {/* Kolom 1: Permintaan Masuk (PENDING) */}
  <div className="rounded-xl border border-border bg-surface flex flex-col min-h-[280px] lg:min-h-[480px] shadow-2xs overflow-hidden">
  <div className="p-3 border-b border-status-warning-border bg-status-warning-bg/20 flex items-center justify-between">
  <div>
  <h3 className="text-xs font-black uppercase tracking-wider text-status-warning flex items-center gap-1.5">
  <span className="w-2.5 h-2.5 rounded-full bg-status-warning ring-2 ring-status-warning/30" />
  Permintaan Masuk (Antrean)
  </h3>
  <p className="text-[11px] text-text-muted mt-0.5">
  Menunggu persetujuan fisik gudang
  </p>
  </div>
  <span className="text-xs font-black text-text-main px-2 py-0.5 rounded-md bg-surface border border-border shadow-2xs">
  {pendingTickets.length}
  </span>
  </div>

  <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[640px]">
  {pendingTickets.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center text-text-subtle space-y-1">
  <Icon name="check" variant="linear" size={24} className="text-border" />
  <p className="text-xs">Tidak ada permintaan tertunda</p>
  </div>
  ) : (
  pendingTickets.map((t) => (
  <Card key={t.id} className="p-3.5 space-y-2.5 border-border bg-surface shadow-2xs hover:border-primary/50 transition-colors">
  <div className="flex items-center justify-between gap-2">
  <Badge variant={t.urgency === "HIGH" ? "danger" : "warning"} size="sm">
  {t.urgency === "HIGH" ? "Mendesak (Tinggi)" : "Menunggu Persetujuan"}
  </Badge>
  <span className="text-[11px] font-mono font-bold text-text-muted">
  {t.id}
  </span>
  </div>

  <div>
  <h4 className="text-sm font-bold text-text-main">
  {t.quantity} {t.unit} {t.itemName}
  </h4>
  <p className="text-xs text-text-muted mt-0.5 font-medium">
  Penerima: <span className="font-bold text-text-main">{t.refugeeName}</span> ({t.shelterLocation})
  </p>
  <p className="text-[11px] text-text-muted mt-0.5">
  Diajukan oleh: {t.createdByUserName}
  </p>
  </div>

  {isLogisticsOfficer ? (
  <Button
  variant="warning"
  size="sm"
  className="w-full justify-center text-xs h-9 font-bold"
  onClick={() => openApproveModal(t)}
  >
  <Icon name="check" variant="bold" size={14} className="mr-1.5" />
  Setujui & Potong Stok Gudang
  </Button>
  ) : (
  <p className="text-[11px] text-center text-text-subtle bg-surface-subtle py-1.5 rounded border border-border">
  Menunggu otorisasi Petugas Logistik
  </p>
  )}
  </Card>
  ))
  )}
  </div>
  </div>

  {/* Kolom 2: Siap Diantar (ALLOCATED) */}
  <div className="rounded-xl border border-border bg-surface flex flex-col min-h-[280px] lg:min-h-[480px] shadow-2xs overflow-hidden">
  <div className="p-3 border-b border-status-safe-border bg-status-safe-bg/20 flex items-center justify-between">
  <div>
  <h3 className="text-xs font-black uppercase tracking-wider text-status-safe flex items-center gap-1.5">
  <span className="w-2.5 h-2.5 rounded-full bg-status-safe ring-2 ring-status-safe/30" />
  Siap Diantar (Teralokasi)
  </h3>
  <p className="text-[11px] text-text-muted mt-0.5">
  Stok telah dipotong, siap dibawa relawan
  </p>
  </div>
  <span className="text-xs font-black text-text-main px-2 py-0.5 rounded-md bg-surface border border-border shadow-2xs">
  {allocatedTickets.length}
  </span>
  </div>

  <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[640px]">
  {allocatedTickets.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center text-text-subtle space-y-1">
  <Icon name="delivery" variant="linear" size={24} className="text-border" />
  <p className="text-xs">Tidak ada barang siap antar</p>
  </div>
  ) : (
  allocatedTickets.map((t) => (
  <Card key={t.id} className="p-3.5 space-y-2.5 border-border bg-surface shadow-2xs">
  <div className="flex items-center justify-between gap-2">
  <Badge variant="safe" size="sm">
  Siap Diantar ke Tenda
  </Badge>
  <span className="text-[11px] font-mono font-bold text-text-muted">
  {t.id}
  </span>
  </div>

  <div>
  <h4 className="text-sm font-bold text-text-main">
  {t.quantity} {t.unit} {t.itemName}
  </h4>
  <p className="text-xs text-text-muted mt-0.5 font-medium">
  Tujuan: <span className="font-bold text-text-main">{t.refugeeName}</span> ({t.shelterLocation})
  </p>
  </div>

  <Button
  variant="primary"
  size="sm"
  className="w-full justify-center text-xs h-9 font-bold"
  onClick={() => handleCompleteDelivery(t)}
  >
  <Icon name="check" variant="bold" size={14} className="mr-1.5" />
  Konfirmasi Diterima di Tenda
  </Button>
  </Card>
  ))
  )}
  </div>
  </div>

  {/* Kolom 3: Telah Diterima (COMPLETED) */}
  <div className="rounded-xl border border-border bg-surface flex flex-col min-h-[280px] lg:min-h-[480px] shadow-2xs overflow-hidden">
  <div className="p-3 border-b border-border bg-surface-muted flex items-center justify-between">
  <div>
  <h3 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
  <span className="w-2.5 h-2.5 rounded-full bg-text-subtle" />
  Telah Diterima (Selesai)
  </h3>
  <p className="text-[11px] text-text-muted mt-0.5">
  Bantuan selesai diserahterimakan
  </p>
  </div>
  <span className="text-xs font-black text-text-muted px-2 py-0.5 rounded-md bg-surface border border-border shadow-2xs">
  {completedTickets.length}
  </span>
  </div>

  <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[640px]">
  {completedTickets.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center text-text-subtle space-y-1">
  <Icon name="box" variant="linear" size={24} className="text-border" />
  <p className="text-xs">Belum ada bantuan selesai</p>
  </div>
  ) : (
  completedTickets.map((t) => (
  <Card key={t.id} className="p-3 space-y-1.5 border-border bg-surface opacity-80">
  <div className="flex items-center justify-between gap-2">
  <Badge variant="neutral" size="sm">
  Selesai
  </Badge>
  <span className="text-[11px] font-mono text-text-muted">
  {t.id}
  </span>
  </div>

  <div>
  <h4 className="text-xs font-bold text-text-main">
  {t.quantity} {t.unit} {t.itemName}
  </h4>
  <p className="text-[11px] text-text-muted mt-0.5">
  Penerima: {t.refugeeName} ({t.shelterLocation})
  </p>
  </div>
  </Card>
  ))
  )}
  </div>
  </div>
  </div>
  )}

  {/* 5. Modal Konfirmasi Pemotongan Stok Fisik (Single-Writer) */}
  <Dialog
  open={Boolean(selectedTicketForAllocation)}
  onOpenChange={(open) => !open && setSelectedTicketForAllocation(null)}
  title={`Persetujuan Alokasi: ${selectedTicketForAllocation?.id || ""}`}
  description="Pilih sumber stok gudang fisik yang akan dipotong untuk memenuhi kebutuhan warga."
  >
  {selectedTicketForAllocation && (
  <form onSubmit={handleExecuteApproval} className="space-y-4 pt-1 text-xs">
  {errorMessage && (
  <div className="p-2.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger text-xs font-semibold">
  {errorMessage}
  </div>
  )}

  <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-1">
  <span className="font-bold text-xs text-text-main block">
  Rincian Permintaan: {selectedTicketForAllocation.quantity} {selectedTicketForAllocation.unit} {selectedTicketForAllocation.itemName}
  </span>
  <p className="text-[11px] text-text-muted">
  Untuk Warga: <span className="font-semibold text-text-main">{selectedTicketForAllocation.refugeeName}</span> ({selectedTicketForAllocation.shelterLocation})
  </p>
  </div>

  <div className="space-y-1.5">
  <label className="font-bold text-text-main block">
  Pilih Komoditas Sumber di Gudang
  </label>
  <select value={selectedItemId}
  onChange={(e) => setSelectedItemId(e.target.value)}
  className="w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-base sm:text-xs font-semibold text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none focus:border-border-strong transition-colors"
  >
  {poskoInventory.map((item) => (
  <option key={item.id} value={item.id}>
  {item.itemName} (Tersedia: {item.currentQuantity} {item.unit})
  </option>
  ))}
  </select>
  </div>

  <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
  <Button
  type="button"
  variant="secondary"
  size="md"
  className="w-full sm:flex-1"
  onClick={() => setSelectedTicketForAllocation(null)}
  >
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  size="md"
  disabled={isProcessing}
  className="w-full sm:flex-1 justify-center font-bold"
  >
  {isProcessing ? "Memproses Pemotongan..." : "Setujui & Potong Stok"}
  </Button>
  </div>
  </form>
  )}
  </Dialog>
  </div>
  );
}
