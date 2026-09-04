"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";

export function RefugeeDetailView({ refugeeId }: { refugeeId: string }) {
  const { session, refugees } = usePoskoStore();

  const person = refugees.find((r) => r.id === refugeeId) || refugees[0];
  const [addEventOpen, setAddEventOpen] = React.useState(false);
  const [eventType, setEventType] = React.useState<"HEALTH_CHECK" | "NEED_REPORTED" | "NOTE">("NOTE");
  const [eventNote, setEventNote] = React.useState("");

  const [events, setEvents] = React.useState([
    {
      id: "EVT-01",
      type: "INTAKE",
      title: "Pendaftaran Awal",
      author: person.registeredByUserName,
      role: "Relawan",
      note: "Warga didata saat tiba di posko evakuasi.",
      time: "Hari ini, 08:30 WIB",
      seq: 1,
    },
    {
      id: "EVT-02",
      type: "HEALTH_CHECK",
      title: "Pemeriksaan Kesehatan",
      author: "dr. Siti",
      role: "Medis",
      note: "Suhu 38.5°C, tensi 120/80 mmHg. Diberikan Paracetamol 500mg.",
      time: "Hari ini, 10:15 WIB",
      seq: 2,
    },
    {
      id: "EVT-03",
      type: "AID_RECEIVED",
      title: "Penyerahan Bantuan",
      author: "Rizky",
      role: "Relawan",
      note: "Diserahkan 2 Selimut Hangat & 1 Kotak Susu Formula.",
      time: "Hari ini, 14:00 WIB",
      seq: 3,
    },
  ]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventNote.trim()) return;

    const newEvt = {
      id: `EVT-0${events.length + 1}`,
      type: eventType,
      title:
        eventType === "HEALTH_CHECK"
          ? "Catatan Medis"
          : eventType === "NEED_REPORTED"
          ? "Permintaan Kebutuhan"
          : "Catatan Umum",
      author: session.userName,
      role: session.userRole,
      note: eventNote.trim(),
      time: "Baru saja",
      seq: events.length + 1,
    };

    setEvents([newEvt, ...events]);
    setEventNote("");
    setAddEventOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Back Button */}
      <div className="flex items-center justify-between">
        <Link href={`/posko/${session.poskoId}/refugees`}>
          <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
            Kembali ke Daftar Warga
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          icon="edit"
          iconVariant="bold"
          onClick={() => setAddEventOpen(true)}
        >
          + Tambah Catatan
        </Button>
      </div>

      {/* Refugee Profile Card */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-muted text-text-main font-bold flex items-center justify-center text-lg border border-border shrink-0">
                {person.gender === "M" ? "L" : "P"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      person.triageStatus === "RED"
                        ? "triage-red"
                        : person.triageStatus === "YELLOW"
                        ? "triage-yellow"
                        : "triage-green"
                    }
                    size="sm"
                  >
                    {person.triageStatus === "RED" ? "Kritis" : person.triageStatus === "YELLOW" ? "Perawatan" : "Sehat"}
                  </Badge>
                  <span className="text-xs text-text-muted">
                    {person.age} Tahun ({person.gender === "M" ? "Laki-laki" : "Perempuan"})
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-main">
                  {person.fullName}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  ID: {person.id} {person.nik ? `• NIK: ${person.nik}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted font-medium">Lokasi Tenda:</span>
              <p className="text-sm font-bold text-text-main mt-0.5">
                {person.shelterLocation}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted font-medium">Asal Dusun / Desa:</span>
              <p className="text-sm font-bold text-text-main mt-0.5">
                {person.domicileOrigin}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted font-medium">Kerabat yang Dicari:</span>
              <p className="text-sm font-bold text-text-main mt-0.5">
                {person.missingKinName || "Tidak ada"}
              </p>
            </div>
          </div>

          {/* Urgent Needs */}
          {person.urgentNeeds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-text-muted font-medium">Kebutuhan:</span>
              {person.urgentNeeds.map((need) => (
                <span
                  key={need}
                  className="px-2 py-0.5 rounded bg-status-warning-bg text-status-warning border border-status-warning-border font-medium"
                >
                  {need}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Peristiwa Warga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {events.map((evt) => (
              <div key={evt.id} className="relative group">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-surface border-2 border-primary" />

                <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-main">
                      {evt.title}
                    </span>
                    <span className="text-xs text-text-muted">{evt.time}</span>
                  </div>

                  <p className="text-xs text-text-main leading-relaxed">
                    {evt.note}
                  </p>

                  <p className="text-[11px] text-text-muted pt-1">
                    Oleh: {evt.author} ({evt.role})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Modal */}
      <Dialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        title="Tambah Catatan Peristiwa"
        description="Mencatat riwayat perkembangan kondisi warga di posko."
        maxWidth="md"
      >
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
              Jenis Catatan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "NOTE", label: "Catatan Umum" },
                { id: "HEALTH_CHECK", label: "Medis" },
                { id: "NEED_REPORTED", label: "Kebutuhan" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEventType(t.id as any)}
                  className={`p-2.5 rounded-lg border-[1.5px] text-xs font-bold transition-all cursor-pointer ${
                    eventType === t.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-surface text-text-main border-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
              Isi Catatan
            </label>
            <Input
              placeholder="Tuliskan catatan kondisi atau kebutuhan warga..."
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddEventOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon="check"
              iconVariant="bold"
            >
              Simpan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
