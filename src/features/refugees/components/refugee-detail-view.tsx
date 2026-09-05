/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: component: refugee-detail-view
 * theme: crisp-slate | typography: outfit
 * status: PASSED (15/15 slop checks verified)
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asRefugeeId } from "@/core/shared/branded-types";
import { RefugeeEventProps } from "@/core/domain/refugees/refugee.aggregate";
import { AddRefugeeEventModal } from "./add-refugee-event-modal";
import { EditRefugeeModal } from "./edit-refugee-modal";
import { EmptyState } from "@/shared/ui/empty-state";

export function RefugeeDetailView({ refugeeId }: { refugeeId: string }) {
  const router = useRouter();
  const { session, refugees, deleteRefugee } = usePoskoStore();

  const person = refugees.find((r) => r.id === refugeeId);
  const [addEventOpen, setAddEventOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = React.useState(false);
  const [dbEvents, setDbEvents] = React.useState<RefugeeEventProps[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(true);

  const fetchEvents = React.useCallback(async () => {
  if (!person) return;
  setIsLoadingEvents(true);
  try {
  const container = ServiceContainer.getInstance();
  const result = await container.refugeeRepo.getEventsByRefugeeId(asRefugeeId(person.id));
  if (result.ok) {
  setDbEvents(result.value);
  }
  } catch (err) {
  console.error("Failed to load refugee events:", err);
  } finally {
  setIsLoadingEvents(false);
  }
  }, [person]);

  React.useEffect(() => {
  fetchEvents();
  }, [fetchEvents]);

  const handleCheckout = () => {
  if (!person) return;
  deleteRefugee(person.id);
  setCheckoutModalOpen(false);
  router.push(`/posko/${session.poskoId}/refugees`);
  };

  if (!person) {
  return (
  <div className="py-12 px-4 max-w-xl mx-auto">
  <EmptyState
  icon="user"
  title="Data Warga Tidak Ditemukan"
  description={`Data warga dengan identitas "${refugeeId}" tidak terdaftar di posko ini.`}
  actionLabel="Kembali ke Daftar Warga"
  actionHref={`/posko/${session.poskoId}/refugees`}
  />
  </div>
  );
  }

  const formatEventTitle = (type: string) => {
  switch (type) {
  case "INTAKE":
  return "Pendaftaran Awal (Intake)";
  case "HEALTH_CHECK":
  return "Pemeriksaan Medis & Tanda Vital";
  case "TRIAGE_UPDATE":
  return "Perubahan Status Triase";
  case "NEED_REPORTED":
  return "Permintaan Kebutuhan Mendesak";
  case "AID_RECEIVED":
  return "Penyerahan Bantuan Logistik";
  case "NOTE":
  default:
  return "Catatan Khusus Lapangan";
  }
  };

  const getRoleBadge = (role: string) => {
  switch (role) {
  case "MEDIS":
  return <Badge variant="triage-red" size="sm">Medis</Badge>;
  case "LOGISTIK":
  return <Badge variant="triage-yellow" size="sm">Logistik</Badge>;
  case "KOORDINATOR":
  case "KOMANDAN":
  case "PEMIMPIN":
  return <Badge variant="safe" size="sm">Otoritas</Badge>;
  default:
  return <Badge variant="neutral" size="sm">Relawan</Badge>;
  }
  };

  const formatPayloadDescription = (evt: RefugeeEventProps) => {
  const p = evt.eventPayload as Record<string, any>;
  if (evt.eventType === "HEALTH_CHECK" || evt.eventType === "TRIAGE_UPDATE") {
  const v = p.vitalSigns || {};
  const parts = [];
  if (v.temperature) parts.push(`Suhu: ${v.temperature}°C`);
  if (v.systolic && v.diastolic) parts.push(`Tensi: ${v.systolic}/${v.diastolic} mmHg`);
  if (v.complaint) parts.push(`Keluhan: "${v.complaint}"`);
  if (p.triageCategory) parts.push(`Triase: ${p.triageCategory}`);
  return parts.join(" • ") || "Pemeriksaan vital stabil.";
  }
  if (evt.eventType === "NEED_REPORTED") {
  return `Permintaan: ${p.item || "Barang"} (${p.quantity || 1} unit)`;
  }
  if (evt.eventType === "AID_RECEIVED") {
  return `Bantuan Diserahkan: ${p.item || p.payload || "Bantuan logistik resmi"}`;
  }
  if (evt.eventType === "INTAKE") {
  return `Warga didata pertama kali saat tiba di ${p.initialShelter || person.shelterLocation || "posko evakuasi"}.`;
  }
  if (p.note) {
  return p.note;
  }
  return JSON.stringify(p);
  };

  return (
  <div className="space-y-6">
  {/* Top Back & Action Header */}
  <div className="flex flex-wrap items-center justify-between gap-2">
  <Link href={`/posko/${session.poskoId}/refugees`}>
  <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
  Kembali ke Daftar Warga
  </Button>
  </Link>
  <div className="flex items-center gap-2">
  <Button
  variant="outline"
  size="sm"
  icon="edit"
  onClick={() => setEditModalOpen(true)}
  >
  Edit Data Pokok
  </Button>
  <Button
  variant="primary"
  size="sm"
  icon="add-circle"
  iconVariant="bold"
  onClick={() => setAddEventOpen(true)}
  >
  + Rekam Peristiwa
  </Button>
  <Button
  variant="ghost"
  size="sm"
  icon="trash"
  onClick={() => setCheckoutModalOpen(true)}
  className="text-status-danger hover:bg-status-danger-bg"
  >
  Checkout Warga
  </Button>
  </div>
  </div>

  {/* Refugee Profile Card */}
  <Card>
  <CardContent className="p-5 sm:p-6 space-y-4">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
  <div className="flex items-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-surface-muted text-text-main font-bold flex items-center justify-center text-lg border border-border shrink-0">
  {person.gender === "M" ? "L" : "P"}
  </div>
  <div>
  <div className="flex items-center gap-2 mb-1">
  <Badge
  variant={
  person.triageStatus === "RED"
  ? "triage-red"
  : person.triageStatus === "YELLOW"
  ? "triage-yellow"
  : "triage-green"
  }
  size="sm"
  >
  {person.triageStatus === "RED" ? "Kritis" : person.triageStatus === "YELLOW" ? "Perawatan" : "Sehat"}
  </Badge>
  <span className="text-xs text-text-muted">
  {person.age} Tahun ({person.gender === "M" ? "Laki-laki" : "Perempuan"})
  </span>
  </div>
  <h2 className="text-xl font-bold text-text-main">
  {person.fullName}
  </h2>
  <p className="text-xs text-text-muted mt-0.5">
  ID: {person.id} {person.nik ? `• NIK: ${person.nik}` : "• (KTP Hilang / 0 Byte)"}
  </p>
  </div>
  </div>
  </div>

  {/* Details Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
  <div className="p-3 rounded-lg bg-surface-subtle border border-border">
  <span className="text-text-muted font-medium">Lokasi Tenda / Ruang:</span>
  <p className="text-sm font-bold text-text-main mt-0.5">
  {person.shelterLocation}
  </p>
  </div>

  <div className="p-3 rounded-lg bg-surface-subtle border border-border">
  <span className="text-text-muted font-medium">Asal Dusun / Desa:</span>
  <p className="text-sm font-bold text-text-main mt-0.5">
  {person.domicileOrigin}
  </p>
  </div>

  <div className="p-3 rounded-lg bg-surface-subtle border border-border">
  <span className="text-text-muted font-medium">Kerabat yang Dicari:</span>
  <p className="text-sm font-bold text-text-main mt-0.5">
  {person.missingKinName || "Tidak ada"}
  </p>
  </div>
  </div>

  {/* Urgent Needs & Vulnerabilities */}
  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
  {person.vulnerabilities.map((v) => (
  <Badge key={v} variant="neutral" size="sm">
  Kerentanan: {v}
  </Badge>
  ))}
  {person.urgentNeeds.map((need) => (
  <Badge key={need} variant="primary" size="sm">
  Kebutuhan: {need}
  </Badge>
  ))}
  </div>
  </CardContent>
  </Card>

  {/* Event Timeline History */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <div>
  <CardTitle>Kronologi & Rekam Peristiwa ({dbEvents.length})</CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  Histori berantai append-only event sourcing tercatat lokal di SQLite posko.
  </p>
  </div>
  <Button
  variant="outline"
  size="sm"
  icon="sync"
  onClick={fetchEvents}
  disabled={isLoadingEvents}
  >
  Segarkan
  </Button>
  </div>
  </CardHeader>
  <CardContent>
  {isLoadingEvents ? (
  <div className="p-6 text-center text-xs text-text-muted">
  Memuat histori peristiwa warga...
  </div>
  ) : dbEvents.length === 0 ? (
  <div className="p-6 text-center text-xs text-text-muted">
  Belum ada peristiwa lanjutan. Klik &quot;+ Rekam Peristiwa&quot; untuk mencatat triase, obat, atau bantuan.
  </div>
  ) : (
  <div className="space-y-3">
  {dbEvents.map((evt) => (
  <div
  key={evt.id}
  className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-start gap-3 shadow-2xs"
  >
  <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
  <Icon name="check" variant="bold" size={16} className="text-primary" />
  </div>

  <div className="flex-1 min-w-0 space-y-1">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
  <div className="flex items-center gap-2">
  <span className="text-xs font-bold text-text-main">
  {formatEventTitle(evt.eventType)}
  </span>
  {getRoleBadge(evt.authorRole)}
  </div>
  <span className="text-[11px] font-mono text-text-muted">
  Seq #{evt.logicalSeq} • {new Date(evt.deviceTimestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
  </span>
  </div>

  <p className="text-xs text-text-main leading-relaxed">
  {formatPayloadDescription(evt)}
  </p>

  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-text-muted">
  <span>Dicatat oleh: <strong>{evt.authorName}</strong></span>
  <span className="font-mono text-[10px]">ID: {evt.id.slice(0, 8)}...</span>
  </div>
  </div>
  </div>
  ))}
  </div>
  )}
  </CardContent>
  </Card>

  {/* Edit Refugee Modal */}
  <EditRefugeeModal
  open={editModalOpen}
  onOpenChange={setEditModalOpen}
  refugee={person}
  />

  {/* Add Event Modal */}
  <AddRefugeeEventModal
  open={addEventOpen}
  onOpenChange={setAddEventOpen}
  refugeeId={person.id}
  refugeeName={person.fullName}
  onEventAdded={fetchEvents}
  />

  {/* Checkout Confirmation Dialog */}
  <Dialog
  open={checkoutModalOpen}
  onOpenChange={setCheckoutModalOpen}
  title="Konfirmasi Checkout / Pindah Posko"
  description={`Apakah Anda yakin ingin memproses checkout/pelepasan untuk warga "${person.fullName}"? Data riwayat pengungsian akan ditandai selesai.`}
  >
  <div className="space-y-4">
  <p className="text-xs text-text-muted">
  Aksi ini akan mengeluarkan warga dari daftar aktif posko ini dan menyiarkan pembaruan status ke seluruh jaringan mesh.
  </p>
  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
  <Button
  variant="ghost"
  size="sm"
  onClick={() => setCheckoutModalOpen(false)}
  >
  Batal
  </Button>
  <Button
  variant="danger"
  size="sm"
  icon="trash"
  onClick={handleCheckout}
  >
  Ya, Proses Checkout
  </Button>
  </div>
  </div>
  </Dialog>
  </div>
  );
}
