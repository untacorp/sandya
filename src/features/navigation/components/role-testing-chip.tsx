"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ALL_USER_ROLES, type UserRole } from "@/core/shared/roles";
import { Dialog } from "@/shared/ui/dialog";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

interface RoleConfig {
  role: UserRole;
  title: string;
  tier: string;
  desc: string;
  icon: SolarIconName;
  badgeVariant: "primary" | "safe" | "warning" | "danger" | "neutral" | "triage-red" | "triage-yellow" | "triage-green";
  capabilities: string[];
}

const ROLES_CONFIG: RoleConfig[] = [
  {
    role: "PEMIMPIN_ORGANISASI",
    title: "Pemimpin Organisasi",
    tier: "Tingkat 1 • Lembaga Induk",
    desc: "Pemegang Master Key Ed25519, konfigurasi Cloud AI, dan audit makro seluruh misi.",
    icon: "buildings",
    badgeVariant: "primary",
    capabilities: ["Konsol Lembaga (/org)", "Kunci Master Ed25519", "Audit Seluruh Misi", "Audit Posko Lapangan"],
  },
  {
    role: "KOMANDAN_MISI",
    title: "Komandan Misi Bencana",
    tier: "Tingkat 2 • Area Operasi Misi",
    desc: "Incident Commander: dirikan posko-posko lapangan, angkat koordinator posko, & kelola gudang sentral misi.",
    icon: "radar",
    badgeVariant: "safe",
    capabilities: ["Buka Posko Baru", "Gudang Sentral Misi", "Surat Jalan Truk Makro", "Radar Situasi Bencana"],
  },
  {
    role: "KOORDINATOR_POSKO",
    title: "Koordinator Posko Lapangan",
    tier: "Tingkat 3 • Otoritas Tenda",
    desc: "Penanggung jawab satu posko fisik: delegasikan kartu tugas staf, minta suplai, & koordinasi tenda.",
    icon: "home",
    badgeVariant: "primary",
    capabilities: ["Delegasi Kartu Tugas Staf", "Pengaturan Tenda Posko", "Pendaftaran Warga", "Intercom Taktis & SOS"],
  },
  {
    role: "PETUGAS_MEDIS",
    title: "Petugas Medis (Dokter / Perawat)",
    tier: "Tingkat 3 • Otoritas Klinis",
    desc: "Otoritas klinis eksklusif: pemeriksaan tanda vital, Kanban Triase START 4-warna, resep obat, & vonis wafat.",
    icon: "health",
    badgeVariant: "danger",
    capabilities: ["Pemeriksaan Tanda Vital", "Triase START 4-Warna", "Resep Farmasi Darurat", "Vonis Triase Hitam (Wafat)"],
  },
  {
    role: "PETUGAS_LOGISTIK",
    title: "Petugas Logistik & Gudang",
    tier: "Tingkat 3 • Single-Writer Ledger",
    desc: "Otoritas fisik gudang eksklusif: catat barang masuk (restock), catat rusak/opname, & potong kuota stok.",
    icon: "box",
    badgeVariant: "warning",
    capabilities: ["Single-Writer Mutasi Stok", "Catat Restock / Masuk", "Lapor Barang Rusak", "Setujui Alokasi Bantuan"],
  },
  {
    role: "RELAWAN_LAPANGAN",
    title: "Relawan Lapangan (Frontliner)",
    tier: "Tingkat 3 • Pendataan & Bantuan",
    desc: "Garda depan posko: Fast Intake 30 detik, pendaftaran rombongan bertenaga AI OCR, & kurir antar bantuan ke tenda.",
    icon: "users",
    badgeVariant: "neutral",
    capabilities: ["Fast Intake Warga 30s", "Bulk Intake AI OCR", "Ajukan Kebutuhan Warga", "Kurir Antar Paket Bantuan"],
  },
  {
    role: "WARGA_TAMU",
    title: "Warga / Tamu Publik",
    tier: "Publik • Non-Staff Mode",
    desc: "Akses warga umum tanpa login staf: pencarian keluarga terpisah (Family Reunion) & pindaian poster posko.",
    icon: "user",
    badgeVariant: "neutral",
    capabilities: ["Pencarian Temu Keluarga", "Pindai Poster Paritas QR", "Lihat Direktori Posko (Read-Only)"],
  },
];

