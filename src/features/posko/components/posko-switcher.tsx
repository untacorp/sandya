"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type UserRole } from "@/shared/types";

interface PoskoSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES: { id: UserRole; label: string; desc: string; icon: any; level: string }[] = [
  {
    id: "PEMIMPIN_ORGANISASI",
    label: "Pengurus Induk Lembaga",
    desc: "Kelola lembaga, buka operasi wilayah baru, dan kelola akun koordinator",
    icon: "buildings",
    level: "Lembaga",
  },
  {
    id: "KOMANDAN_MISI",
    label: "Koordinator Wilayah",
    desc: "Pantau seluruh wilayah operasi, buka posko baru, dan kendali gudang wilayah",
    icon: "radar",
    level: "Wilayah",
  },
  {
    id: "KOORDINATOR_POSKO",
    label: "Koordinator Posko",
    desc: "Penanggung jawab operasional di lokasi posko tenda dan pembagian tugas regu",
    icon: "shield",
    level: "Posko",
  },
  {
    id: "PETUGAS_MEDIS",
    label: "Petugas Medis / Dokter",
    desc: "Pemeriksaan kesehatan, skrining triase kegawatdaruratan, dan pemberian obat",
    icon: "health",
    level: "Posko",
  },
  {
    id: "PETUGAS_LOGISTIK",
    label: "Petugas Logistik Gudang",
    desc: "Pencatatan stok masuk-keluar bantuan dan persetujuan distribusi barang",
    icon: "box",
    level: "Posko",
  },
  {
    id: "RELAWAN_LAPANGAN",
    label: "Relawan Lapangan",
    desc: "Pendaftaran cepat warga pengungsi dan serah terima bantuan langsung ke tenda",
    icon: "users",
    level: "Posko",
  },
  {
    id: "WARGA_TAMU",
    label: "Warga / Publik",
    desc: "Pencarian anggota keluarga yang terpisah tanpa perlu akun petugas",
    icon: "search",
    level: "Publik",
  },
];

export function PoskoSwitcher({ open, onOpenChange }: PoskoSwitcherProps) {
  const router = useRouter();
  const { session, poskos, missions, setSessionPosko, setSessionMission, setSessionRole } = usePoskoStore();

  const handleSelectPosko = (id: string, name: string) => {
    setSessionPosko(id, name);
    onOpenChange(false);
    router.push(`/posko/${id}`);
  };

  const handleSelectMission = (id: string, name: string) => {
    setSessionMission(id, name);
    onOpenChange(false);
    router.push(`/missions/${id}`);
  };

  const handleSelectOrg = () => {
    onOpenChange(false);
    router.push("/org");
  };

  const handleSelectRole = (role: UserRole) => {
    setSessionRole(role);
    onOpenChange(false);
    if (role === "PEMIMPIN_ORGANISASI") {
      router.push("/org");
    } else if (role === "KOMANDAN_MISI") {
      router.push(`/missions/${session.missionId}`);
    } else if (role === "WARGA_TAMU") {
      router.push("/guest");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ganti Posko & Simulasi Peran Petugas"
      description="Pilih lokasi kerja atau ganti peran untuk menguji alur tugas petugas."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Section 1: Level Hierarki Akses */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
            1. Tingkat Komando
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Level 1: Markas Organisasi */}
            <div
              onClick={handleSelectOrg}
              className="p-3 rounded-xl border border-border bg-surface hover:border-primary transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  <Icon name="buildings" variant="bold" size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary block">
                    Markas Induk Lembaga
                  </span>
                  <p className="text-xs text-text-muted">
                    {session.orgName}
                  </p>
                </div>
              </div>
              <Icon name="arrow-right" variant="linear" size={14} className="text-text-muted" />
            </div>

            {/* Level 2: Command Center Misi */}
            <div
              onClick={() => handleSelectMission(session.missionId, session.missionName)}
              className="p-3 rounded-xl border border-border bg-surface hover:border-status-danger transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-status-danger text-text-inverse flex items-center justify-center font-bold text-xs shrink-0">
                  <Icon name="radar" variant="bold" size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-status-danger block">
                    Markas Wilayah Operasi
                  </span>
                  <p className="text-xs text-text-muted truncate">
                    {session.missionName}
                  </p>
                </div>
              </div>
              <Icon name="arrow-right" variant="linear" size={14} className="text-text-muted" />
            </div>
          </div>
        </div>

        {/* Section 2: Posko Lapangan */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
            2. Titik Posko Lapangan Aktif
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {poskos.map((pos) => {
              const isCurrent = pos.id === session.poskoId;
              return (
                <div
                  key={pos.id}
                  onClick={() => handleSelectPosko(pos.id, pos.name)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-surface-subtle border-primary shadow-2xs"
                      : "bg-surface border-border hover:border-border-hover hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-muted text-text-muted"
                      }`}
                    >
                      <Icon
                        name="home"
                        variant={isCurrent ? "bold" : "linear"}
                        size={14}
                      />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-main truncate">
                          {pos.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-primary">
                            (Aktif)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">
                        {pos.currentRefugees} Jiwa • {pos.postType === "FIELD_SHELTER" ? "Tenda" : pos.postType === "MEDICAL_POST" ? "Medis" : "Gudang"}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="arrow-right"
                    variant="linear"
                    size={14}
                    className="text-text-subtle shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Ganti Hak Akses / Peran Personel */}
        <div className="border-t border-border pt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
            3. Simulasi Peran Petugas (RBAC)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLES.map((r) => {
              const isCurrent = r.id === session.userRole;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRole(r.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-surface-subtle border-primary shadow-2xs"
                      : "bg-surface border-border hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={r.icon}
                        variant={isCurrent ? "bold" : "linear"}
                        size={15}
                        className={isCurrent ? "text-primary" : "text-text-muted"}
                      />
                      <span className="text-xs font-bold text-text-main">
                        {r.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-text-subtle">
                      {r.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export const PoskoSwitcherModal = PoskoSwitcher;
