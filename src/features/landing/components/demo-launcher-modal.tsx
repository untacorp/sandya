"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type UserRole } from "@/shared/types";

interface DemoRoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: SolarIconName;
  targetUrl: string;
  description: string;
}

const DEMO_ROLES: DemoRoleOption[] = [
  {
    role: "PETUGAS_MEDIS",
    title: "Dokter / Petugas Medis",
    subtitle: "Papan Triase & Rekam Medis",
    icon: "health",
    targetUrl: "/posko/POS-01/refugees/triage",
    description: "Periksa korban gempa dengan metode START 4 warna, catat tensi & nadi, dan buat resep obat darurat.",
  },
  {
    role: "PETUGAS_LOGISTIK",
    title: "Petugas Logistik Gudang",
    subtitle: "Satu Pemegang Buku (Single-Writer)",
    icon: "box",
    targetUrl: "/posko/POS-01/logistics",
    description: "Kelola stok beras, tenda, obat, atur surat jalan antar-posko, dan cegah bantuan ganda.",
  },
  {
    role: "RELAWAN_LAPANGAN",
    title: "Relawan Lapangan",
    subtitle: "Pendataan Kilat Pengungsi (<30 Detik)",
    icon: "users",
    targetUrl: "/posko/POS-01/refugees",
    description: "Daftarkan warga pengungsi dan anggota keluarga, tandai bayi/lansia, dan buat barcode NIK.",
  },
  {
    role: "WARGA_TAMU",
    title: "Mode Warga / Publik",
    subtitle: "Pencarian Kerabat Terpisah",
    icon: "search",
    targetUrl: "/guest",
    description: "Cari anggota keluarga di seluruh tenda pengungsian secara mandiri tanpa perlu izin masuk.",
  },
];

interface DemoLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoLauncherModal({ isOpen, onClose }: DemoLauncherModalProps) {
  const router = useRouter();
  const store = usePoskoStore();

  if (!isOpen) return null;

  const handleLaunchDemo = (roleOpt: DemoRoleOption) => {
    // 1. Inisiasi data posko demo di local store jika belum ada
    const existingOrg = store.organizations.find((o) => o.id === "ORG-01");
    if (!existingOrg) {
      store.addOrganization({
        name: "Palang Merah Indonesia — Satgas Bencana",
        category: "PMI_LEMBAGA",
        masterPubkey: "sig_ed25519_pmi_master_key_simulation_001",
      });
    }

    const existingMission = store.missions.find((m) => m.id === "MSN-01");
    if (!existingMission) {
      store.addMission({
        orgId: "ORG-01",
        name: "Operasi Darurat Gempa Bumi Sektor Cianjur",
        disasterType: "GEMPA_BUMI",
        status: "ACTIVE_EMERGENCY",
        targetDays: 30,
        location: "Kecamatan Cugenang, Cianjur, Jawa Barat",
      });
    }

    const existingPosko = store.poskos.find((p) => p.id === "POS-01");
    if (!existingPosko) {
      store.addPosko({
        orgId: "ORG-01",
        missionId: "MSN-01",
        name: "Posko Mandiri Balai Desa Nagrak",
        postType: "FIELD_SHELTER",
        status: "OPERATIONAL_NORMAL",
        capacity: 450,
        locationName: "Nagrak, Cugenang, Cianjur",
      });
    }

    // 2. Set sesi aktif sesuai peran yang dipilih
    store.setFullSession({
      userRole: roleOpt.role,
      userId: `usr_demo_${roleOpt.role.toLowerCase()}`,
      userName:
        roleOpt.role === "PETUGAS_MEDIS"
          ? "dr. Siti Rahmawati (Demo)"
          : roleOpt.role === "PETUGAS_LOGISTIK"
          ? "Hendra Setiawan (Demo)"
          : roleOpt.role === "RELAWAN_LAPANGAN"
          ? "Bayu Pratama (Demo)"
          : "Warga Tamu (Demo)",
      orgId: "ORG-01",
      orgName: "Palang Merah Indonesia — Satgas Bencana",
      missionId: "MSN-01",
      missionName: "Operasi Darurat Gempa Bumi Sektor Cianjur",
      poskoId: "POS-01",
      poskoName: "Posko Mandiri Balai Desa Nagrak",
    });

    onClose();
    router.push(roleOpt.targetUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-surface border-[1.5px] border-border rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle flex items-center justify-between">
          <div>
            <h3 className="font-bold text-text-main text-base sm:text-lg">
              Pilih Peran untuk Mencoba Demo Web
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Jelajahi antarmuka operasional nyata langsung di peramban tanpa perlu memindai kartu fisik
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-muted transition-colors"
          >
            <Icon name="close" variant="linear" size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3 max-h-[75vh] overflow-y-auto">
          {DEMO_ROLES.map((roleOpt) => (
            <button
              key={roleOpt.role}
              type="button"
              onClick={() => handleLaunchDemo(roleOpt)}
              className="w-full text-left p-4 rounded-xl border-[1.5px] border-border bg-surface hover:border-primary hover:bg-surface-subtle transition-all cursor-pointer group flex items-start gap-3.5 active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-muted text-text-main group-hover:bg-primary group-hover:text-primary-foreground border border-border flex items-center justify-center shrink-0 transition-colors">
                <Icon name={roleOpt.icon} variant="bold" size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-text-main text-sm group-hover:text-primary transition-colors">
                    {roleOpt.title}
                  </h4>
                  <span className="text-xs font-mono text-text-muted group-hover:text-text-main">
                    Masuk &rarr;
                  </span>
                </div>
                <div className="text-xs font-semibold text-text-muted mt-0.5">
                  {roleOpt.subtitle}
                </div>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {roleOpt.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-muted">
          <span>
            Data demo disimpan di browser Anda (Local Storage) dan dapat direset kapan saja.
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs self-end sm:self-auto">
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
