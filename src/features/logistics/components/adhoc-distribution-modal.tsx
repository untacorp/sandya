"use client";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { Card } from "@/shared/ui/card";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { Select } from "@/shared/ui/select";
import { QRCameraScanner } from "@/features/auth/components/qr-camera-scanner";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asItemId, asPoskoId } from "@/core/shared/branded-types";
import { InventoryAggregate, type InventoryCategory } from "@/core/domain/logistics/inventory.aggregate";
import { type DisasterPerson } from "@/shared/types";

interface AdHocDistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRefugeeId?: string;
  onSuccess?: (message: string) => void;
}

type FulfillmentMode = "DIRECT_HANDOVER" | "TENT_DELIVERY";

const toInventoryCategory = (cat: string): InventoryCategory => {
  if (cat === "BABY_SUPPLIES") return "INFANT";
  if (["FOOD", "CLOTHING", "MEDICAL", "HYGIENE", "SHELTER", "INFANT", "ASSISTIVE", "EMERGENCY_TOOLS"].includes(cat)) {
    return cat as InventoryCategory;
  }
  return "OTHER";
};

export function AdHocDistributionModal({
  open,
  onOpenChange,
  preselectedRefugeeId,
  onSuccess,
}: AdHocDistributionModalProps) {
  const {
    session,
    refugees,
    inventory,
    needsTickets,
    recordDirectDistribution,
    createNeedsTicket,
  } = usePoskoStore();

  const effectivePoskoId = session.poskoId;
  const poskoInventory = React.useMemo(() => {
    return inventory.filter((i) => i.postId === effectivePoskoId);
  }, [inventory, effectivePoskoId]);

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

  // States
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRefugee, setSelectedRefugee] = React.useState<DisasterPerson | null>(null);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);

  const [fulfillmentMode, setFulfillmentMode] = React.useState<FulfillmentMode>("DIRECT_HANDOVER");
  const [selectedItemId, setSelectedItemId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [urgency, setUrgency] = React.useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [reasonNotes, setReasonNotes] = React.useState<string>("Kebutuhan logistik harian warga di luar sesi pendaftaran");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Preselect refugee if provided
  React.useEffect(() => {
    if (preselectedRefugeeId) {
      const found = refugees.find((r) => r.id === preselectedRefugeeId);
      if (found) {
        setSelectedRefugee(found);
      }
    }
  }, [preselectedRefugeeId, refugees]);

  // Filtered refugees for search
  const filteredRefugees = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return refugees
      .filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.nik && r.nik.includes(q)) ||
          (r.shelterLocation && r.shelterLocation.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [refugees, searchQuery]);

  // Set default item if inventory exists
  React.useEffect(() => {
    if (poskoInventory.length > 0 && !selectedItemId) {
      setSelectedItemId(poskoInventory[0]?.id || "");
    }
  }, [poskoInventory, selectedItemId]);

  const targetItem = React.useMemo(() => {
    return poskoInventory.find((i) => i.id === selectedItemId);
  }, [poskoInventory, selectedItemId]);

  // Anti-Hoarding Check: recent completed distributions for this refugee in last 72 hours
  const recentDistributions = React.useMemo(() => {
    if (!selectedRefugee) return [];
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return needsTickets.filter(
      (t) =>
        t.refugeeId === selectedRefugee.id &&
        t.status === "COMPLETED" &&
        ((t.completedAt && t.completedAt > cutoff) || t.createdAt > cutoff)
    );
  }, [selectedRefugee, needsTickets]);

  const duplicateWarning = React.useMemo(() => {
    if (!targetItem || !selectedRefugee) return null;
    const targetName = targetItem.itemName.toLowerCase();
    return recentDistributions.find(
      (t) =>
        t.itemName.toLowerCase().includes(targetName) ||
        targetName.includes(t.itemName.toLowerCase())
    );
  }, [targetItem, selectedRefugee, recentDistributions]);

  // Handle QR scan to find refugee
  const handleQrScan = (decodedText: string) => {
    setIsScannerOpen(false);
    const matched = refugees.find(
      (r) =>
        r.id === decodedText ||
        (r.nik && r.nik === decodedText) ||
        decodedText.includes(r.id) ||
        decodedText.toLowerCase().includes(r.fullName.toLowerCase())
    );
    if (matched) {
      setSelectedRefugee(matched);
      setSearchQuery("");
      setErrorMessage(null);
    } else {
      setErrorMessage(`Warga dengan kode QR "${decodedText}" tidak ditemukan dalam data posko.`);
    }
  };

  const handleClose = () => {
    if (!preselectedRefugeeId) {
      setSelectedRefugee(null);
      setSearchQuery("");
    }
    setIsScannerOpen(false);
    setErrorMessage(null);
    setQuantity(1);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefugee) {
      setErrorMessage("Pilih warga penerima terlebih dahulu.");
      return;
    }
    if (!targetItem) {
      setErrorMessage("Pilih komoditas logistik yang akan disalurkan.");
      return;
    }
    if (quantity <= 0) {
      setErrorMessage("Jumlah barang harus minimal 1 unit.");
      return;
    }

    if (fulfillmentMode === "DIRECT_HANDOVER" && !isLogisticsOfficer) {
      setErrorMessage("Akses ditolak: Serah langsung di tempat yang memotong stok gudang hanya dapat disetujui oleh Petugas Logistik atau Koordinator.");
      return;
    }

    if (fulfillmentMode === "DIRECT_HANDOVER" && targetItem.currentQuantity < quantity) {
      setErrorMessage(`Stok fisik tidak mencukupi! Tersedia di gudang: ${targetItem.currentQuantity} ${targetItem.unit}, diminta: ${quantity} ${targetItem.unit}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const roleMap: Record<string, "PEMIMPIN" | "KOMANDAN" | "KOORDINATOR" | "MEDIS" | "LOGISTIK" | "RELAWAN"> = {
      PEMIMPIN_ORGANISASI: "PEMIMPIN",
      KOMANDAN_MISI: "KOMANDAN",
      KOORDINATOR_POSKO: "KOORDINATOR",
      PETUGAS_MEDIS: "MEDIS",
      PETUGAS_LOGISTIK: "LOGISTIK",
      RELAWAN_LAPANGAN: "RELAWAN",
    };

    try {
      const container = ServiceContainer.getInstance();

      if (fulfillmentMode === "DIRECT_HANDOVER") {
        // 1. Pastikan item terdaftar di inventory SQLite
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

        // 2. Eksekusi pemotongan stok lewat use case domain Single-Writer
        const mutateRes = await container.mutateStockUseCase.execute({
          poskoId: effectivePoskoId,
          itemId: targetItem.id,
          officerId: session.userId,
          officerRole: session.userRole,
          txType: "DISTRIBUTION",
          quantityChange: -quantity,
          logicalSeq: Date.now(),
          notes: `Serah langsung ad-hoc warga: ${selectedRefugee.fullName} (${selectedRefugee.shelterLocation || "Tenda"}) - ${reasonNotes}`,
        });

        if (!mutateRes.ok) {
          setErrorMessage(mutateRes.error.message);
          setIsSubmitting(false);
          return;
        }

        // 3. Catat peristiwa AID_RECEIVED pada profil riwayat warga
        await container.recordRefugeeEventUseCase.execute({
          refugeeId: selectedRefugee.id,
          poskoId: effectivePoskoId,
          authorId: session.userId,
          authorName: session.userName,
          authorRole: roleMap[session.userRole] || "LOGISTIK",
          eventType: "AID_RECEIVED",
          eventPayload: {
            item: targetItem.itemName,
            quantity,
            unit: targetItem.unit,
            fulfillment: "DIRECT_HANDOVER",
            notes: reasonNotes,
            distributedAt: Date.now(),
          },
        });

        // 4. Update Zustand store
        recordDirectDistribution({
          refugeeId: selectedRefugee.id,
          refugeeName: selectedRefugee.fullName,
          shelterLocation: selectedRefugee.shelterLocation,
          itemId: targetItem.id,
          itemName: targetItem.itemName,
          quantity,
          unit: targetItem.unit,
          officerId: session.userId,
          officerName: session.userName,
          notes: `Serah langsung ad-hoc: ${reasonNotes}`,
        });

        if (onSuccess) {
          onSuccess(
            `Sukses! ${quantity} ${targetItem.unit} ${targetItem.itemName} telah diserahkan langsung kepada ${selectedRefugee.fullName}. Stok gudang otomatis diperbarui.`
          );
        }
      } else {
        // TENT_DELIVERY MODE
        // 1. Catat event NEED_REPORTED pada riwayat warga
        await container.recordRefugeeEventUseCase.execute({
          refugeeId: selectedRefugee.id,
          poskoId: effectivePoskoId,
          authorId: session.userId,
          authorName: session.userName,
          authorRole: roleMap[session.userRole] || "RELAWAN",
          eventType: "NEED_REPORTED",
          eventPayload: {
            item: targetItem.itemName,
            quantity,
            unit: targetItem.unit,
            urgency,
            reason: reasonNotes,
            reportedAt: Date.now(),
          },
        });

        // 2. Buat tiket kebutuhan di Kanban antrean
        createNeedsTicket({
          refugeeId: selectedRefugee.id,
          refugeeName: selectedRefugee.fullName,
          shelterLocation: selectedRefugee.shelterLocation || "Tenda Pengungsian",
          postId: effectivePoskoId,
          itemName: targetItem.itemName,
          quantity,
          unit: targetItem.unit,
          urgency,
          createdByUserId: session.userId,
          createdByUserName: session.userName,
        });

        if (onSuccess) {
          onSuccess(
            `Tiket kebutuhan baru berhasil didaftarkan untuk ${selectedRefugee.fullName}. Silakan lakukan alokasi dan pengantaran ke tenda pada Kanban distribusi.`
          );
        }
      }

      handleClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Terjadi kegagalan memproses penyaluran logistik.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Penyaluran Logistik Warga (Ad-hoc)"
      description="Layanan permohonan logistik untuk warga yang sudah terdaftar di luar sesi pendaftaran awal."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <AlertBanner variant="danger" title="Gagal Memproses" description={errorMessage} icon="shield" />
        )}

        {/* STEP 1: PILIH / CARI WARGA TERDAFTAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Icon name="user" size={14} className="text-primary" />
              1. Identitas Warga Penerima
            </label>
            {!preselectedRefugeeId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon="qr-code"
                onClick={() => setIsScannerOpen((prev) => !prev)}
                className="text-xs text-primary"
              >
                {isScannerOpen ? "Tutup Scanner" : "Pindai QR Warga"}
              </Button>
            )}
          </div>

          {/* Scanner QR Viewfinder */}
          {isScannerOpen && !preselectedRefugeeId && (
            <div className="rounded-xl overflow-hidden border border-border p-2 bg-surface-subtle">
              <QRCameraScanner
                onScan={handleQrScan}
                active={isScannerOpen}
                viewfinderText="Arahkan ke Kartu Tugas / Surat Reuni Warga"
              />
            </div>
          )}

          {/* If refugee is not yet selected */}
          {!selectedRefugee ? (
            <div className="space-y-2">
              <div className="relative">
                <Icon
                  name="search"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama warga, NIK, ID, atau lokasi tenda..."
                  className="pl-9 text-xs"
                />
              </div>

              {filteredRefugees.length > 0 && (
                <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
                  {filteredRefugees.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRefugee(r);
                        setSearchQuery("");
                        setErrorMessage(null);
                      }}
                      className="w-full p-3 text-left hover:bg-surface-subtle transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-text-main">{r.fullName}</p>
                        <p className="text-[11px] text-text-muted">
                          {r.age} Thn ({r.gender === "M" ? "L" : "P"}) • Tenda: {r.shelterLocation || "Belum ditentukan"} • ID: {r.id}
                        </p>
                      </div>
                      <Badge
                        variant={
                          r.triageStatus === "RED"
                            ? "triage-red"
                            : r.triageStatus === "YELLOW"
                            ? "triage-yellow"
                            : "triage-green"
                        }
                        size="sm"
                      >
                        {r.triageStatus === "RED" ? "Kritis" : r.triageStatus === "YELLOW" ? "Perawatan" : "Stabil"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Refugee Card */
            <Card className="p-3.5 border-primary/40 bg-primary/5 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-text-main">{selectedRefugee.fullName}</h4>
                    <Badge variant="safe" size="sm">Terdaftar di Posko</Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {selectedRefugee.age} Thn • ID: {selectedRefugee.id} {selectedRefugee.nik ? `• NIK: ${selectedRefugee.nik}` : ""}
                  </p>
                  <p className="text-xs font-medium text-text-main mt-0.5">
                    Lokasi Tenda: <span className="font-bold text-primary">{selectedRefugee.shelterLocation || "Tenda Umum"}</span>
                  </p>
                </div>
                {!preselectedRefugeeId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRefugee(null)}
                    className="text-xs"
                  >
                    Ganti Warga
                  </Button>
                )}
              </div>

              {/* Vulnerabilities */}
              {selectedRefugee.vulnerabilities && selectedRefugee.vulnerabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                  <span className="text-[11px] text-text-muted mr-1">Kerentanan:</span>
                  {selectedRefugee.vulnerabilities.map((v) => (
                    <Badge key={v} variant="neutral" size="sm">
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* STEP 2: ANTI-HOARDING WARNING (Jika baru saja menerima bantuan serupa) */}
        {duplicateWarning && (
          <AlertBanner
            variant="warning"
            title="Peringatan Kuota & Pemerataan Bantuan"
            description={`Warga ini telah menerima "${duplicateWarning.itemName}" (${duplicateWarning.quantity} ${duplicateWarning.unit}) pada ${new Date(duplicateWarning.completedAt || duplicateWarning.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB (< 72 jam lalu). Pastikan ada alasan valid untuk permohonan tambahan.`}
            icon="shield"
          />
        )}

        {/* STEP 3: PILIHAN METODE PENYALURAN */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Icon name="delivery" size={14} className="text-primary" />
            2. Metode Penyaluran
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFulfillmentMode("DIRECT_HANDOVER")}
              className={`p-3 rounded-xl border-[1.5px] text-left transition-all cursor-pointer ${
                fulfillmentMode === "DIRECT_HANDOVER"
                  ? "border-primary bg-primary/10 shadow-2xs"
                  : "border-border bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-xs font-bold text-text-main">Serah Langsung di Meja</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Warga ada di depan posko logistik. Stok gudang langsung terpotong seketika.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFulfillmentMode("TENT_DELIVERY")}
              className={`p-3 rounded-xl border-[1.5px] text-left transition-all cursor-pointer ${
                fulfillmentMode === "TENT_DELIVERY"
                  ? "border-primary bg-primary/10 shadow-2xs"
                  : "border-border bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
                <span className="text-xs font-bold text-text-main">Antar ke Tenda (Antrean)</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Masuk ke Kanban antrean distribusi agar diantarkan oleh relawan lapangan.
              </p>
            </button>
          </div>
        </div>

        {/* STEP 4: PILIH BARANG LOGISTIK */}
        <div className="space-y-3 p-3.5 rounded-xl bg-surface-subtle border border-border">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-main block">
              Komoditas Bantuan Gudang Posko
            </label>
            {poskoInventory.length === 0 ? (
              <p className="text-xs text-status-danger font-medium">
                Inventaris posko ini kosong. Lakukan restock barang terlebih dahulu.
              </p>
            ) : (
              <Select
                value={selectedItemId}
                onChange={(val) => setSelectedItemId(val)}
                options={poskoInventory.map((item) => ({
                  value: item.id,
                  label: `${item.itemName} — Tersedia: ${item.currentQuantity} ${item.unit} (${item.category})`,
                }))}
                className="text-xs"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-main block">
                Jumlah yang Diberikan ({targetItem?.unit || "Unit"})
              </label>
              <Input
                type="number"
                min={1}
                max={fulfillmentMode === "DIRECT_HANDOVER" ? targetItem?.currentQuantity || 100 : 100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="text-xs"
                required
              />
              {targetItem && (
                <p className="text-[11px] text-text-muted">
                  Stok tersedia di gudang: <strong>{targetItem.currentQuantity} {targetItem.unit}</strong>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-main block">
                Tingkat Urgensi
              </label>
              <Select
                value={urgency}
                onChange={(val) => setUrgency(val as "HIGH" | "MEDIUM" | "LOW")}
                options={[
                  { value: "HIGH", label: "Mendesak / Kritis (Prioritas Utama)" },
                  { value: "MEDIUM", label: "Standar / Harian" },
                  { value: "LOW", label: "Tambahan / Cadangan" },
                ]}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-main block">
              Catatan Permohonan / Alasan
            </label>
            <Input
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              placeholder="Contoh: Susu bayi habis, jatah harian tenda 04, dll."
              className="text-xs"
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !selectedRefugee || !targetItem}
            className="font-bold"
            icon={fulfillmentMode === "DIRECT_HANDOVER" ? "check" : "delivery"}
            iconVariant="bold"
          >
            {isSubmitting
              ? "Memproses..."
              : fulfillmentMode === "DIRECT_HANDOVER"
              ? "Serahkan & Potong Stok Sekarang"
              : "Daftarkan ke Antrean Distribusi"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
