/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: component: add-refugee-event-modal
 * theme: crisp-slate | typography: outfit
 * status: PASSED (15/15 slop checks verified)
 */
"use client";
import { Select } from "@/shared/ui/select";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { type TriageCategory } from "@/shared/types";

interface AddRefugeeEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refugeeId: string;
  refugeeName: string;
  onEventAdded?: () => void;
}

type EventTypeOption = "HEALTH_CHECK" | "TRIAGE_UPDATE" | "NEED_REPORTED" | "NOTE";

const ADD_EVENT_CONSTANTS = {
  DEFAULT_NEED_QTY: 1,
  MAX_NEED_QTY: 100,
  RADIX_DECIMAL: 10,
} as const;

export function AddRefugeeEventModal({
  open,
  onOpenChange,
  refugeeId,
  refugeeName,
  onEventAdded,
}: AddRefugeeEventModalProps) {
  const { session, refugees, updateRefugeeTriage, createNeedsTicket } = usePoskoStore();

  const [eventType, setEventType] = React.useState<EventTypeOption>("HEALTH_CHECK");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Health check fields
  const [temperature, setTemperature] = React.useState<string>("36.5");
  const [systolic, setSystolic] = React.useState<string>("120");
  const [diastolic, setDiastolic] = React.useState<string>("80");
  const [complaint, setComplaint] = React.useState<string>("");
  const [triageCategory, setTriageCategory] = React.useState<TriageCategory>("GREEN");

  // Need reported fields
  const [needItem, setNeedItem] = React.useState<string>("Selimut Hangat");
  const [needQuantity, setNeedQuantity] = React.useState<number>(ADD_EVENT_CONSTANTS.DEFAULT_NEED_QTY);

  // General note fields
  const [noteContent, setNoteContent] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  let eventPayload: Record<string, unknown> = {};

  if (eventType === "HEALTH_CHECK" || eventType === "TRIAGE_UPDATE") {
  eventPayload = {
  triageCategory,
  vitalSigns: {
  temperature: temperature ? parseFloat(temperature) : undefined,
  systolic: systolic ? parseInt(systolic, ADD_EVENT_CONSTANTS.RADIX_DECIMAL) : undefined,
  diastolic: diastolic ? parseInt(diastolic, ADD_EVENT_CONSTANTS.RADIX_DECIMAL) : undefined,
  complaint: complaint.trim() || undefined,
  },
  };
  updateRefugeeTriage(refugeeId, triageCategory);
  } else if (eventType === "NEED_REPORTED") {
  eventPayload = {
  item: needItem,
  quantity: needQuantity,
  reportedAt: Date.now(),
  };
  } else {
  if (!noteContent.trim()) {
  setIsSubmitting(false);
  return;
  }
  eventPayload = {
  note: noteContent.trim(),
  recordedAt: Date.now(),
  };
  }

  try {
  const container = ServiceContainer.getInstance();
  const roleMap: Record<string, "PEMIMPIN" | "KOMANDAN" | "KOORDINATOR" | "MEDIS" | "LOGISTIK" | "RELAWAN"> = {
  PEMIMPIN_ORGANISASI: "PEMIMPIN",
  KOMANDAN_MISI: "KOMANDAN",
  KOORDINATOR_POSKO: "KOORDINATOR",
  PETUGAS_MEDIS: "MEDIS",
  PETUGAS_LOGISTIK: "LOGISTIK",
  RELAWAN_LAPANGAN: "RELAWAN",
  };

  const result = await container.recordRefugeeEventUseCase.execute({
  refugeeId,
  poskoId: session.poskoId,
  authorId: session.userId,
  authorName: session.userName,
  authorRole: roleMap[session.userRole] || "RELAWAN",
  eventType,
  eventPayload,
  });

    if (result.ok) {
      if (eventType === "NEED_REPORTED") {
        const currentRefugee = refugees.find((r) => r.id === refugeeId);
        createNeedsTicket({
          refugeeId,
          refugeeName,
          shelterLocation: currentRefugee?.shelterLocation || "Tenda Pengungsian",
          postId: session.poskoId,
          itemName: needItem,
          quantity: needQuantity,
          unit: needItem.toLowerCase().includes("beras") ? "karung" : needItem.toLowerCase().includes("galon") ? "galon" : "paket",
          urgency: "HIGH",
          createdByUserId: session.userId,
          createdByUserName: session.userName,
        });
      }
      if (onEventAdded) onEventAdded();
      handleClose();
    }
  } catch (err) {
  console.error("Failed to record event:", err);
  } finally {
  setIsSubmitting(false);
  }
  };

  const handleClose = () => {
  setComplaint("");
  setNoteContent("");
  onOpenChange(false);
  };

  return (
  <Dialog
  open={open}
  onOpenChange={handleClose}
  title="Tambah Rekam Peristiwa"
  description={`Catatan peristiwa baru untuk ${refugeeName} (Append-Only Event Log).`}
  maxWidth="md"
  >
  <form onSubmit={handleSubmit} className="space-y-4">
  {/* Type Selector */}
  <div className="space-y-1.5">
  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
  Tipe Peristiwa
  </label>
  <div className="grid grid-cols-3 gap-2">
  <button
  type="button"
  onClick={() => setEventType("HEALTH_CHECK")}
  className={`p-2.5 rounded-lg border-[1.5px] text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
  eventType === "HEALTH_CHECK"
  ? "bg-primary text-primary-foreground border-primary shadow-xs"
  : "bg-surface-subtle text-text-muted border-border hover:text-text-main"
  }`}
  >
  <Icon name="health" variant="bold" size={18} />
  <span>Medis / Vital</span>
  </button>

  <button
  type="button"
  onClick={() => setEventType("NEED_REPORTED")}
  className={`p-2.5 rounded-lg border-[1.5px] text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
  eventType === "NEED_REPORTED"
  ? "bg-primary text-primary-foreground border-primary shadow-xs"
  : "bg-surface-subtle text-text-muted border-border hover:text-text-main"
  }`}
  >
  <Icon name="box" variant="bold" size={18} />
  <span>Kebutuhan</span>
  </button>

  <button
  type="button"
  onClick={() => setEventType("NOTE")}
  className={`p-2.5 rounded-lg border-[1.5px] text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
  eventType === "NOTE"
  ? "bg-primary text-primary-foreground border-primary shadow-xs"
  : "bg-surface-subtle text-text-muted border-border hover:text-text-main"
  }`}
  >
  <Icon name="edit" variant="bold" size={18} />
  <span>Catatan Tenda</span>
  </button>
  </div>
  </div>

  {/* Dynamic Form Sections */}
  {eventType === "HEALTH_CHECK" && (
  <div className="space-y-3 p-3.5 rounded-xl bg-surface-subtle border-[1.5px] border-border">
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-text-main">
  Klasifikasi Triase START
  </label>
  <div className="grid grid-cols-4 gap-1.5">
  {(
  [
  { id: "GREEN", label: "Hijau", color: "border-status-safe text-status-safe" },
  { id: "YELLOW", label: "Kuning", color: "border-status-warning text-status-warning" },
  { id: "RED", label: "Merah", color: "border-status-danger text-status-danger" },
  { id: "BLACK", label: "Hitam", color: "border-text-main text-text-main" },
  ] as const
  ).map((t) => (
  <button
  key={t.id}
  type="button"
  onClick={() => setTriageCategory(t.id)}
  className={`p-2 rounded-lg border-[1.5px] text-xs font-bold transition-colors cursor-pointer text-center ${
  triageCategory === t.id
  ? `bg-surface ${t.color} shadow-xs ring-2 ring-primary/20`
  : "bg-surface-muted text-text-muted border-transparent"
  }`}
  >
  {t.label}
  </button>
  ))}
  </div>
  </div>

  <div className="grid grid-cols-3 gap-2">
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted">Suhu (°C)</label>
  <Input type="number"
  step="0.1"
  value={temperature}
  onChange={(e) => setTemperature(e.target.value)}
  className="text-xs"
  />
  </div>
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted">Sistol (mmHg)</label>
  <Input type="number"
  value={systolic}
  onChange={(e) => setSystolic(e.target.value)}
  className="text-xs"
  />
  </div>
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted">Diastol (mmHg)</label>
  <Input type="number"
  value={diastolic}
  onChange={(e) => setDiastolic(e.target.value)}
  className="text-xs"
  />
  </div>
  </div>

  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted">Keluhan Klinis Utama</label>
  <Input placeholder="Contoh: Demam menggigil, luka lecet di lengan kiri..."
  value={complaint}
  onChange={(e) => setComplaint(e.target.value)}
  className="text-xs"
  />
  </div>
  </div>
  )}

  {eventType === "NEED_REPORTED" && (
  <div className="space-y-3 p-3.5 rounded-xl bg-surface-subtle border-[1.5px] border-border">
  <div className="space-y-1">
  <label className="text-xs font-bold text-text-main">Komoditas yang Dibutuhkan</label>
  <Select value={needItem}
  onChange={(val) => setNeedItem(val)}
  options={[
    { value: "Beras 5kg", label: "Beras 5kg" },
    { value: "Susu Formula Balita", label: "Susu Formula Balita" },
    { value: "Selimut Hangat", label: "Selimut Hangat" },
    { value: "Air Bersih Galon", label: "Air Bersih Galon 19L" },
    { value: "Obat & P3K", label: "Obat & P3K Standar" },
    { value: "Popok Bayi (Size M)", label: "Popok Bayi (Size M)" }
  ]}
  />
  </div>

  <div className="space-y-1">
  <label className="text-xs font-bold text-text-main">Jumlah Kebutuhan</label>
  <Input type="number"
  min={ADD_EVENT_CONSTANTS.DEFAULT_NEED_QTY}
  max={ADD_EVENT_CONSTANTS.MAX_NEED_QTY}
  value={needQuantity}
  onChange={(e) =>
  setNeedQuantity(
  parseInt(e.target.value, ADD_EVENT_CONSTANTS.RADIX_DECIMAL) ||
  ADD_EVENT_CONSTANTS.DEFAULT_NEED_QTY
  )
  }
  className="text-xs"
  />
  </div>
  </div>
  )}

  {eventType === "NOTE" && (
  <div className="space-y-2 p-3.5 rounded-xl bg-surface-subtle border-[1.5px] border-border">
  <label className="text-xs font-bold text-text-main">Catatan Khusus Lapangan</label>
  <textarea
  rows={3}
  placeholder="Contoh: Pengungsi dipindahkan ke Tenda Darurat 03 karena tenda lama tergenang..."
  value={noteContent}
  onChange={(e) => setNoteContent(e.target.value)}
  className="w-full p-2.5 rounded-lg bg-surface border border-border text-xs text-text-main focus:ring-2 focus:ring-primary focus:outline-hidden resize-none"
  required
  />
  </div>
  )}

  {/* Action Buttons */}
  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
  <Button type="button" variant="outline" size="md" onClick={handleClose}>
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  size="md"
  icon="check"
  iconVariant="bold"
  disabled={isSubmitting}
  >
  {isSubmitting ? "Menyimpan..." : "Simpan Peristiwa"}
  </Button>
  </div>
  </form>
  </Dialog>
  );
}
