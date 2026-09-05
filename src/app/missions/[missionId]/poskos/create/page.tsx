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
import { type PostType } from "@/shared/types";

export default function CreatePoskoPage() {
  const router = useRouter();
  const { session, addPosko } = usePoskoStore();

  const [name, setName] = React.useState("Posko Lapangan RW 05 Kp. Nagrak");
  const [postType, setPostType] = React.useState<PostType>("FIELD_SHELTER");
  const [capacity, setCapacity] = React.useState(450);
  const [locationName, setLocationName] = React.useState("Lapangan Voli Kp. Nagrak RT 02/RW 05");
  const [coordLat, setCoordLat] = React.useState("-6.8290");
  const [coordLng, setCoordLng] = React.useState("107.1420");
  const [coordinatorName, setCoordinatorName] = React.useState("Rahmat Hidayat");

  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [createdPoskoId, setCreatedPoskoId] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;

  const newP = addPosko({
  orgId: session.orgId,
  missionId: session.missionId,
  name: name.trim(),
  postType,
  status: "OPERATIONAL_NORMAL",
  capacity: Number(capacity),
  locationName: locationName.trim(),
  locationLat: Number(coordLat),
  locationLng: Number(coordLng),
  });

  setCreatedPoskoId(newP.id);
  setQrModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
  setQrModalOpen(open);
  if (!open && createdPoskoId) {
  router.push(`/posko/${createdPoskoId}`);
  }
  };

  return (
  <div className="space-y-5 max-w-xl mx-auto">
  {/* Page Header without redundant back button */}
  <PageHeader
  title="Buka Posko Lapangan Baru"
  />

  <Card>
  <CardContent className="p-4 sm:p-6">
  <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Posko Lapangan
  </label>
  <Input
  placeholder="Contoh: Posko Lapangan RW 05 Kp. Nagrak"
  value={name}
  onChange={(e) => setName(e.target.value)}
  icon="home"
  required
  />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Jenis Fasilitas Posko
  </label>
  <select
  value={postType}
  onChange={(e) => setPostType(e.target.value as PostType)}
  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary"
  >
  <option value="FIELD_SHELTER">Posko Tenda Pengungsi</option>
  <option value="MEDICAL_POST">Pos Medis / RS Lapangan</option>
  <option value="MAIN_WAREHOUSE">Gudang Logistik Satelit</option>
  </select>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Kapasitas Tampung (Jiwa)
  </label>
  <Input
  type="number"
  value={capacity}
  onChange={(e) => setCapacity(Number(e.target.value))}
  min={10}
  required
  />
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Alamat / Lokasi Posko
  </label>
  <Input
  placeholder="Contoh: Lapangan Voli Kp. Nagrak RT 02"
  value={locationName}
  onChange={(e) => setLocationName(e.target.value)}
  icon="pin"
  required
  />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Latitude (Lintang)
  </label>
  <Input
  value={coordLat}
  onChange={(e) => setCoordLat(e.target.value)}
  placeholder="-6.8290"
  />
  </div>
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Longitude (Bujur)
  </label>
  <Input
  value={coordLng}
  onChange={(e) => setCoordLng(e.target.value)}
  placeholder="107.1420"
  />
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Koordinator Posko yang Ditunjuk
  </label>
  <Input
  placeholder="Nama koordinator posko"
  value={coordinatorName}
  onChange={(e) => setCoordinatorName(e.target.value)}
  icon="user"
  required
  />
  </div>

  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
  <Link href={`/missions/${session.missionId}/poskos`} className="w-full sm:w-auto">
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
  Buka Posko & Buat QR Akses
  </Button>
  </div>
  </form>
  </CardContent>
  </Card>

  {/* Real Ed25519 Cryptographic Posko Lead Role Pass Modal */}
  {createdPoskoId && (
  <RolePassModal
  open={qrModalOpen}
  onOpenChange={handleModalClose}
  role="KOORDINATOR_POSKO"
  officerName={coordinatorName}
  poskoId={createdPoskoId}
  poskoName={name}
  missionId={session.missionId}
  missionName={session.missionName}
  orgId={session.orgId}
  />
  )}
  </div>
  );
}
