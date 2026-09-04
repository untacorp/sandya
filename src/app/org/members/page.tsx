"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";

export default function OrgMembersPage() {
  const { session, missions } = usePoskoStore();
  const [selectedCoordinator, setSelectedCoordinator] = React.useState<any | null>(null);

  const leaders = [
    {
      id: "PIM-01",
      name: session.userName,
      role: "Ketua Pengurus",
      scope: "Seluruh Wilayah Lembaga",
      status: "ACTIVE",
    },
    {
      id: "PIM-02",
      name: "dr. H. Hendrawan, Sp.EM",
      role: "Koordinator Medis Darurat",
      scope: "Seluruh Wilayah Lembaga",
      status: "ACTIVE",
    },
  ];

  const coordinators = missions.map((m, idx) => ({
    id: `KOR-0${idx + 1}`,
    name: idx === 0 ? "Drs. H. Mamat" : "Bambang Sudarsono",
    role: "Koordinator Lapangan Wilayah",
    missionId: m.id,
    missionName: m.name,
    status: m.status === "ACTIVE_EMERGENCY" ? "ON_DUTY" : "STANDBY",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-main">
          Pengurus & Koordinator Lapangan
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Daftar pengurus induk dan penanggung jawab operasi di setiap wilayah bencana.
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
                    onClick={() => setSelectedCoordinator(cmd)}
                  >
                    Buka QR Akses Tugas
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Pass Modal */}
      <Dialog
        open={Boolean(selectedCoordinator)}
        onOpenChange={(open) => !open && setSelectedCoordinator(null)}
        title="QR Masuk Petugas Koordinator Wilayah"
        description="Arahkan kamera HP koordinator ke kode QR ini untuk memberikan akses."
        maxWidth="sm"
      >
        {selectedCoordinator && (
          <div className="space-y-4 text-center">
            <div className="w-48 h-48 mx-auto p-4 rounded-xl bg-surface border border-border flex flex-col items-center justify-center space-y-2 shadow-xs">
              <Icon name="qr-code" variant="bold" size={130} className="text-primary" />
            </div>

            <div className="text-xs text-text-muted space-y-0.5">
              <p className="font-bold text-text-main text-sm">
                {selectedCoordinator.name}
              </p>
              <p>Operasi: {selectedCoordinator.missionName}</p>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setSelectedCoordinator(null)}
            >
              Tutup
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
