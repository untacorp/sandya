"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { DISASTER_NEEDS_CATALOG } from "@/core/codecs/needs-catalog";
import { InventoryAggregate, INVENTORY_CATEGORIES, type InventoryCategory } from "@/core/domain/logistics/inventory.aggregate";
import { asItemId, asPoskoId } from "@/core/shared/branded-types";
import { canMutateStock } from "@/core/permissions/posko-permissions";

import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { type ItemCategory, type InventoryItem } from "@/shared/types";
import { LogisticsCharts } from "./charts";
import { LogisticsLedger } from "./ledger";
import { DisasterCatalogCombobox } from "@/shared/ui/disaster-catalog-combobox";
import { Select } from "@/shared/ui/select";

const mapClusterToCategory = (cluster: string): InventoryCategory => {
  if (cluster === "FOOD_WATER") return "FOOD";
  if (cluster === "CLOTHING_BEDDING") return "CLOTHING";
  if (INVENTORY_CATEGORIES.includes(cluster as InventoryCategory)) {
    return cluster as InventoryCategory;
  }
  return "OTHER";
};

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "ALL", label: "Semua Komoditas" },
  { id: "FOOD", label: "Pangan & Air" },
  { id: "MEDICAL", label: "Medis & Obat" },
  { id: "INFANT", label: "Bayi & Balita" },
  { id: "CLOTHING", label: "Sandang & Tidur" },
  { id: "HYGIENE", label: "Sanitasi & Kebersihan" },
  { id: "SHELTER", label: "Tenda & Hunian" },
  { id: "EMERGENCY_TOOLS", label: "Alat Darurat" },
  { id: "ASSISTIVE", label: "Alat Disabilitas" },
];

