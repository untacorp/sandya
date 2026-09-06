"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { RolePassModal } from "@/features/auth/components/role-pass-modal";
import { StaffRole } from "@/core/shared/roles";
import { type PostType, type PostStatus } from "@/shared/types";

interface OfficerPassTarget {
  name: string;
  role: StaffRole;
  poskoId: string;
  poskoName: string;
  missionId: string;
  missionName: string;
}

export default function PoskoSettingsPage() {
  const { session, poskos, updatePosko, updatePoskoStatus, deletePosko } = usePoskoStore();
  const [selectedTarget, setSelectedTarget] = React.useState<OfficerPassTarget | null>(null);

  const currentPosko = poskos.find((p) => p.id === session.poskoId) || null;

  const [poskoName, setPoskoName] = React.useState(currentPosko?.name || session.poskoName || "");
  const [locationName, setLocationName] = React.useState(currentPosko?.locationName || "");
  const [capacity, setCapacity] = React.useState(currentPosko?.capacity || 0);
  const [postType, setPostType] = React.useState<PostType>(currentPosko?.postType || "FIELD_SHELTER");
  const [status, setStatus] = React.useState<PostStatus>(currentPosko?.status || "OPERATIONAL_NORMAL");
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
  if (currentPosko) {
  setPoskoName(currentPosko.name);
  setLocationName(currentPosko.locationName);
  setCapacity(currentPosko.capacity);
  setPostType(currentPosko.postType);
  setStatus(currentPosko.status);
  }
  }, [currentPosko]);

  const handleSavePosko = (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentPosko) return;
  updatePosko(currentPosko.id, {
  name: poskoName.trim(),
  locationName: locationName.trim(),
  capacity: Number(capacity) || 0,
  postType,
  status,
  });
  setIsSaved(true);
  setTimeout(() => setIsSaved(false), 2000);
  };

  const teamRoles: { role: StaffRole; title: string; desc: string; icon: SolarIconName }[] = [
  {
  role: "PETUGAS_MEDIS",
  title: "Tim Medis / Dokter",
  desc: "Akses Triase Medis & Resep Obat Darurat",
  icon: "health",
  },
  {
  role: "PETUGAS_LOGISTIK",
  title: "Petugas Logistik & Gudang",
  desc: "Akses Single-Writer mutasi stok gudang & distribusi",
  icon: "box",
  },
  {
  role: "RELAWAN_LAPANGAN",
  title: "Relawan Lapangan",
  desc: "Akses pendaftaran cepat warga 30s & serah terima bantuan",
  icon: "users",
  },
  {
  role: "KOORDINATOR_POSKO",
  title: "Koordinator Posko",
  desc: "Pimpinan posko tenda & otorisasi alarm bahaya SOS",
  icon: "home",
  },
  ];

  return (
  <div className="space-y-6 max-w-4xl">
  <div>
  <h2 className="text-xl font-bold text-text-main tracking-tight">
  Pengaturan Posko Lapangan
  </h2>
  <p className="text-xs text-text-muted mt-0.5">
  Kelola profil posko, kapasitas, status siaga bahaya, dan delegasi kartu tugas regu bertanda tangan digital.
  </p>
  </div>

  {/* Posko Profile Card */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <CardTitle>Profil & Status Posko</CardTitle>
  <span
  className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
  status === "OPERATIONAL_NORMAL"
  ? "bg-status-safe-bg text-status-safe border-status-safe-border"
  : status === "HAZARD_EVACUATION"
  ? "bg-status-danger-bg text-status-danger border-status-danger animate-pulse"
  : "bg-status-warning-bg text-status-warning border-status-warning-border"
  }`}
  >
  {status === "OPERATIONAL_NORMAL"
  ? "Operasional Normal"
  : status === "HAZARD_EVACUATION"
  ? "Zona Evakuasi Bahaya"
  : "Siaga Standby"}
  </span>
  </div>
  </CardHeader>
  <CardContent>
  <form onSubmit={handleSavePosko} className="space-y-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Posko
  </label>
  <Input value={poskoName}
  onChange={(e) => setPoskoName(e.target.value)}
  icon="home"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Lokasi / Titik Kumpul
  </label>
  <Input value={locationName}
  onChange={(e) => setLocationName(e.target.value)}
  icon="pin"
  required
  />
  </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Status Operasional
  </label>
  <select value={status}
  onChange={(e) => setStatus(e.target.value as PostStatus)}
  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none focus:border-border-strong transition-colors"
  >
  <option value="OPERATIONAL_NORMAL">Normal (Operasional)</option>
  <option value="STANDBY">Siaga (Standby)</option>
  <option value="HAZARD_EVACUATION">Evakuasi Bahaya (Hazard)</option>
  </select>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Jenis Fasilitas
  </label>
  <select value={postType}
  onChange={(e) => setPostType(e.target.value as PostType)}
  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none focus:border-border-strong transition-colors"
  >
  <option value="FIELD_SHELTER">Posko Tenda Lapangan</option>
  <option value="MAIN_WAREHOUSE">Gudang Logistik Sentral</option>
  <option value="MEDICAL_POST">Pos Medis / Rumah Sakit Darurat</option>
  </select>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Kapasitas Tampung (Jiwa)
  </label>
  <Input type="number"
  value={capacity}
  onChange={(e) => setCapacity(Number(e.target.value))}
  min={1}
  required
  />
  </div>
  </div>

  <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
  <div className="flex items-center gap-2">
  <Link href={`/missions/${session.missionId}`}>
  <Button variant="outline" size="sm" iconRight="arrow-right">
  Halaman Misi Bencana
  </Button>
  </Link>
  <Link href={`/missions/${session.missionId}/poskos`}>
  <Button variant="ghost" size="sm" icon="sync">
  Beralih Posko
  </Button>
  </Link>
  </div>

  <Button
  type="submit"
  variant="primary"
  size="sm"
  icon="check"
  iconVariant="bold"
  className="w-full sm:w-auto"
  >
  {isSaved ? "Tersimpan" : "Simpan Perubahan Posko"}
  </Button>
  </div>
  </form>
  </CardContent>
  </Card>

  {/* Team Role Pass Delegation */}
  <Card>
  <CardHeader>
  <CardTitle>Bagikan Kartu Tugas Anggota Regu</CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  Tampilkan QR tugas berotentikasi Ed25519 agar tim dokter, logistik, dan relawan dapat langsung memindai dan mulai bertugas.
  </p>
  </CardHeader>
  <CardContent className="space-y-3">
  <div className="grid grid-cols-1 gap-2.5">
  {teamRoles.map((r) => (
  <div
  key={r.role}
  className="p-3.5 rounded-xl border border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
  >
  <div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
  <Icon name={r.icon} variant="bold" size={18} className="text-primary" />
  </div>
  <div>
  <h4 className="text-sm font-bold text-text-main">
  {r.title}
  </h4>
  <p className="text-xs text-text-muted">{r.desc}</p>
  </div>
  </div>

  <Button
  variant="secondary"
  size="sm"
  icon="qr-code"
  iconVariant="bold"
  onClick={() =>
  setSelectedTarget({
  name: `Petugas ${r.title}`,
  role: r.role,
  poskoId: currentPosko?.id || session.poskoId || "POSKO-01",
  poskoName: poskoName || currentPosko?.name || session.poskoName || "Posko Lapangan",
  missionId: session.missionId,
  missionName: session.missionName,
  })
  }
  className="w-full sm:w-auto"
  >
  Buka QR Kartu Tugas
  </Button>
  </div>
  ))}
  </div>
  </CardContent>
  </Card>

  {/* Role Pass Modal */}
  {selectedTarget && (
  <RolePassModal
  open={Boolean(selectedTarget)}
  onOpenChange={(open) => !open && setSelectedTarget(null)}
  role={selectedTarget.role}
  officerName={selectedTarget.name}
  poskoId={selectedTarget.poskoId}
  poskoName={selectedTarget.poskoName}
  missionId={selectedTarget.missionId}
  missionName={selectedTarget.missionName}
  orgId={session.orgId}
  />
  )}
  </div>
  );
}
