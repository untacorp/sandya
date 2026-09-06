"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useHierarchicalNav } from "../hooks/use-hierarchical-nav";
import { RoleActivationModal } from "@/features/auth/components/role-activation-modal";

interface HierarchySwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HierarchySwitcherModal({ open, onOpenChange }: HierarchySwitcherModalProps) {
  const router = useRouter();
  const [activationOpen, setActivationOpen] = React.useState(false);
  const { session, poskos, missions, setSessionPosko, setSessionMission } = usePoskoStore();
  const { getSwitchPoskoHref, activePoskoId, activeMissionId } = useHierarchicalNav();

  const handleSelectPosko = (id: string, name: string) => {
    setSessionPosko(id, name);
    onOpenChange(false);
    const targetHref = getSwitchPoskoHref(id);
    router.push(targetHref);
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

  const isLeader = session.userRole === "PEMIMPIN_ORGANISASI";
  const activeMission = missions.find((m) => m.id === (session.missionId || activeMissionId)) || missions[0];

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Pilih Posko & Tingkat Operasi"
        description="Beralih antar-posko lapangan, ruang komando misi bencana, atau markas lembaga."
        maxWidth="lg"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Current Level Status Banner */}
          <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                <Icon
                  name={activePoskoId ? "home" : activeMissionId ? "radar" : "buildings"}
                  variant="bold"
                  size={16}
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-subtle block">
                  Lokasi Operasi Anda Saat Ini
                </span>
                <p className="text-xs font-bold text-text-main truncate">
                  {poskos.find((p) => p.id === activePoskoId)?.name || "Markas Komando"}
                </p>
              </div>
            </div>
            <Badge variant="primary" size="sm" className="text-[10px] font-bold shrink-0">
              Tingkat 3 • Posko
            </Badge>
          </div>

          {/* Section 1: Switch Antar Posko Lapangan */}
          <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Icon name="home" variant="bold" size={14} className="text-primary" />
              1. Pilih Posko Lapangan Aktif
            </span>
            <span className="text-[11px] text-text-muted font-medium">
              {poskos.length} Titik Posko
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {poskos.map((pos) => {
              const isCurrent = pos.id === activePoskoId;
              const typeLabel =
                pos.postType === "FIELD_SHELTER"
                  ? "Tenda Pengungsian"
                  : pos.postType === "MEDICAL_POST"
                  ? "Posko Kesehatan"
                  : "Gudang Logistik";

              return (
                <button
                  type="button"
                  key={pos.id}
                  onClick={() => handleSelectPosko(pos.id, pos.name)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-surface border-border hover:border-border-hover hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-surface-muted text-text-muted"
                      }`}
                    >
                      <Icon
                        name="home"
                        variant={isCurrent ? "bold" : "linear"}
                        size={16}
                      />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-main truncate">
                          {pos.name}
                        </span>
                        {isCurrent && (
                          <Badge variant="safe" size="sm">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5 truncate">
                        {pos.currentRefugees} Warga • {typeLabel}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="arrow-right"
                    variant="linear"
                    size={14}
                    className="text-text-subtle shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Tingkat Komando Misi & Organisasi */}
        <div className="border-t border-border pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
            2. Tingkat Komando Operasi
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Tingkat 2: Misi Bencana */}
            {activeMission && (
              <button
                type="button"
                onClick={() => handleSelectMission(activeMission.id, activeMission.name)}
                className="p-3 rounded-xl border border-border bg-surface hover:border-primary transition-all cursor-pointer flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-status-danger/10 text-status-danger flex items-center justify-center shrink-0">
                    <Icon name="radar" variant="bold" size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-text-main truncate">
                        {activeMission.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate">
                      Tingkat Misi Bencana ({activeMission.location})
                    </p>
                  </div>
                </div>
                <Icon name="arrow-right" variant="linear" size={14} className="text-text-muted shrink-0" />
              </button>
            )}

            {/* Tingkat 1: Organisasi */}
            <button
              type="button"
              disabled={!isLeader}
              onClick={handleSelectOrg}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                isLeader
                  ? "border-border bg-surface hover:border-primary cursor-pointer"
                  : "border-border/50 bg-surface-muted/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="buildings" variant="bold" size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-text-main truncate">
                      {session.orgName || "Organisasi Induk"}
                    </span>
                    {!isLeader && (
                      <Badge variant="neutral" size="sm">
                        Khusus Pemimpin
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted truncate">
                    Tingkat Organisasi
                  </p>
                </div>
              </div>
              <Icon name="arrow-right" variant="linear" size={14} className="text-text-muted shrink-0" />
            </button>
          </div>
        </div>

        {/* Section 3: Autentikasi & Akun Petugas Resmi */}
        <div className="border-t border-border pt-3">
          <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Petugas Aktif
              </span>
              <p className="text-xs font-bold text-text-main truncate">
                {session.userName || "Petugas Lapangan"} • <span className="font-normal text-text-muted">{session.userRole.replace(/_/g, " ")}</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon="qr-code"
              onClick={() => {
                onOpenChange(false);
                setActivationOpen(true);
              }}
              className="text-xs shrink-0"
            >
              Pindai Kartu Tugas
            </Button>
          </div>
        </div>
      </div>
    </Dialog>

    <RoleActivationModal
      open={activationOpen}
      onOpenChange={setActivationOpen}
    />
    </>
  );
}