export default function LogisticsPage() {
  const [isLedgerOpen, setIsLedgerOpen] = React.useState(false);
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const { session, inventory, transactions, addRestock, recordDamageStock, updateInventoryItem, deleteInventoryItem } = usePoskoStore();
  const effectivePoskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : session.poskoId;

  const poskoInventory = inventory.filter((i) => i.postId === effectivePoskoId);
  const poskoTransactions = transactions.filter((tx) => tx.postId === effectivePoskoId);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");

  // Restock Modal State
  const [restockOpen, setRestockOpen] = React.useState(false);
  const [useCatalog, setUseCatalog] = React.useState(true);
  const [selectedCatalogId, setSelectedCatalogId] = React.useState<number>(0x01);
  const [customItemName, setCustomItemName] = React.useState("");
  const [category, setCategory] = React.useState<InventoryCategory>("FOOD");
  const [qty, setQty] = React.useState<number | "">("");
  const [unit, setUnit] = React.useState("KG");
  const [notes, setNotes] = React.useState("Penerimaan bantuan masuk gudang");

  // Damage / Write-off Modal State
  const [damageOpen, setDamageOpen] = React.useState(false);
  const [selectedDamageItem, setSelectedDamageItem] = React.useState<InventoryItem | null>(null);
  const [damageQty, setDamageQty] = React.useState<number | "">("");
  const [damageReason, setDamageReason] = React.useState("Beras basah terkena hujan di tenda");

  // Edit Item Modal State
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedEditItem, setSelectedEditItem] = React.useState<InventoryItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCategory, setEditCategory] = React.useState<InventoryCategory>("FOOD");
  const [editUnit, setEditUnit] = React.useState("KG");

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedDeleteItem, setSelectedDeleteItem] = React.useState<InventoryItem | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  // RBAC Permission Check (Single-Writer Guard)
  const isLogisticsOfficer = canMutateStock(session.userRole);

  const handleOpenRestock = (prefillItem?: InventoryItem) => {
    setErrorMessage(null);
    setQty("");
    setNotes("Penerimaan bantuan masuk gudang posko");
    if (prefillItem) {
      setUseCatalog(false);
      setCustomItemName(prefillItem.itemName);
      setCategory(prefillItem.category as InventoryCategory);
      setUnit(prefillItem.unit);
    } else {
      setUseCatalog(true);
      setCustomItemName("");
      setCategory("FOOD");
      setUnit("KG");
    }
    setRestockOpen(true);
  };

  const handleOpenDamage = (item: InventoryItem) => {
    setErrorMessage(null);
    setSelectedDamageItem(item);
    setDamageQty("");
    setDamageReason("Kerusakan fisik / basah / kadaluwarsa");
    setDamageOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setErrorMessage(null);
    setSelectedEditItem(item);
    setEditName(item.itemName);
    setEditCategory(item.category as InventoryCategory);
    setEditUnit(item.unit);
    setEditOpen(true);
  };

  const handleOpenDelete = (item: InventoryItem) => {
    setErrorMessage(null);
    setSelectedDeleteItem(item);
    setDeleteOpen(true);
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

      addRestock(finalItemName, category as ItemCategory, quantityNumber, unit.toUpperCase(), finalItemId, effectivePoskoId);

      setSuccessToast(`Stok +${quantityNumber} ${unit.toUpperCase()} ${finalItemName} berhasil ditambahkan.`);
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

  const handleSaveDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDamageItem || damageQty === "" || Number(damageQty) <= 0) return;

    if (!isLogisticsOfficer) {
      setErrorMessage("Akses ditolak: Hanya Petugas Logistik atau Koordinator Posko yang berwenang mencatat kerusakan barang.");
      return;
    }

    const quantityNumber = Number(damageQty);
    if (quantityNumber > selectedDamageItem.currentQuantity) {
      setErrorMessage(`Jumlah kerusakan (${quantityNumber} ${selectedDamageItem.unit}) melebihi stok yang tersedia (${selectedDamageItem.currentQuantity} ${selectedDamageItem.unit}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const container = ServiceContainer.getInstance();

      // Pastikan ada di repo
      const existingAggRes = await container.inventoryRepo.findById(asItemId(selectedDamageItem.id));
      if (!existingAggRes.ok || !existingAggRes.value) {
        const agg = InventoryAggregate.reconstitute({
          id: asItemId(selectedDamageItem.id),
          poskoId: asPoskoId(effectivePoskoId),
          itemName: selectedDamageItem.itemName,
          category: selectedDamageItem.category as InventoryCategory,
          currentQuantity: selectedDamageItem.currentQuantity,
          unit: selectedDamageItem.unit,
          lastUpdatedAt: selectedDamageItem.lastUpdatedAt,
          version: 1,
        });
        await container.inventoryRepo.save(agg);
      }

      const mutateRes = await container.mutateStockUseCase.execute({
        poskoId: effectivePoskoId,
        itemId: selectedDamageItem.id,
        officerId: session.userId,
        officerRole: session.userRole,
        txType: "DAMAGE",
        quantityChange: -quantityNumber,
        logicalSeq: Date.now(),
        notes: damageReason.trim() || "Pencatatan barang rusak / kadaluwarsa",
      });

      if (!mutateRes.ok) {
        setErrorMessage(mutateRes.error.message);
        setIsSubmitting(false);
        return;
      }

      recordDamageStock(selectedDamageItem.id, quantityNumber, damageReason);

      setSuccessToast(`Pengurangan stok rusak -${quantityNumber} ${selectedDamageItem.unit} ${selectedDamageItem.itemName} berhasil dicatat.`);
      setTimeout(() => setSuccessToast(null), 4000);

      setDamageOpen(false);
      setSelectedDamageItem(null);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Terjadi kesalahan saat memproses koreksi barang rusak.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditItem || !editName.trim()) return;

    if (!isLogisticsOfficer) {
      setErrorMessage("Akses ditolak: Hanya Petugas Logistik atau Koordinator Posko yang berwenang mengubah data komoditas.");
      return;
    }

    updateInventoryItem(selectedEditItem.id, {
      itemName: editName.trim(),
      category: editCategory as ItemCategory,
      unit: editUnit.toUpperCase().trim(),
    });

    setSuccessToast(`Data komoditas ${editName} berhasil diperbarui.`);
    setTimeout(() => setSuccessToast(null), 3500);
    setEditOpen(false);
    setSelectedEditItem(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedDeleteItem) return;

    if (!isLogisticsOfficer) {
      setErrorMessage("Akses ditolak: Hanya Petugas Logistik atau Koordinator Posko yang berwenang menghapus komoditas.");
      return;
    }

    deleteInventoryItem(selectedDeleteItem.id);
    setSuccessToast(`Komoditas ${selectedDeleteItem.itemName} telah dihapus dari inventaris.`);
    setTimeout(() => setSuccessToast(null), 3500);
    setDeleteOpen(false);
    setSelectedDeleteItem(null);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "FOOD":
      case "FOOD_WATER":
        return "Bahan Makanan & Air";
      case "MEDICAL":
        return "Obat & Medis";
      case "BABY_SUPPLIES":
      case "INFANT":
        return "Perlengkapan Bayi & Balita";
      case "SHELTER":
        return "Tenda & Hunian";
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

  const filteredInventory = React.useMemo(() => {
    return poskoInventory.filter((item) => {
      let matchCategory = true;
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "FOOD") matchCategory = item.category === "FOOD";
        else if (selectedCategory === "INFANT") matchCategory = item.category === "INFANT" || item.category === "BABY_SUPPLIES";
        else if (selectedCategory === "CLOTHING") matchCategory = item.category === "CLOTHING";
        else matchCategory = item.category === selectedCategory;
      }

      let matchSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchSearch = item.itemName.toLowerCase().includes(q) || item.unit.toLowerCase().includes(q);
      }

      return matchCategory && matchSearch;
    });
  }, [poskoInventory, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4 min-w-0">
        {/* 1. Sub-Navigasi Logistik */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">
              Lokasi Posko: <span className="text-text-main font-extrabold">{session.poskoName}</span>
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={!isLogisticsOfficer}
            onClick={() => handleOpenRestock()}
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

        {/* 3. Visualisasi Grafik Logistik */}
        <LogisticsCharts inventory={poskoInventory} />

        {/* 4. Filter & Pencarian Komoditas */}
        <div className="space-y-2.5 bg-surface p-3 rounded-xl border border-border shadow-2xs">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari komoditas berdasarkan nama barang atau satuan..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                  selectedCategory === tab.id
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-surface-subtle text-text-muted hover:bg-surface-hover"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Grid Ketersediaan Stok Barang */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Icon name="box" variant="bold" size={14} className="text-primary" />
              Ketersediaan Stok Fisik Posko ({filteredInventory.length} Komoditas)
            </h2>
            <span className="text-xs text-text-muted font-medium">
              Buku Kas Terverifikasi
            </span>
          </div>

          {filteredInventory.length === 0 ? (
            <EmptyState
              icon="box"
              title="Tidak Ada Komoditas yang Cocok"
              description={
                poskoInventory.length === 0
                  ? "Belum ada komoditas logistik atau bantuan darurat yang tercatat di posko ini. Klik tombol di bawah untuk mencatat penerimaan barang masuk."
                  : "Tidak ditemukan barang yang sesuai dengan kata kunci atau filter kategori yang dipilih."
              }
              actionLabel="+ Catat Barang Masuk"
              actionIcon="add-circle"
              onAction={() => handleOpenRestock()}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredInventory.map((item) => {
                const isCritical = item.burnRateDays <= 1 || item.currentQuantity <= 10;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border bg-surface shadow-2xs space-y-3 transition-all flex flex-col justify-between ${
                      isCritical ? "border-status-danger-border bg-status-danger-bg/15" : "border-border"
                    }`}
                  >
                    <div className="space-y-2">
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
                        <span className="text-text-muted">Ketahanan:</span>
                        <span className={`font-bold ${isCritical ? "text-status-danger" : "text-text-main"}`}>
                          {isCritical ? "Kritis (< 24 Jam)" : `~${item.burnRateDays} Hari`}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi Cepat per Komoditas */}
                    {isLogisticsOfficer && (
                      <div className="pt-2 border-t border-border/60 flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-[11px] h-7 px-1.5 justify-center"
                          onClick={() => handleOpenRestock(item)}
                          title="Tambah Stok Masuk"
                        >
                          <Icon name="add-circle" size={12} className="mr-1 text-status-safe" />
                          Masuk
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-[11px] h-7 px-1.5 justify-center"
                          onClick={() => handleOpenDamage(item)}
                          title="Catat Kerusakan / Hilang"
                        >
                          <Icon name="alert" size={12} className="mr-1 text-status-danger" />
                          Rusak
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors"
                          title="Ubah Data Komoditas"
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 rounded-lg border border-border hover:bg-status-danger-bg hover:border-status-danger-border text-text-muted hover:text-status-danger transition-colors"
                          title="Hapus Komoditas"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Tombol Ledger Mobile */}
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
      <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen} title="Buku Kas Mutasi Stok" maxWidth="lg">
        <div className="max-h-[70vh] overflow-y-auto">
          <LogisticsLedger transactions={poskoTransactions} />
        </div>
      </Dialog>

      {/* MODAL 1: Catat Barang Masuk (Restock) */}
      <Dialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        title="Catat Barang Masuk (Restock Gudang)"
        description="Catat penerimaan bantuan logistik baru dari Katalog Standar Bencana atau input kustom."
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
              Pilih dari Katalog Standar
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
                <Input
                  placeholder="Contoh: Genset Darurat 5000W / Popok Dewasa"
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
                    { value: "OTHER", label: "Lain-Lain (OTHER)" },
                  ]}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Jumlah Masuk</label>
              <Input
                type="number"
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
                  { value: "UNIT", label: "UNIT" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-main block">Catatan Penerimaan</label>
            <Input
              placeholder="Contoh: Bantuan truk PMI Induk / Donasi warga"
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

      {/* MODAL 2: Catat Kerusakan / Kadaluwarsa (DAMAGE) */}
      <Dialog
        open={damageOpen}
        onOpenChange={setDamageOpen}
        title="Catat Barang Rusak / Kadaluwarsa"
        description="Potong saldo stok fisik karena kerusakan basah, rusak kemasan, atau kadaluwarsa."
      >
        {selectedDamageItem && (
          <form onSubmit={handleSaveDamage} className="space-y-3 pt-1 text-xs">
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-1">
              <span className="font-bold text-xs text-text-main block">
                {selectedDamageItem.itemName}
              </span>
              <p className="text-[11px] text-text-muted">
                Tersedia di Gudang: <span className="font-bold text-text-main">{selectedDamageItem.currentQuantity} {selectedDamageItem.unit}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-text-main block">Jumlah Rusak / Hilang</label>
                <Input
                  type="number"
                  placeholder="misal: 5"
                  value={damageQty}
                  onChange={(e) => setDamageQty(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  min={1}
                  max={selectedDamageItem.currentQuantity}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-text-main block">Satuan</label>
                <Input value={selectedDamageItem.unit} disabled className="bg-surface-subtle" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Alasan Pengurangan / Kerusakan</label>
              <Input
                placeholder="Contoh: Beras basah akibat banjir / Obat lewat masa simpan"
                value={damageReason}
                onChange={(e) => setDamageReason(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setDamageOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                disabled={isSubmitting || !isLogisticsOfficer}
                className="flex-1 justify-center"
              >
                {isSubmitting ? "Memproses..." : "Potong Stok Rusak"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* MODAL 3: Ubah Metadata Komoditas (EDIT) */}
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Ubah Data Komoditas"
        description="Perbarui nama, kategori, atau satuan fisik komoditas."
      >
        {selectedEditItem && (
          <form onSubmit={handleSaveEdit} className="space-y-3 pt-1 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Nama Komoditas</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Kategori Komoditas</label>
              <Select
                value={editCategory}
                onChange={(val) => setEditCategory(val as InventoryCategory)}
                options={[
                  { value: "FOOD", label: "Pangan & Air Minum" },
                  { value: "CLOTHING", label: "Sandang & Alas Tidur" },
                  { value: "MEDICAL", label: "Medis & Obat-Obatan" },
                  { value: "HYGIENE", label: "Sanitasi & Kebersihan" },
                  { value: "SHELTER", label: "Tenda & Hunian Sementara" },
                  { value: "INFANT", label: "Perlengkapan Bayi & Balita" },
                  { value: "ASSISTIVE", label: "Alat Bantu Disabilitas" },
                  { value: "EMERGENCY_TOOLS", label: "Peralatan Darurat" },
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Satuan Fisik</label>
              <Select
                value={editUnit}
                onChange={(val) => setEditUnit(val)}
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
                  { value: "UNIT", label: "UNIT" },
                ]}
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setEditOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 justify-center"
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* MODAL 4: Konfirmasi Hapus Komoditas (DELETE) */}
      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Komoditas dari Posko"
        description="Apakah Anda yakin ingin menghapus komoditas ini dari inventaris posko?"
      >
        {selectedDeleteItem && (
          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-status-danger-bg/20 border border-status-danger-border text-text-main space-y-1">
              <p className="font-bold text-status-danger">
                {selectedDeleteItem.itemName} ({selectedDeleteItem.currentQuantity} {selectedDeleteItem.unit})
              </p>
              <p className="text-[11px] text-text-muted">
                Tindakan ini akan menghapus kartu komoditas dari daftar aktif posko.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setDeleteOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                className="flex-1 justify-center"
                onClick={handleConfirmDelete}
              >
                Ya, Hapus Komoditas
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
