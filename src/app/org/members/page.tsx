"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { RolePassModal } from "@/features/auth/components/role-pass-modal";
import { StaffRole } from "@/core/shared/roles";

interface OfficerPassTarget {
  name: string;
  role: StaffRole;
  poskoId: string;
  poskoName: string;
  missionId: string;
  missionName: string;
}

export default function OrgMembersPage() {
  const { session, missions, poskos } = usePoskoStore();
  const [selectedTarget, setSelectedTarget] = React.useState<OfficerPassTarget | null>(null);

  const leaders = [
  {
  id: "PIM-01",
  name: session.userName || "Pimpinan Lembaga",
  role: "Ketua Pengurus & Komandan Tertinggi",
  scope: session.orgName || "Seluruh Wilayah Lembaga",
  status: "ACTIVE",
  },
  ];

  const coordinators = missions.map((m, idx) => ({
  id: `KOR-0${idx + 1}`,
  name: `Koordinator Operasi ${m.name}`,
  role: "Koordinator Lapangan Wilayah",
  missionId: m.id,
  missionName: m.name,
  status: m.status === "ACTIVE_EMERGENCY" ? "ON_DUTY" : "STANDBY",
  }));

  const standardFieldRoles: { title: string; role: StaffRole; icon: SolarIconName; desc: string }[] = [
  {
  title: "Petugas Medis Lapangan",
  role: "PETUGAS_MEDIS",
  icon: "health",
  desc: "Wewenang skrining Triase START & pemberian resep obat darurat.",
  },
  {
  title: "Petugas Logistik & Gudang",
  role: "PETUGAS_LOGISTIK",
  icon: "box",
  desc: "Otoritas tunggal (Single-Writer) mutasi dan potong stok fisik barang.",
  },
  {
  title: "Relawan Lapangan",
  role: "RELAWAN_LAPANGAN",
  icon: "users",
  desc: "Pendataan Fast Intake warga 30s dan kurir data Universal Data Mule.",
  },
  {
  title: "Koordinator Posko Tenda",
  role: "KOORDINATOR_POSKO",
  icon: "home",
  desc: "Pimpinan posko lapangan, cetak poster paritas, dan otoritas SOS.",
  },
  ];

  const currentPosko = poskos.find((p) => p.id === session.poskoId) || null;
  const currentMission = missions.find((m) => m.id === session.missionId) || null;

  return (
  <div className="space-y-6">
  <div>
  <h2 className="text-xl font-bold text-text-main">
  Pengurus & Kartu Penugasan Tim
  </h2>
  <p className="text-xs text-text-muted mt-0.5">
  Kelola penanggung jawab operasi dan cetak Kartu Tugas QR resmi bertanda tangan digital.
  </p>
  </div>

  {/* HQ Leaders */}
  <Card>
  <CardHeader>
  <CardTitle>Pengurus Induk Lembaga</CardTitle>
  </CardHeader>
  <CardContent>
  <div className="divide-y divide-border">
  {leaders.map((ldr) => (
  <div
  key={ldr.id}
  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
  >
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
  <Icon name="shield" variant="bold" size={16} />
  </div>
  <div>
  <div className="flex items-center gap-2 mb-0.5">
  <Badge variant="primary" size="sm">
  Pengurus Utama
  </Badge>
  </div>
  <h4 className="text-sm font-bold text-text-main">
  {ldr.name}
  </h4>
  <p className="text-xs text-text-muted">
  {ldr.role} • {ldr.scope}
  </p>
  </div>
  </div>
  </div>
  ))}
  </div>
  </CardContent>
  </Card>

  {/* Field Staff Role Pass Generator Cards */}
  <Card>
  <CardHeader>
  <CardTitle>Cetak Kartu Tugas Regu Posko Lapangan</CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  Pilih jenis peran penugasan untuk menghasilkan QR Kartu Tugas resmi bagi relawan/petugas posko.
  </p>
  </CardHeader>
  <CardContent>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {standardFieldRoles.map((item) => (
  <div
  key={item.role}
  className="p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-all flex flex-col justify-between gap-3 shadow-2xs"
  >
  <div className="space-y-1">
  <div className="flex items-center gap-2">
  <div className="w-7 h-7 rounded-md bg-surface-muted text-primary flex items-center justify-center">
  <Icon name={item.icon} variant="bold" size={16} />
  </div>
  <h4 className="text-sm font-bold text-text-main">{item.title}</h4>
  </div>
  <p className="text-xs text-text-muted">{item.desc}</p>
  </div>

  <Button
  variant="secondary"
  size="sm"
  icon="qr-code"
  iconVariant="bold"
  className="w-full justify-center"
  onClick={() =>
  setSelectedTarget({
  name: `Personel ${item.title}`,
  role: item.role,
  poskoId: currentPosko?.id || session.poskoId || "HQ-POSKO",
  poskoName: currentPosko?.name || session.poskoName || "Posko Utama",
  missionId: currentMission?.id || session.missionId || "HQ-MISSION",
  missionName: currentMission?.name || session.missionName || "Misi Operasi",
  })
  }
  >
  Buka QR Kartu Tugas
  </Button>
  </div>
  ))}
  </div>
  </CardContent>
  </Card>

  {/* Mission Coordinators */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <div>
  <CardTitle>Koordinator Wilayah Bencana</CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  Penanggung jawab yang ditugaskan memimpin posko-posko di lapangan.
  </p>
  </div>
  </div>
  </CardHeader>
  <CardContent>
  <div className="divide-y divide-border">
  {coordinators.map((cmd) => (
  <div
  key={cmd.id}
  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
  >
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center font-bold text-xs shrink-0">
  <Icon name="user" variant="bold" size={16} />
  </div>
  <div>
  <div className="flex items-center gap-2 mb-0.5">
  <Badge
  variant={cmd.status === "ON_DUTY" ? "danger" : "neutral"}
  size="sm"
  >
  {cmd.status === "ON_DUTY" ? "Bertugas" : "Siaga"}
  </Badge>
  </div>
  <h4 className="text-sm font-bold text-text-main">
  {cmd.name}
  </h4>
  <p className="text-xs text-text-muted mt-0.5">
  Wilayah: <strong>{cmd.missionName}</strong>
  </p>
  </div>
  </div>

  <div className="flex items-center gap-2">
  <Button
  variant="secondary"
  size="sm"
  icon="qr-code"
  iconVariant="bold"
  onClick={() =>
  setSelectedTarget({
  name: cmd.name,
  role: "KOMANDAN_MISI",
  poskoId: currentPosko?.id || session.poskoId || "HQ-POSKO",
  poskoName: currentPosko?.name || session.poskoName || "Posko Utama",
  missionId: cmd.missionId,
  missionName: cmd.missionName,
  })
  }
  >
  Buka QR Akses Misi
  </Button>
  </div>
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
