"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";
import { RolePassModal } from "@/features/auth/components/role-pass-modal";
import { PageHeader } from "@/shared/ui/page-header";
import { type DisasterMission } from "@/shared/types";

export default function CreateMissionPage() {
  const router = useRouter();
  const { session, addMission } = usePoskoStore();

  const [name, setName] = React.useState("");
  const [disasterType, setDisasterType] = React.useState<DisasterMission["disasterType"]>("GEMPA_BUMI");
  const [location, setLocation] = React.useState("");
  const [targetDays, setTargetDays] = React.useState(14);
  const [commanderName, setCommanderName] = React.useState(session.userName || "");

  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [createdMissionId, setCreatedMissionId] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;

  const newMsn = addMission({
  orgId: session.orgId,
  name: name.trim(),
  disasterType,
  status: "ACTIVE_EMERGENCY",
  targetDays: Number(targetDays),
  location: location.trim(),
  });

  setCreatedMissionId(newMsn.id);
  setQrModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
  setQrModalOpen(open);
  if (!open && createdMissionId) {
  router.push(`/missions/${createdMissionId}`);
  }
  };

  return (
  <div className="space-y-5 max-w-xl mx-auto">
  <PageHeader
  title="Buka Operasi Bencana Baru"
  description="Buka wilayah operasi tanggap darurat baru dan tugaskan koordinator lapangan."
  />

  <Card>
  <CardContent className="p-4 sm:p-6">
  <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Operasi Bencana
  </label>
  <Input placeholder="Contoh: Tanggap Gempa Cugenang 2026"
  value={name}
  onChange={(e) => setName(e.target.value)}
  icon="shield"
  required
  />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Estimasi Masa Tanggap (Hari)
  </label>
  <Input type="number"
  value={targetDays}
  onChange={(e) => setTargetDays(Number(e.target.value))}
  min={1}
  required
  />
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Wilayah / Lokasi Terdampak
  </label>
  <Input placeholder="Contoh: Kecamatan Cugenang & Pacet"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  icon="pin"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Koordinator Wilayah yang Ditugaskan
  </label>
  <Input placeholder="Nama koordinator lapangan"
  value={commanderName}
  onChange={(e) => setCommanderName(e.target.value)}
  icon="user"
  required
  />
  </div>

  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
  <Link href="/org" className="w-full sm:w-auto">
  <Button type="button" variant="outline" className="w-full sm:w-auto">
  Batal
  </Button>
  </Link>
  <Button
  type="submit"
  variant="primary"
  icon="shield"
  iconVariant="bold"
  className="w-full sm:w-auto"
  >
  Terbitkan Operasi Bencana
  </Button>
  </div>
  </form>
  </CardContent>
  </Card>

  {/* Real Ed25519 Cryptographic Role Pass Modal */}
  {createdMissionId && (
  <RolePassModal
  open={qrModalOpen}
  onOpenChange={handleModalClose}
  role="KOMANDAN_MISI"
  officerName={commanderName}
  poskoId=""
  poskoName="Markas Wilayah Operasi"
  missionId={createdMissionId}
  missionName={name}
  orgId={session.orgId}
  />
  )}
  </div>
  );
}
