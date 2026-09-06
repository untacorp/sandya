"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asPoskoId } from "@/core/shared/branded-types";
import { FamilyReunionMatch } from "@/core/services/family-reunion.service";
import { FamilyReunionPassModal } from "@/features/refugees/components/family-reunion-pass-modal";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { Icon } from "@/shared/ui/icon";

export default function MissionReunionRadarPage() {
  const { session } = usePoskoStore();
  const [search, setSearch] = React.useState("");
  const [matches, setMatches] = React.useState<FamilyReunionMatch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedMatch, setSelectedMatch] = React.useState<FamilyReunionMatch | null>(null);
  const [passModalOpen, setPassModalOpen] = React.useState(false);

  const fetchMatches = React.useCallback(async () => {
  setIsLoading(true);
  try {
  const container = ServiceContainer.getInstance();
  const poskoId = asPoskoId(session.poskoId || "POS-01");
  const result = await container.familyReunionService.getPoskoReunionMatches(poskoId);
  if (result.ok) {
  setMatches(result.value);
  }
  } catch (err) {
  console.error("Failed to load cross posko matches:", err);
  } finally {
  setIsLoading(false);
  }
  }, [session.poskoId]);

  React.useEffect(() => {
  fetchMatches();
  }, [fetchMatches]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!search.trim()) {
  fetchMatches();
  return;
  }

  setIsLoading(true);
  try {
  const container = ServiceContainer.getInstance();
  const result = await container.familyReunionService.searchRelatives({
  targetName: search.trim(),
  currentPoskoId: session.poskoId,
  });
  if (result.ok) {
  setMatches(result.value);
  }
  } catch (err) {
  console.error("Failed to search cross posko relatives:", err);
  } finally {
  setIsLoading(false);
  }
  };

  const handleOpenPass = (match: FamilyReunionMatch) => {
  setSelectedMatch(match);
  setPassModalOpen(true);
  };

  const filteredMatches = matches.filter(
  (m) =>
  m.seekerName.toLowerCase().includes(search.toLowerCase()) ||
  m.targetName.toLowerCase().includes(search.toLowerCase()) ||
  (m.seekerPoskoName && m.seekerPoskoName.toLowerCase().includes(search.toLowerCase())) ||
  (m.targetPoskoName && m.targetPoskoName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
  <div className="space-y-4 sm:space-y-5">
  {/* Top Header without redundant back button */}
  <PageHeader
  title="Pencarian Keluarga Lintas Posko"
  description="Hasil rekonsiliasi graf keluarga antar-posko di seluruh wilayah misi bencana (Standar RFL ICRC)."
  />

  {/* Search Input */}
  <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg">
  <div className="flex-1">
  <Input placeholder="Cari nama warga, pengungsi, atau posko..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  icon="search"
  />
  </div>
  <Button
  type="submit"
  variant="primary"
  size="md"
  icon="search"
  iconVariant="bold"
  disabled={isLoading}
  >
  {isLoading ? "Mencari..." : "Cari"}
  </Button>
  {search && (
  <Button
  type="button"
  variant="outline"
  size="md"
  onClick={() => {
  setSearch("");
  fetchMatches();
  }}
  >
  Reset
  </Button>
  )}
  </form>

  {/* Matches Grid */}
  <div className="space-y-3">
  {isLoading ? (
  <p className="text-xs text-text-muted p-6 text-center">Memuat data temu keluarga lintas posko...</p>
  ) : filteredMatches.length === 0 ? (
  <Card className="p-8 text-center space-y-2 border-border bg-surface">
  <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-text-muted">
  <Icon name="users" variant="linear" size={24} />
  </div>
  <h4 className="text-sm font-bold text-text-main">
  Tidak Ada Pasangan Temu Keluarga Ditemukan
  </h4>
  <p className="text-xs text-text-muted max-w-md mx-auto">
  Sistem akan otomatis mencocokkan nama kerabat setiap kali data pengungsi baru disinkronkan antar-posko.
  </p>
  </Card>
  ) : (
  <div className="grid grid-cols-1 gap-3">
  {filteredMatches.map((m) => (
  <Card key={m.id} className="p-4 sm:p-5 shadow-2xs border border-border bg-surface">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="space-y-2 min-w-0 flex-1">
  <div className="flex items-center gap-2 flex-wrap">
  <Badge
  variant={m.status === "CONFIRMED" ? "safe" : "warning"}
  size="sm"
  >
  Kecocokan {m.confidence}%
  </Badge>
  <span className="text-xs text-text-muted font-medium">
  {m.status === "CONFIRMED" ? "Terverifikasi (Saling Mencari / Exact)" : "Potensial (Kemiripan Nama)"}
  </span>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
  <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-0.5">
  <span className="text-[10px] font-bold text-text-muted uppercase">
  Pencari:
  </span>
  <p className="font-bold text-sm text-text-main truncate">
  {m.seekerName}
  </p>
  <p className="text-text-muted truncate">
  {m.seekerPoskoName || `Posko ${m.seekerPoskoId}`} • {m.seekerShelter}
  </p>
  </div>

  <div className="p-3 rounded-lg bg-status-safe-bg/20 border border-status-safe-border space-y-0.5">
  <span className="text-[10px] font-bold text-status-safe uppercase">
  Ditemukan di:
  </span>
  <p className="font-bold text-sm text-text-main truncate">
  {m.targetName} ({m.targetAge} Thn, {m.targetGender === "M" ? "L" : "P"})
  </p>
  <p className="text-text-muted truncate">
  {m.targetPoskoName} • <strong>{m.targetShelter}</strong>
  </p>
  </div>
  </div>
  </div>

  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
  <Button
  variant="primary"
  size="sm"
  icon="printer"
  iconVariant="linear"
  onClick={() => handleOpenPass(m)}
  className="w-full sm:w-auto"
  >
  Surat Reuni
  </Button>
  </div>
  </div>
  </Card>
  ))}
  </div>
  )}
  </div>

  {/* Reunion Pass Modal */}
  <FamilyReunionPassModal
  open={passModalOpen}
  onOpenChange={setPassModalOpen}
  match={selectedMatch}
  />
  </div>
  );
}
