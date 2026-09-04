"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { PoskoCard } from "@/shared/ui/posko-card";

export default function MissionPoskosDirectoryPage() {
  const { session, poskos, updatePoskoStatus } = usePoskoStore();
  const [search, setSearch] = React.useState("");

  const missionPoskos = poskos.filter((p) => p.missionId === session.missionId);

  const filtered = missionPoskos.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.locationName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header without redundant back button */}
      <PageHeader
        title="Daftar Posko Lapangan"
      >
        <Link href={`/missions/${session.missionId}/poskos/create`} className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            icon="add-circle"
            iconVariant="bold"
            className="w-full sm:w-auto"
          >
            + Buka Posko Baru
          </Button>
        </Link>
      </PageHeader>

      {/* Search */}
      <div className="w-full sm:max-w-sm">
        <Input
          placeholder="Cari nama posko atau lokasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon="search"
        />
      </div>

      {/* Posko Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        {filtered.map((p) => (
          <PoskoCard
            key={p.id}
            posko={p}
            onToggleStatus={updatePoskoStatus}
          />
        ))}
      </div>
    </div>
  );
}