export interface RoleTestingChipProps {
  className?: string;
  compact?: boolean;
}

export function RoleTestingChip({ className, compact = false }: RoleTestingChipProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const { session, setSessionRole } = usePoskoStore();

  const activeConfig =
    ROLES_CONFIG.find((c) => c.role === session.userRole) || ROLES_CONFIG[0];

  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === session.userRole) {
      setModalOpen(false);
      return;
    }

    setSessionRole(newRole);
    setModalOpen(false);

    const cfg = ROLES_CONFIG.find((c) => c.role === newRole);
    setToastMessage(`Beralih ke peran: ${cfg?.title || newRole}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <>
      {/* Interactive Chip in Header */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-left group shrink-0 select-none cursor-pointer border",
          session.userRole === "PETUGAS_MEDIS"
            ? "bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
            : session.userRole === "PETUGAS_LOGISTIK"
            ? "bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
            : session.userRole === "PEMIMPIN_ORGANISASI"
            ? "bg-primary/10 hover:bg-primary/15 text-primary border-primary/30"
            : session.userRole === "KOMANDAN_MISI"
            ? "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            : session.userRole === "WARGA_TAMU"
            ? "bg-surface-muted hover:bg-surface-subtle text-text-muted border-border"
            : "bg-surface-subtle hover:bg-surface-muted text-text-main border-border hover:border-primary/40",
          className
        )}
        title="Uji Coba Hak Akses: Klik untuk beralih peran operasional"
      >
        <Icon
          name={activeConfig.icon}
          variant="bold"
          size={14}
          className="shrink-0"
        />

        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[11px] font-bold truncate max-w-[90px] sm:max-w-[130px]">
            {activeConfig.title.split(" (")[0]}
          </span>
          <span className="text-[10px] opacity-70 font-mono">⇄</span>
        </div>
      </button>

      {/* Floating Toast Notification upon Switch */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-text-main text-canvas shadow-xl text-xs font-bold">
            <Icon name="check" variant="bold" size={14} className="text-status-safe shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Role Testing Switcher Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Uji Coba Hak Akses & Peran (Role Testing)"
        description="Pilih salah satu dari 7 peran canonical di bawah ini untuk menguji batasan hak akses (RBAC) dan wewenang lapangan secara instan."
        maxWidth="lg"
      >
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {ROLES_CONFIG.map((cfg) => {
              const isCurrent = cfg.role === session.userRole;
              return (
                <button
                  key={cfg.role}
                  type="button"
                  onClick={() => handleSelectRole(cfg.role)}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative group",
                    isCurrent
                      ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs"
                      : "bg-surface hover:bg-surface-subtle border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-muted text-text-muted group-hover:text-primary"
                        )}
                      >
                        <Icon name={cfg.icon} variant="bold" size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-main leading-tight">
                          {cfg.title}
                        </h4>
                        <p className="text-[10px] text-text-muted font-medium">
                          {cfg.tier}
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground shrink-0">
                        <Icon name="check" variant="bold" size={10} />
                        Aktif
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5 leading-relaxed">
                    {cfg.desc}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/60">
                    {cfg.capabilities.slice(0, 3).map((cap, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface-muted text-text-muted"
                      >
                        • {cap}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border flex items-center justify-between text-[11px] text-text-muted">
            <span>
              💡 <strong>Tips RBAC:</strong> Perubahan peran langsung mengaktifkan/menonaktifkan tombol dan menampilkan banner penegakan wewenang di layar posko.
            </span>
          </div>
        </div>
      </Dialog>
    </>
  );
}
