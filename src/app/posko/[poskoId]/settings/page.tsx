"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";

export default function PoskoSettingsPage() {
  const { session, poskos } = usePoskoStore();
  const [shareModal, setShareModal] = React.useState<string | null>(null);

  const currentPosko = poskos.find((p) => p.id === session.poskoId);

  const teamRoles = [
    {
      role: "PETUGAS_MEDIS",
      title: "Tim Medis / Dokter",
      desc: "Akses Triase Medis & Resep Obat",
      icon: "health",
    },
    {
      role: "PETUGAS_LOGISTIK",
      title: "Petugas Logistik",
      desc: "Akses mutasi stok gudang & distribusi",
      icon: "box",
    },
    {
      role: "RELAWAN_LAPANGAN",
      title: "Relawan Lapangan",
      desc: "Akses pendaftaran cepat warga & serah terima",
      icon: "users",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-text-main tracking-tight">
          Pengaturan Posko
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Informasi posko, koneksi misi bencana, dan delegasi kartu tugas regu.
        </p>
      </div>

      {/* Posko Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profil & Status Posko</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nama Posko"
              value={session.poskoName}
              disabled
              icon="home"
            />
            <Input
              label="Lokasi / Titik Kumpul"
              value={currentPosko?.locationName || "Wilayah Posko"}
              disabled
              icon="pin"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Operasi Misi"
              value={session.missionName}
              disabled
              icon="buildings"
            />
            <Input
              label="Lembaga Induk"
              value={session.orgName}
              disabled
              icon="shield"
            />
            <Input
              label="Koordinator Saat Ini"
              value={`${session.userName} (${session.userRole})`}
              disabled
              icon="user"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <Link href={`/missions/${session.missionId}`}>
              <Button variant="outline" size="sm" iconRight="arrow-right">
                Buka Halaman Misi Bencana
              </Button>
            </Link>
            <Link href={`/missions/${session.missionId}/poskos`}>
              <Button variant="outline" size="sm" icon="sync">
                Ganti / Beralih Posko Lapangan
              </Button>
            </Link>
            <Link href="/org">
              <Button variant="ghost" size="sm" iconRight="arrow-right">
                Console Lembaga Induk
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Team Role Pass Delegation */}
      <Card>
        <CardHeader>
          <CardTitle>Bagikan Kartu Tugas Anggota Regu</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Tampilkan QR tugas agar tim dokter, logistik, dan relawan dapat langsung memindai dan mulai bertugas.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {teamRoles.map((r) => (
              <div
                key={r.role}
                className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                    <Icon name={r.icon as any} variant="bold" size={18} className="text-primary" />
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
                  onClick={() => setShareModal(r.title)}
                >
                  Tampilkan QR
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share QR Modal */}
      <Dialog
        open={Boolean(shareModal)}
        onOpenChange={(open) => !open && setShareModal(null)}
        title={shareModal || ""}
        description="Arahkan kamera HP personel ke QR ini untuk mengaktifkan peran penugasan."
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-52 h-52 mx-auto p-5 rounded-2xl bg-surface border-[2px] border-primary flex flex-col items-center justify-center space-y-2 shadow-xs">
            <Icon name="qr-code" variant="bold" size={130} className="text-primary" />
            <span className="text-[10px] font-mono text-text-muted">
              PASS-{session.poskoId}
            </span>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setShareModal(null)}
          >
            Tutup
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
