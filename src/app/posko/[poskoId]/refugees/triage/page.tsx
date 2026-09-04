"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";
import { type TriageCategory, type DisasterPerson } from "@/shared/types";

export default function TriagePage() {
  const { session, refugees, updateRefugeeTriage, createNeedsTicket } = usePoskoStore();

  const [selectedPatient, setSelectedPatient] = React.useState<DisasterPerson | null>(null);
  const [examOpen, setExamOpen] = React.useState(false);

  // Form State
  const [temp, setTemp] = React.useState("38.5");
  const [bp, setBp] = React.useState("120/80");
  const [pulse, setPulse] = React.useState("88");
  const [complaint, setComplaint] = React.useState("Demam dan pusing");
  const [triageColor, setTriageColor] = React.useState<TriageCategory>("YELLOW");
  const [prescribeMedicine, setPrescribeMedicine] = React.useState(true);
  const [medicineName, setMedicineName] = React.useState("Paracetamol 500mg");
  const [medicineQty, setMedicineQty] = React.useState(2);

  const openExam = (patient: DisasterPerson) => {
    setSelectedPatient(patient);
    setTriageColor(patient.triageStatus || "GREEN");
    setExamOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    updateRefugeeTriage(selectedPatient.id, triageColor);

    if (prescribeMedicine) {
      createNeedsTicket({
        refugeeId: selectedPatient.id,
        refugeeName: selectedPatient.fullName,
        shelterLocation: selectedPatient.shelterLocation,
        postId: session.poskoId,
        itemName: medicineName,
        quantity: medicineQty,
        unit: "STRIP",
        urgency: triageColor === "RED" ? "HIGH" : "MEDIUM",
        createdByUserId: session.userId,
        createdByUserName: session.userName,
      });
    }

    setExamOpen(false);
  };

  const getPatientsByTriage = (color: TriageCategory) => {
    return refugees.filter((r) => r.triageStatus === color);
  };

  const categories: {
    color: TriageCategory;
    title: string;
    desc: string;
    badgeVariant: any;
  }[] = [
    {
      color: "RED",
      title: "Perlu Tindakan Segera",
      desc: "Gawat darurat / butuh rujukan RS",
      badgeVariant: "triage-red",
    },
    {
      color: "YELLOW",
      title: "Perlu Perawatan Posko",
      desc: "Kondisi mendesak namun stabil",
      badgeVariant: "triage-yellow",
    },
    {
      color: "GREEN",
      title: "Kondisi Ringan",
      desc: "Rawat jalan atau pemulihan",
      badgeVariant: "triage-green",
    },
    {
      color: "BLACK",
      title: "Meninggal Dunia",
      desc: "Korban jiwa yang terdata",
      badgeVariant: "triage-black",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Sub-Navigasi */}
      <Tabs
        items={[
          { id: "list", label: "Daftar Warga", icon: "users", href: `/posko/${session.poskoId}/refugees` },
          { id: "triage", label: "Pemeriksaan Medis", icon: "health", badgeCount: refugees.length, href: `/posko/${session.poskoId}/refugees/triage` },
          { id: "reunion", label: "Pencarian Keluarga", icon: "search", href: `/posko/${session.poskoId}/refugees/reunion` },
        ]}
        activeId="triage"
        variant="segmented"
        className="w-full sm:w-auto"
      />

      {/* 2. Grid 4 Kolom Kategori Medis (Spasi Rasional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const patientList = getPatientsByTriage(cat.color);
          return (
            <div
              key={cat.color}
              className="rounded-xl border border-border bg-surface flex flex-col min-h-[420px] shadow-2xs"
            >
              {/* Header Kolom */}
              <div className="p-3 border-b border-border flex items-center justify-between bg-surface-subtle">
                <div>
                  <h2 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cat.color === "RED"
                          ? "bg-status-danger"
                          : cat.color === "YELLOW"
                          ? "bg-status-warning"
                          : cat.color === "GREEN"
                          ? "bg-status-safe"
                          : "bg-triage-black"
                      }`}
                    />
                    {cat.title}
                  </h2>
                  <p className="text-[11px] text-text-muted mt-0.5">{cat.desc}</p>
                </div>
                <span className="text-xs font-bold text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
                  {patientList.length}
                </span>
              </div>

              {/* Daftar Pasien */}
              <div className="p-2.5 flex-1 space-y-2 overflow-y-auto">
                {patientList.length === 0 ? (
                  <p className="text-xs text-text-subtle text-center py-8">
                    Tidak ada pasien
                  </p>
                ) : (
                  patientList.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => openExam(patient)}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors bg-surface cursor-pointer shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-text-main">
                          {patient.fullName}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {patient.age} th
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        {patient.shelterLocation} • Asal {patient.domicileOrigin}
                      </p>
                      <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px] text-primary font-semibold">
                        <span>Periksa Pasien</span>
                        <Icon name="arrow-right" variant="linear" size={12} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modal Form Pemeriksaan Kesehatan */}
      <Dialog
        open={examOpen}
        onOpenChange={setExamOpen}
        title={`Pemeriksaan: ${selectedPatient?.fullName || ""}`}
        description="Catat hasil pemeriksaan tanda vital, keluhan, dan resep obat yang dibutuhkan pasien."
      >
        {selectedPatient && (
          <form onSubmit={handleSaveExam} className="space-y-4 pt-1 text-xs">
            {/* Tanda Vital */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-text-main block">Suhu Tubuh (°C)</label>
                <Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36.5" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-text-main block">Tekanan Darah</label>
                <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-text-main block">Denyut Nadi</label>
                <Input value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="80" />
              </div>
            </div>

            {/* Keluhan Pasien */}
            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Keluhan & Diagnosa Singkat</label>
              <Input
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="misal: Demam tinggi, pusing, batuk pilek"
              />
            </div>

            {/* Pilihan Kategori Kondisi */}
            <div className="space-y-1">
              <label className="font-semibold text-text-main block">Tingkat Penanganan</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "RED", label: "Perlu Segera", cls: "text-status-danger border-status-danger-border" },
                  { id: "YELLOW", label: "Rawat Jalan", cls: "text-status-warning border-status-warning-border" },
                  { id: "GREEN", label: "Kondisi Ringan", cls: "text-status-safe border-status-safe-border" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTriageColor(item.id as TriageCategory)}
                    className={`py-2 px-2 rounded-lg font-bold border transition-colors cursor-pointer text-center ${
                      triageColor === item.id
                        ? "bg-surface-muted " + item.cls + " ring-1 ring-primary/20"
                        : "bg-surface text-text-muted border-border hover:bg-surface-subtle"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resep Obat */}
            <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prescribe"
                  checked={prescribeMedicine}
                  onChange={(e) => setPrescribeMedicine(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="prescribe" className="font-semibold text-text-main cursor-pointer">
                  Ajukan Resep Obat ke Bagian Logistik
                </label>
              </div>

              {prescribeMedicine && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <Input
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      placeholder="Nama obat (misal: Paracetamol)"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={medicineQty}
                      onChange={(e) => setMedicineQty(parseInt(e.target.value) || 1)}
                      placeholder="Jumlah"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setExamOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 justify-center"
              >
                Simpan Pemeriksaan
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
