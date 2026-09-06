"use client";

import * as React from "react";
import { Icon } from "@/shared/ui/icon";

interface DisplacedPersonMock {
  id: string;
  name: string;
  age: number;
  gender: "L" | "P";
  poskoName: string;
  campLocation: string;
  registeredDate: string;
  statusNotes: string;
  relativesCount: number;
  matchedReason?: string;
}

const SAMPLE_PEOPLE: DisplacedPersonMock[] = [
  {
    id: "REF-CJR-018",
    name: "Budi Santoso",
    age: 42,
    gender: "L",
    poskoName: "Posko Balai Desa Nagrak",
    campLocation: "Tenda 04 - Sektor Barat",
    registeredDate: "6 Sep 2026, 14:20",
    statusNotes: "Kondisi sehat bersama 3 anggota keluarga. Mencari adik kandung.",
    relativesCount: 3,
  },
  {
    id: "REF-CJR-042",
    name: "Siti Aminah binti Hasan",
    age: 36,
    gender: "P",
    poskoName: "Posko Lapangan Mandiri 01",
    campLocation: "Tenda Medis Observasi",
    registeredDate: "6 Sep 2026, 16:05",
    statusNotes: "Rawat luka gores ringan, sudah dapat berjalan normal.",
    relativesCount: 2,
  },
  {
    id: "REF-CJR-057",
    name: "Ahmad Fauzi Rahman",
    age: 19,
    gender: "L",
    poskoName: "Posko Stadion Badak Putih",
    campLocation: "Tenda Relawan Dapur Umum",
    registeredDate: "6 Sep 2026, 11:30",
    statusNotes: "Membantu distribusi air bersih. Terpisah dari orang tua.",
    relativesCount: 1,
  },
  {
    id: "REF-CJR-089",
    name: "Dewi Lestari",
    age: 28,
    gender: "P",
    poskoName: "Posko Balai Desa Nagrak",
    campLocation: "Tenda Ibu & Bayi (Barak 2)",
    registeredDate: "6 Sep 2026, 17:45",
    statusNotes: "Bersama bayi usia 8 bulan, persediaan susu dan popok cukup.",
    relativesCount: 2,
  },
  {
    id: "REF-CJR-104",
    name: "Joko Susilo",
    age: 58,
    gender: "L",
    poskoName: "Posko Darurat Cugenang",
    campLocation: "Tenda Lansia 01",
    registeredDate: "6 Sep 2026, 09:15",
    statusNotes: "Membutuhkan obat hipertensi rutin, dalam pantauan tim medis.",
    relativesCount: 1,
  },
];

export function InteractiveFamilySearch() {
  const [query, setQuery] = React.useState("");

  const filteredResults = React.useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return SAMPLE_PEOPLE;

    return SAMPLE_PEOPLE.filter((p) => {
      const matchName = p.name.toLowerCase().includes(cleanQ);
      const matchPosko = p.poskoName.toLowerCase().includes(cleanQ);
      const matchStatus = p.statusNotes.toLowerCase().includes(cleanQ);
      return matchName || matchPosko || matchStatus;
    });
  }, [query]);

  return (
    <div className="rounded-xl border-[1.5px] border-border bg-surface overflow-hidden shadow-2xs">
      <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-main text-base">
            Simulator Temu Keluarga Terpisah (Mode Warga)
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Pencarian cerdas nama warga antar-posko tanpa perlu akun, kata sandi, atau internet
          </p>
        </div>
        <span className="text-xs font-mono text-text-muted bg-surface px-2.5 py-1 rounded-md border border-border shrink-0 self-start sm:self-auto">
          Indonesian Phonetic Matcher
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Kolom Pencarian & Saran Nama */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
              <Icon name="search" variant="linear" size={18} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama kerabat, nama posko, atau kondisi (contoh: Budi, Siti, Lansia...)"
              className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-surface border-[1.5px] border-border rounded-lg text-text-main placeholder:text-text-muted/60 focus:outline-none focus:border-primary transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-main"
              >
                <Icon name="close" variant="linear" size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-text-muted mr-1">Coba kata kunci:</span>
            {["Budi Santoso", "Siti Aminah", "Ahmad", "Dewi", "Cugenang"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setQuery(sample)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  query === sample
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface-subtle text-text-muted border-border hover:border-border-strong hover:text-text-main"
                }`}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Hasil Penelusuran Warga */}
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-semibold text-text-muted flex items-center justify-between">
            <span>Daftar Warga Terdata ({filteredResults.length} data)</span>
            <span className="font-mono text-xs">Tersinkron via BLE Mesh</span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-border bg-surface-subtle space-y-1.5">
              <p className="text-xs font-semibold text-text-main">
                Tidak ada data warga yang cocok dengan &quot;{query}&quot;
              </p>
              <p className="text-xs text-text-muted">
                Data di posko mungkin belum terkirim via kurir data BLE / QR poster. Coba variasi nama panggilan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredResults.map((person) => (
                <div
                  key={person.id}
                  className="p-3.5 rounded-lg border-[1.5px] border-border bg-surface hover:border-border-hover transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-text-main text-sm leading-tight">
                          {person.name}
                        </h4>
                        <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                          <span>{person.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                          <span>•</span>
                          <span>{person.age} tahun</span>
                          <span>•</span>
                          <span>{person.relativesCount} anggota keluarga</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-text-muted px-1.5 py-0.5 bg-surface-muted rounded border border-border shrink-0">
                        {person.id}
                      </span>
                    </div>

                    <div className="mt-2.5 text-xs text-text-main/90 bg-surface-subtle p-2.5 rounded-md border border-border/80">
                      <div className="text-xs font-medium text-text-muted flex items-center gap-1">
                        <Icon name="pin" variant="linear" size={13} className="text-accent" />
                        <span>{person.poskoName} ({person.campLocation})</span>
                      </div>
                      <p className="text-xs text-text-main mt-1 leading-normal">
                        {person.statusNotes}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
                    <span>Terdata: {person.registeredDate}</span>
                    <span className="text-status-safe font-medium">Terverifikasi Posko</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
