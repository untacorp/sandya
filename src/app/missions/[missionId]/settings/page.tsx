"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Dialog } from "@/shared/ui/dialog";
import { RolePassModal } from "@/features/auth/components/role-pass-modal";
import { PageHeader } from "@/shared/ui/page-header";
import { useParams } from "next/navigation";
import { type DisasterMission, type Posko, type MissionStatus } from "@/shared/types";

export default function MissionSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = (params?.missionId as string) || "";
  const { session, missions, poskos, updateMission, closeMission } = usePoskoStore();

  const mission = missions.find((m) => m.id === missionId || m.id === session.missionId);

  const [name, setName] = React.useState(mission?.name || "");
  const [disasterType, setDisasterType] = React.useState(mission?.disasterType || "GEMPA_BUMI");
  const [location, setLocation] = React.useState(mission?.location || "");
  const [targetDays, setTargetDays] = React.useState(mission?.targetDays || 14);
  const [status, setStatus] = React.useState<MissionStatus>(mission?.status || "ACTIVE_EMERGENCY");
  const [isSaved, setIsSaved] = React.useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [commanderPassOpen, setCommanderPassOpen] = React.useState(false);

  if (!mission) {
  return null;
  }

  React.useEffect(() => {
  if (mission) {
  setName(mission.name);
  setDisasterType(mission.disasterType);
  setLocation(mission.location);
  setTargetDays(mission.targetDays);
  setStatus(mission.status);
  }
  }, [mission]);

  const missionPoskos: Posko[] = poskos.filter((p) => p.missionId === mission.id);

  const handleSaveMission = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;

  updateMission(mission.id, {
  name: name.trim(),
  disasterType,
  location: location.trim(),
  targetDays: Number(targetDays) || 1,
  status,
  });

  setIsSaved(true);
  setTimeout(() => setIsSaved(false), 2000);
  };

  const handleArchiveMission = () => {
  closeMission(mission.id);
  setArchiveDialogOpen(false);
  setStatus("CLOSED_ARCHIVED");
  setIsSaved(true);
  };

  const getStatusBadgeVariant = (st: MissionStatus) => {
  switch (st) {
  case "ACTIVE_EMERGENCY":
  return "safe";
  case "TRANSITION_RECOVERY":
  return "warning";
  case "CLOSED_ARCHIVED":
  return "neutral";
  default:
  return "primary";
  }
  };

  const getStatusLabel = (st: MissionStatus) => {
  switch (st) {
  case "ACTIVE_EMERGENCY":
  return "Tanggap Darurat Aktif";
  case "TRANSITION_RECOVERY":
  return "Masa Transisi & Pemulihan";
  case "CLOSED_ARCHIVED":
  return "Operasi Ditutup & Diarsipkan";
  case "PREPAREDNESS":
  return "Kesiapsiagaan";
  default:
  return st;
  }
  };

  return (
  <div className="space-y-5 max-w-4xl">
  <PageHeader
  title="Pengaturan Operasi Misi"
  description="Kelola profil misi tanggap darurat, jenis bencana, target masa tanggap, dan status siklus operasi."
  />

  {/* Mission Profile Card */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <CardTitle>Profil Operasi Bencana</CardTitle>
  <Badge variant={getStatusBadgeVariant(status)} size="sm">
  {getStatusLabel(status)}
  </Badge>
  </div>
  </CardHeader>
  <CardContent>
  <form onSubmit={handleSaveMission} className="space-y-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Operasi Misi
  </label>
  <Input value={name}
  onChange={(e) => setName(e.target.value)}
  icon="buildings"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Jenis Bencana
  </label>
  <select value={disasterType}
  onChange={(e) => setDisasterType(e.target.value as DisasterMission["disasterType"])}
  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none focus:border-border-strong transition-colors"
  >
  <option value="GEMPA_BUMI">Gempa Bumi</option>
  <option value="BANJIR_BANDANG">Banjir Bandang</option>
  <option value="ERUPSI_GUNUNG">Erupsi Gunung Api</option>
  <option value="LONGSOR">Tanah Longsor</option>
  <option value="TSUNAMI">Tsunami</option>
  </select>
  </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Wilayah / Cakupan Lokasi
  </label>
  <Input value={location}
  onChange={(e) => setLocation(e.target.value)}
  icon="pin"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Target Masa Tanggap (Hari)
  </label>
  <Input type="number"
  value={targetDays}
  onChange={(e) => setTargetDays(Number(e.target.value))}
  min={1}
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Status Siklus Misi
  </label>
  <select value={status}
  onChange={(e) => setStatus(e.target.value as MissionStatus)}
  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none focus:border-border-strong transition-colors"
  >
  <option value="ACTIVE_EMERGENCY">Tanggap Darurat Aktif</option>
  <option value="TRANSITION_RECOVERY">Masa Pemulihan</option>
  <option value="PREPAREDNESS">Kesiapsiagaan</option>
  <option value="CLOSED_ARCHIVED">Tutup & Diarsipkan</option>
  </select>
  </div>
  </div>

  <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
  <div className="flex items-center gap-2">
  <Link href="/org">
  <Button variant="outline" size="sm" iconRight="arrow-right">
  Markas Induk
  </Button>
  </Link>
  <Link href={`/missions/${mission.id}/poskos/create`}>
  <Button variant="ghost" size="sm" icon="add-circle">
  + Posko Baru
  </Button>
  </Link>
  {status !== "CLOSED_ARCHIVED" && (
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={() => setArchiveDialogOpen(true)}
  className="text-status-warning hover:bg-status-warning-bg"
  >
  Tutup Operasi
  </Button>
  )}
  </div>

  <Button
  type="submit"
  variant="primary"
  size="sm"
  icon="check"
  iconVariant="bold"
  className="w-full sm:w-auto"
  >
  {isSaved ? "Tersimpan" : "Simpan Pengaturan Misi"}
  </Button>
  </div>
  </form>
  </CardContent>
  </Card>

  {/* Connected Poskos */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <CardTitle>Posko Lapangan Terdaftar ({missionPoskos.length})</CardTitle>
  <Link href={`/missions/${mission.id}/poskos/create`}>
  <Button variant="outline" size="sm" icon="add-circle">
  Tambah Posko
  </Button>
  </Link>
  </div>
  </CardHeader>
  <CardContent>
  <div className="divide-y divide-border">
  {missionPoskos.map((p) => (
  <div
  key={p.id}
  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
  >
  <div className="min-w-0">
  <div className="flex items-center gap-2 mb-0.5">
  <h4 className="text-sm font-bold text-text-main truncate">{p.name}</h4>
  <span
  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
  p.status === "OPERATIONAL_NORMAL"
  ? "bg-status-safe-bg text-status-safe border-status-safe-border"
  : p.status === "HAZARD_EVACUATION"
  ? "bg-status-danger-bg text-status-danger border-status-danger"
  : "bg-status-warning-bg text-status-warning border-status-warning-border"
  }`}
  >
  {p.status === "OPERATIONAL_NORMAL" ? "Normal" : p.status === "HAZARD_EVACUATION" ? "Bahaya" : "Standby"}
  </span>
  </div>
  <p className="text-xs text-text-muted">
  {p.locationName} • Kapasitas: {p.currentRefugees} / {p.capacity} Jiwa
  </p>
  </div>

  <div className="flex items-center gap-2 shrink-0">
  <Link href={`/posko/${p.id}`} className="w-full sm:w-auto">
  <Button variant="secondary" size="sm" iconRight="arrow-right" className="w-full sm:w-auto">
  Masuk Posko
  </Button>
  </Link>
  </div>
  </div>
  ))}
  </div>
  </CardContent>
  </Card>

  {/* Kartu Tugas Komandan Misi */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <div>
  <CardTitle>Kartu Tugas Komandan Misi</CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  Terbitkan atau perbarui kode QR akses bertanda tangan digital Ed25519 untuk komandan operasi wilayah ini.
  </p>
  </div>
  <Button
  type="button"
  variant="outline"
  size="sm"
  icon="qr-code"
  iconVariant="bold"
  onClick={() => setCommanderPassOpen(true)}
  >
  Tampilkan QR Komandan
  </Button>
  </div>
  </CardHeader>
  </Card>

  {/* Archive Confirmation Dialog */}
  <Dialog
  open={archiveDialogOpen}
  onOpenChange={setArchiveDialogOpen}
  title="Tutup & Arsipkan Operasi Bencana"
  description={`Apakah Anda yakin ingin menutup operasi misi "${mission.name}"? Status operasi akan beralih ke masa arsip (CLOSED_ARCHIVED).`}
  >
  <div className="space-y-4">
  <p className="text-xs text-text-muted">
  Seluruh data posko, logistik, dan rekam pengungsi akan tetap tersimpan aman di SQLite posko dan dapat diakses untuk audit pasca-bencana.
  </p>
  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
  <Button
  variant="ghost"
  size="sm"
  onClick={() => setArchiveDialogOpen(false)}
  >
  Batal
  </Button>
  <Button
  variant="warning"
  size="sm"
  icon="check"
  onClick={handleArchiveMission}
  >
  Ya, Tutup & Arsipkan Operasi
  </Button>
  </div>
  </div>
  </Dialog>

  {/* Real Ed25519 Cryptographic Role Pass Modal for Mission Commander */}
  <RolePassModal
  open={commanderPassOpen}
  onOpenChange={setCommanderPassOpen}
  role="KOMANDAN_MISI"
  officerName={session.userName || "Komandan Misi Wilayah"}
  poskoId=""
  poskoName="Markas Wilayah Operasi"
  missionId={mission.id}
  missionName={mission.name}
  orgId={session.orgId}
  />
  </div>
  );
}
