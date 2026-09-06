"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { DISASTER_NEEDS_CATALOG } from "@/core/codecs/needs-catalog";
import { InventoryAggregate, INVENTORY_CATEGORIES, type InventoryCategory } from "@/core/domain/logistics/inventory.aggregate";
import { asItemId, asPoskoId } from "@/core/shared/branded-types";

const mapClusterToCategory = (cluster: string): InventoryCategory => {
  if (cluster === "FOOD_WATER") return "FOOD";
  if (cluster === "CLOTHING_BEDDING") return "CLOTHING";
  if (INVENTORY_CATEGORIES.includes(cluster as InventoryCategory)) {
    return cluster as InventoryCategory;
  }
  return "OTHER";
};
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { type ItemCategory } from "@/shared/types";
import { LogisticsCharts } from "./charts";
import { LogisticsLedger } from "./ledger";
import { DisasterCatalogCombobox } from "@/shared/ui/disaster-catalog-combobox";
import { Select } from "@/shared/ui/select";

export default function LogisticsPage() {
  const [isLedgerOpen, setIsLedgerOpen] = React.useState(false);
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const { session, inventory, transactions, addRestock } = usePoskoStore();
  const effectivePoskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : session.poskoId;

  const poskoInventory = inventory.filter((i) => i.postId === effectivePoskoId);
  const poskoTransactions = transactions.filter((tx) => tx.postId === effectivePoskoId);

  const [restockOpen, setRestockOpen] = React.useState(false);
  const [useCatalog, setUseCatalog] = React.useState(true);
  const [selectedCatalogId, setSelectedCatalogId] = React.useState<number>(0x01);
  const [customItemName, setCustomItemName] = React.useState("");
  const [category, setCategory] = React.useState<InventoryCategory>("FOOD");
  const [qty, setQty] = React.useState<number | "">("");
  const [unit, setUnit] = React.useState("KG");
  const [notes, setNotes] = React.useState("Drop bantuan truk logistik");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  // RBAC Permission Check
  const authorizedRoles = [
  "PETUGAS_LOGISTIK",
  "LOGISTIK",
  "KOORDINATOR_POSKO",
  "KOORDINATOR",
  "KOMANDAN_MISI",
  "PEMIMPIN_ORGANISASI",
  ];
  const isLogisticsOfficer = authorizedRoles.includes(session.userRole);

  const catalogItems = React.useMemo(() => {
  return Object.values(DISASTER_NEEDS_CATALOG);
  }, []);

  const handleOpenRestock = () => {
  setErrorMessage(null);
  setQty("");
  setNotes("Penerimaan bantuan masuk gudang posko");
  setRestockOpen(true);
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
  e.preventDefault();
  if (qty === "" || Number(qty) <= 0) return;

  if (!isLogisticsOfficer) {
  setErrorMessage("Akses ditolak: Hanya Petugas Logistik atau Koordinator Posko yang berwenang memutasi stok fisik.");
  return;
  }

  setIsSubmitting(true);
  setErrorMessage(null);

  try {
  const finalItemName = useCatalog
  ? DISASTER_NEEDS_CATALOG[selectedCatalogId]?.nameId || "Bantuan Bencana"
  : customItemName.trim();

  if (!finalItemName) {
  setErrorMessage("Nama barang logistik tidak boleh kosong.");
  setIsSubmitting(false);
  return;
  }

  const container = ServiceContainer.getInstance();
  const poskoId = asPoskoId(effectivePoskoId);
  const existingItemsRes = await container.inventoryRepo.findByPoskoId(poskoId);
  const existingList = existingItemsRes.ok ? existingItemsRes.value : [];
  const existingItem = existingList.find(
  (i) => i.toSnapshot().itemName.toLowerCase() === finalItemName.toLowerCase()
  );

  const quantityNumber = Number(qty);

  let finalItemId: string;

  if (existingItem) {
  finalItemId = existingItem.toSnapshot().id;
  // Mutate existing inventory via MutateStockUseCase
  const mutateRes = await container.mutateStockUseCase.execute({
  poskoId: effectivePoskoId,
  itemId: finalItemId,
  officerId: session.userId,
  officerRole: session.userRole,
  txType: "RESTOCK",
  quantityChange: quantityNumber,
  logicalSeq: existingItem.toSnapshot().version + 1,
  notes: notes.trim() || undefined,
  });

  if (!mutateRes.ok) {
  setErrorMessage(mutateRes.error.message);
  setIsSubmitting(false);
  return;
  }
  } else {
  // Create new InventoryAggregate
  const newItemId = asItemId(`${effectivePoskoId}-ITEM-${Math.floor(100 + Math.random() * 900)}`);
  const newAggRes = InventoryAggregate.create({
  id: newItemId,
  poskoId,
  itemName: finalItemName,
  category,
  initialQuantity: quantityNumber,
  unit: unit.toUpperCase(),
  });

  if (!newAggRes.ok) {
  setErrorMessage(newAggRes.error.message);
  setIsSubmitting(false);
  return;
  }

  const newAgg = newAggRes.value;
  finalItemId = newAgg.toSnapshot().id;
  await container.inventoryRepo.save(newAgg);
  await container.outboxRepo.enqueue({
  poskoId,
  topic: "STOCK_MUTATED",
  payload: JSON.stringify({
  itemId: newItemId,
  itemName: finalItemName,
  initialQuantity: quantityNumber,
  unit: unit.toUpperCase(),
  officerId: session.userId,
  txType: "RESTOCK",
  }),
  });
  }

  // Update zustand store
  addRestock(finalItemName, category as ItemCategory, quantityNumber, unit.toUpperCase(), finalItemId, effectivePoskoId);

  setSuccessToast(`Stok ${quantityNumber} ${unit.toUpperCase()} ${finalItemName} berhasil ditambahkan.`);
  setTimeout(() => setSuccessToast(null), 4000);

  setCustomItemName("");
  setQty("");
  setRestockOpen(false);
  } catch (err: unknown) {
  setErrorMessage((err as Error)?.message || "Terjadi kesalahan saat memproses stok masuk.");
  } finally {
  setIsSubmitting(false);
  }
  };

  const getCategoryLabel = (cat: string) => {
  switch (cat) {
  case "FOOD":
  case "FOOD_WATER":
  return "Bahan Makanan & Air";
  case "MEDICAL":
  return "Obat & Perawatan Medis";
  case "BABY_SUPPLIES":
  case "INFANT":
  return "Perlengkapan Bayi & Balita";
  case "SHELTER":
  return "Tenda, Matras & Terpal";
  case "CLOTHING":
  case "CLOTHING_BEDDING":
  return "Pakaian & Alas Tidur";
  case "HYGIENE":
  return "Kebersihan & Sanitasi";
  case "ASSISTIVE":
  return "Alat Bantu Disabilitas";
  case "EMERGENCY_TOOLS":
  return "Peralatan Darurat";
  default:
  return "Logistik Umum";
  }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4 min-w-0">
        {/* 1. Sub-Navigasi Logistik */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
  <Button
  variant="primary"
  size="sm"
  disabled={!isLogisticsOfficer}
  onClick={handleOpenRestock}
  className="w-full sm:w-auto justify-center"
  >
  <Icon name="add-circle" variant="bold" size={14} className="mr-1" />
  Catat Barang Masuk
  </Button>
  </div>

  {/* 2. Banner Notifikasi RBAC & Sukses */}
  {!isLogisticsOfficer && (
  <AlertBanner
  variant="warning"
  title="Mode Peninjauan Gudang (Read-Only)"
  description="Hak mutasi saldo stok fisik di gudang dibatasi khusus untuk Petugas Logistik, Koordinator Posko, atau Komandan Misi."
  icon="shield"
  />
  )}

  {successToast && (
  <AlertBanner
  variant="safe"
  title="Stok Berhasil Dimutasi"
  description={successToast}
  icon="check"
  />
  )}
        {/* NEW: Logistics Charts */}
        <LogisticsCharts inventory={poskoInventory} />

        {/* 3. Grid Ketersediaan Stok Barang */}
  <div>
  <div className="flex items-center justify-between mb-2.5">
  <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
  <Icon name="box" variant="bold" size={14} className="text-primary" />
  Ketersediaan Stok Fisik Posko ({poskoInventory.length} Komoditas)
  </h2>
  <span className="text-xs text-text-muted font-medium">
  Aturan Single-Writer Ledger Aktif
  </span>
  </div>

  {poskoInventory.length === 0 ? (
  <EmptyState
  icon="box"
  title="Gudang Logistik Masih Kosong"
  description="Belum ada komoditas logistik atau bantuan darurat yang tercatat di posko ini. Klik tombol di bawah untuk mencatat penerimaan barang masuk."
  actionLabel="+ Catat Barang Masuk"
  actionIcon="add-circle"
  onAction={handleOpenRestock}
  />
  ) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {poskoInventory.map((item) => {
  const isCritical = item.burnRateDays <= 1 || item.currentQuantity <= 10;
  return (
  <div
  key={item.id}
  className={`p-3.5 rounded-xl border bg-surface shadow-2xs space-y-2.5 transition-all ${
  isCritical ? "border-status-danger-border bg-status-danger-bg/15" : "border-border"
  }`}
  >
  <div className="flex items-start justify-between gap-2">
  <div className="min-w-0">
  <span className="text-[11px] text-text-muted font-semibold block truncate">
  {getCategoryLabel(item.category)}
  </span>
  <h3 className="text-sm font-bold text-text-main mt-0.5 truncate">
  {item.itemName}
  </h3>
  </div>
  <div className="text-right shrink-0">
  <p className={`text-xl font-black ${isCritical ? "text-status-danger" : "text-text-main"}`}>
  {item.currentQuantity.toLocaleString()}
  </p>
  <span className="text-[11px] text-text-muted font-bold">{item.unit}</span>
  </div>
  </div>

  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/80">
  <span className="text-text-muted">Ketahanan Konsumsi:</span>
  <span className={`font-bold ${isCritical ? "text-status-danger" : "text-text-main"}`}>
  {isCritical ? "Kritis (< 24 Jam)" : `~${item.burnRateDays} Hari`}
  </span>
  </div>
  </div>
  );
  })}
  </div>
  )}
  </div>
      {/* 4. Tombol Ledger Mobile (Hidden in Desktop) */}
      <div className="lg:hidden">
        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => setIsLedgerOpen(true)}>
          <Icon name="waybill" size={16} /> Lihat Catatan Keluar-Masuk
        </Button>
      </div>
      </div>

      {/* Sidebar Ledger Desktop */}
      <div className="hidden lg:block w-80 xl:w-96 shrink-0 h-fit sticky top-6">
        <LogisticsLedger transactions={poskoTransactions} />
      </div>

      {/* Modal Ledger Mobile */}
      <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen} title="Catatan Keluar-Masuk" maxWidth="lg">
        <LogisticsLedger transactions={poskoTransactions} />
      </Dialog>

  {/* 5. Modal Terima Barang Masuk (Restock Single-Writer) */}
  <Dialog
  open={restockOpen}
  onOpenChange={setRestockOpen}
  title="Catat Barang Masuk (Restock Gudang)"
  description="Catat penerimaan bantuan logistik baru dengan standardisasi Kamus Bencana uint8 atau input kustom."
  >
  <form onSubmit={handleSaveRestock} className="space-y-3 pt-1 text-xs">
  {errorMessage && (
  <div className="p-2.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger text-xs font-semibold">
  {errorMessage}
  </div>
  )}

  {/* Toggle Katalog vs Kustom */}
  <div className="flex items-center gap-2 p-1 bg-surface-subtle border border-border rounded-lg">
  <button
  type="button"
  onClick={() => setUseCatalog(true)}
  className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
  useCatalog ? "bg-surface shadow-2xs text-text-main border border-border" : "text-text-muted"
  }`}
  >
  Pilih dari Kamus Bencana
  </button>
  <button
  type="button"
  onClick={() => setUseCatalog(false)}
  className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
  !useCatalog ? "bg-surface shadow-2xs text-text-main border border-border" : "text-text-muted"
  }`}
  >
  Input Kustom Bebas
  </button>
  </div>

  {useCatalog ? (
  <div className="space-y-1 relative">
  <label className="font-semibold text-text-main block">Pilih Komoditas Kamus Bencana</label>
  <DisasterCatalogCombobox
    value={selectedCatalogId}
    onChange={(id, cluster) => {
      setSelectedCatalogId(id);
      setCategory(mapClusterToCategory(cluster));
    }}
  />
  </div>
  ) : (
  <div className="space-y-2">
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Nama Barang</label>
  <Input placeholder="Contoh: Genset Darurat 5000W / Popok Dewasa"
  value={customItemName}
  onChange={(e) => setCustomItemName(e.target.value)}
  required
  />
  </div>
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Kategori Komoditas</label>
  <Select
  value={category}
  onChange={(val) => setCategory(val as InventoryCategory)}
  options={[
    { value: "FOOD", label: "Pangan & Air Minum (FOOD)" },
    { value: "CLOTHING", label: "Sandang & Alas Tidur (CLOTHING)" },
    { value: "MEDICAL", label: "Medis & Obat-Obatan (MEDICAL)" },
    { value: "HYGIENE", label: "Sanitasi & Kebersihan (HYGIENE)" },
    { value: "SHELTER", label: "Tenda & Hunian Sementara (SHELTER)" },
    { value: "INFANT", label: "Perlengkapan Bayi (INFANT)" },
    { value: "ASSISTIVE", label: "Alat Bantu Disabilitas (ASSISTIVE)" },
    { value: "EMERGENCY_TOOLS", label: "Peralatan Darurat (EMERGENCY_TOOLS)" },
    { value: "OTHER", label: "Lain-Lain (OTHER)" }
  ]}
/>
  </div>
  </div>
  )}

  <div className="grid grid-cols-2 gap-2">
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Jumlah Kuantitas</label>
  <Input type="number"
  placeholder="misal: 100"
  value={qty}
  onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
  required
  min={1}
  />
  </div>
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Satuan Fisik</label>
  <Select
  value={unit}
  onChange={(val) => setUnit(val)}
  options={[
    { value: "KG", label: "KG" },
    { value: "LITER", label: "LITER" },
    { value: "KOTAK", label: "KOTAK" },
    { value: "DUS", label: "DUS" },
    { value: "STRIP", label: "STRIP" },
    { value: "BOTOL", label: "BOTOL" },
    { value: "PCS", label: "PCS" },
    { value: "SAK", label: "SAK" },
    { value: "GALON", label: "GALON" },
    { value: "TABUNG", label: "TABUNG" },
    { value: "UNIT", label: "UNIT" }
  ]}
/>
  </div>
  </div>

  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Catatan Penerimaan</label>
  <Input placeholder="Contoh: Bantuan truk PMI Induk / Donasi warga"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  />
  </div>

  <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center gap-2">
  <Button
  type="button"
  variant="secondary"
  size="md"
  className="w-full sm:flex-1"
  onClick={() => setRestockOpen(false)}
  >
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  size="md"
  disabled={isSubmitting || !isLogisticsOfficer}
  className="w-full sm:flex-1 justify-center font-bold"
  >
  {isSubmitting ? "Menyimpan..." : "Simpan Stok Masuk"}
  </Button>
  </div>
  </form>
  </Dialog>
  </div>
  );
}
