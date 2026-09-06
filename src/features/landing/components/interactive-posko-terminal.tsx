"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { type TriageCategory, type VulnerabilityCategory } from "@/shared/types";

interface SimPatient {
  id: string;
  name: string;
  age: number;
  gender: "L" | "P";
  triage: TriageCategory;
  complaint: string;
  bp: string;
  pulse: number;
  spo2: number;
  time: string;
  prescriptions: string[];
}

interface SimCitizen {
  id: string;
  name: string;
  nikMasked: string;
  age: number;
  gender: "L" | "P";
  tent: string;
  vulnerabilities: VulnerabilityCategory[];
  registeredTime: string;
}

interface SimStock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  daysRemaining: number;
}

const INITIAL_PATIENTS: SimPatient[] = [
  {
    id: "MED-001",
    name: "Rahmat Hidayat",
    age: 46,
    gender: "L",
    triage: "RED",
    complaint: "Cedera dada tertimpa reruntuhan, sesak napas akut (RR 34x/menit)",
    bp: "90/60",
    pulse: 118,
    spo2: 91,
    time: "17:15",
    prescriptions: ["Oksigen Masker 4L/mnt", "Infus NaCl 0.9%"],
  },
  {
    id: "MED-002",
    name: "Ibu Nurhasanah",
    age: 62,
    gender: "P",
    triage: "YELLOW",
    complaint: "Fraktur tertutup lengan kanan bawah, nyeri sedang",
    bp: "135/85",
    pulse: 88,
    spo2: 98,
    time: "17:22",
    prescriptions: ["Bidai Lengan", "Paracetamol 500mg"],
  },
  {
    id: "MED-003",
    name: "Ananda Rizky",
    age: 8,
    gender: "L",
    triage: "GREEN",
    complaint: "Luka lecet di lutut dan telapak kaki, sadar penuh",
    bp: "105/70",
    pulse: 82,
    spo2: 99,
    time: "17:30",
    prescriptions: ["Povidone Iodine", "Kasa Steril"],
  },
  {
    id: "MED-004",
    name: "Korban Tanpa Identitas #02",
    age: 50,
    gender: "L",
    triage: "BLACK",
    complaint: "Trauma kepala berat di lokasi reruntuhan, pupil dilatasi maksimal, henti napas",
    bp: "0/0",
    pulse: 0,
    spo2: 0,
    time: "16:45",
    prescriptions: ["Kantong Jenazah", "Registrasi DVI"],
  },
];

const INITIAL_CITIZENS: SimCitizen[] = [
  {
    id: "REF-001",
    name: "Budi Santoso",
    nikMasked: "320301******0004",
    age: 42,
    gender: "L",
    tent: "Tenda 01 (Sektor Barat)",
    vulnerabilities: [],
    registeredTime: "16:10",
  },
  {
    id: "REF-002",
    name: "Siti Aminah",
    nikMasked: "320301******0012",
    age: 38,
    gender: "P",
    tent: "Tenda 01 (Sektor Barat)",
    vulnerabilities: ["IBU_HAMIL"],
    registeredTime: "16:12",
  },
  {
    id: "REF-003",
    name: "Nenek Maryam",
    nikMasked: "320301******0088",
    age: 71,
    gender: "P",
    tent: "Tenda Khusus Lansia",
    vulnerabilities: ["LANSIA"],
    registeredTime: "16:35",
  },
  {
    id: "REF-004",
    name: "Adik Fikri",
    nikMasked: "320301******0101",
    age: 3,
    gender: "L",
    tent: "Tenda 02",
    vulnerabilities: ["BALITA"],
    registeredTime: "16:50",
  },
];

const INITIAL_STOCKS: SimStock[] = [
  { id: "S-1", name: "Beras Sentra Posko", category: "Pangan Pokok", quantity: 420, unit: "kg", daysRemaining: 5 },
  { id: "S-2", name: "Selimut Wol Lapangan", category: "Papan & Hangat", quantity: 180, unit: "lembar", daysRemaining: 8 },
  { id: "S-3", name: "Paket Antibiotik & P3K", category: "Medis Darurat", quantity: 55, unit: "kotak", daysRemaining: 3 },
  { id: "S-4", name: "Air Minum Higienis Galon", category: "Air & Sanitasi", quantity: 140, unit: "galon", daysRemaining: 4 },
];

export function InteractivePoskoTerminal() {
  const [activeTab, setActiveTab] = React.useState<"triage" | "logistics" | "refugees" | "reunion">("triage");
  const [patients, setPatients] = React.useState<SimPatient[]>(INITIAL_PATIENTS);
  const [citizens, setCitizens] = React.useState<SimCitizen[]>(INITIAL_CITIZENS);
  const [stocks, setStocks] = React.useState<SimStock[]>(INITIAL_STOCKS);
  const [selectedPatient, setSelectedPatient] = React.useState<SimPatient | null>(null);

  // Form Fast Intake State
  const [intakeModalOpen, setIntakeModalOpen] = React.useState(false);
  const [newCitizenName, setNewCitizenName] = React.useState("");
  const [newCitizenAge, setNewCitizenAge] = React.useState("");
  const [newCitizenVuln, setNewCitizenVuln] = React.useState<VulnerabilityCategory | "NONE">("NONE");

  // Filter Warga
  const [vulnFilter, setVulnFilter] = React.useState<string>("ALL");

  // Pencarian Kerabat
  const [searchQuery, setSearchQuery] = React.useState("");

  // Mutasi Stok
  const [logisticsNotice, setLogisticsNotice] = React.useState<string>("Semua transaksi dicatat otomatis di buku posko.");

  // Hitung jumlah pasien tiap kategori triase
  const countRed = patients.filter((p) => p.triage === "RED").length;
  const countYellow = patients.filter((p) => p.triage === "YELLOW").length;
  const countGreen = patients.filter((p) => p.triage === "GREEN").length;
  const countBlack = patients.filter((p) => p.triage === "BLACK").length;

  const handleUpdatePatientTriage = (newCategory: TriageCategory) => {
    if (!selectedPatient) return;
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? { ...p, triage: newCategory } : p))
    );
    setSelectedPatient(null);
  };

  const handleDisburseStock = (id: string, amount: number) => {
    setStocks((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextQty = Math.max(0, s.quantity - amount);
        setLogisticsNotice(`Pengeluaran berhasil: -${amount} ${s.unit} ${s.name} diserahkan ke tenda.`);
        return {
          ...s,
          quantity: nextQty,
          daysRemaining: Math.max(1, Math.round(nextQty / 80)),
        };
      })
    );
  };

  const handleReceiveStock = (id: string, amount: number) => {
    setStocks((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextQty = s.quantity + amount;
        setLogisticsNotice(`Pasokan tiba: +${amount} ${s.unit} ${s.name} dicatat masuk ke gudang.`);
        return {
          ...s,
          quantity: nextQty,
          daysRemaining: Math.round(nextQty / 80),
        };
      })
    );
  };

  const handleSaveIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitizenName.trim()) return;

    const newPerson: SimCitizen = {
      id: `REF-${String(citizens.length + 1).padStart(3, "0")}`,
      name: newCitizenName.trim(),
      nikMasked: "320301******" + Math.floor(1000 + Math.random() * 9000),
      age: parseInt(newCitizenAge, 10) || 30,
      gender: "L",
      tent: "Tenda 03 (Sektor Timur)",
      vulnerabilities: newCitizenVuln === "NONE" ? [] : [newCitizenVuln],
      registeredTime: "Baru saja",
    };

    setCitizens([newPerson, ...citizens]);
    setNewCitizenName("");
    setNewCitizenAge("");
    setNewCitizenVuln("NONE");
    setIntakeModalOpen(false);
  };

  const filteredCitizens = citizens.filter((c) => {
    if (vulnFilter === "ALL") return true;
    return c.vulnerabilities.includes(vulnFilter as VulnerabilityCategory);
  });

  const searchResults = citizens.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.tent.toLowerCase().includes(q);
  });

  return (
    <div className="rounded-2xl border-[1.5px] border-border bg-surface shadow-xs overflow-hidden">
      {/* 1. HEADER WINDOW TERMINAL KOMANDO LAPANGAN */}
      <div className="bg-surface-subtle border-b border-border p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
            S-1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-main text-sm sm:text-base">
                Posko Mandiri Balai Desa Nagrak
              </span>
              <span className="w-2 h-2 rounded-full bg-status-safe inline-block" />
            </div>
            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
              <span>Misi Gempa Cianjur</span>
              <span>•</span>
              <span>Kecamatan Cugenang</span>
              <span>•</span>
              <span className="font-mono">Kapasitas: 450 Jiwa</span>
            </div>
          </div>
        </div>

        {/* Tab Navigasi Modul Asli */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "triage" as const, label: "Triase Medis START", icon: "health" as const, count: countRed + countYellow + countGreen + countBlack },
            { id: "logistics" as const, label: "Gudang Logistik", icon: "box" as const },
            { id: "refugees" as const, label: "Data Warga", icon: "users" as const, count: citizens.length },
            { id: "reunion" as const, label: "Cari Kerabat", icon: "search" as const },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-text-muted hover:text-text-main border border-border"
              }`}
            >
              <Icon name={tab.icon} variant={activeTab === tab.id ? "bold" : "linear"} size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono ${
                    activeTab === tab.id
                      ? "bg-primary-hover text-primary-foreground"
                      : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. AREA KONTEN SIMULASI UTAMA */}
      <div className="p-4 sm:p-6 bg-canvas min-h-[460px]">
        {/* ================= MODUL 1: PAPAN TRIASE START MEDIS ================= */}
        {activeTab === "triage" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-text-main text-sm sm:text-base">
                  Papan Kanban Triase Korban Massal (Metode START)
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Klik kartu pasien di bawah untuk memeriksa tanda vital, resep obat, atau memindahkan prioritas.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-text-muted self-start sm:self-auto">
                <span className="text-status-danger font-semibold">P1: {countRed}</span>
                <span>•</span>
                <span className="text-status-warning font-semibold">P2: {countYellow}</span>
                <span>•</span>
                <span className="text-status-safe font-semibold">P3: {countGreen}</span>
                <span>•</span>
                <span className="text-text-main font-semibold">P0: {countBlack}</span>
              </div>
            </div>

            {/* 4 Kolom Kanban Asli Sesuai Triage Lapangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              {/* KOLOM MERAH (P1 - Gawat Darurat) */}
              <div className="rounded-xl border border-status-danger-border bg-status-danger-bg/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-status-danger-border">
                  <span className="text-xs font-bold text-status-danger uppercase tracking-wider">
                    P1 • Gawat Darurat
                  </span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-status-danger text-text-inverse">
                    {countRed}
                  </span>
                </div>
                <div className="space-y-2">
                  {patients.filter((p) => p.triage === "RED").map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="p-3 rounded-lg border border-status-danger-border bg-surface hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main text-xs">{patient.name}</span>
                        <span className="text-xs text-text-muted font-mono">{patient.age} th ({patient.gender})</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{patient.complaint}</p>
                      <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs text-text-muted font-mono">
                        <span>Tensi: {patient.bp}</span>
                        <span>SpO2: {patient.spo2}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KOLOM KUNING (P2 - Mendesak) */}
              <div className="rounded-xl border border-status-warning-border bg-status-warning-bg/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-status-warning-border">
                  <span className="text-xs font-bold text-status-warning uppercase tracking-wider">
                    P2 • Mendesak
                  </span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-status-warning text-text-inverse">
                    {countYellow}
                  </span>
                </div>
                <div className="space-y-2">
                  {patients.filter((p) => p.triage === "YELLOW").map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="p-3 rounded-lg border border-status-warning-border bg-surface hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main text-xs">{patient.name}</span>
                        <span className="text-xs text-text-muted font-mono">{patient.age} th ({patient.gender})</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{patient.complaint}</p>
                      <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs text-text-muted font-mono">
                        <span>Tensi: {patient.bp}</span>
                        <span>SpO2: {patient.spo2}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KOLOM HIJAU (P3 - Luka Ringan) */}
              <div className="rounded-xl border border-status-safe-border bg-status-safe-bg/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-status-safe-border">
                  <span className="text-xs font-bold text-status-safe uppercase tracking-wider">
                    P3 • Luka Ringan
                  </span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-status-safe text-text-inverse">
                    {countGreen}
                  </span>
                </div>
                <div className="space-y-2">
                  {patients.filter((p) => p.triage === "GREEN").map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="p-3 rounded-lg border border-status-safe-border bg-surface hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main text-xs">{patient.name}</span>
                        <span className="text-xs text-text-muted font-mono">{patient.age} th ({patient.gender})</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{patient.complaint}</p>
                      <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs text-text-muted font-mono">
                        <span>Tensi: {patient.bp}</span>
                        <span>SpO2: {patient.spo2}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KOLOM HITAM (P0 - Meninggal) */}
              <div className="rounded-xl border border-border bg-surface-muted/30 p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                    P0 • Meninggal
                  </span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-primary text-text-inverse">
                    {countBlack}
                  </span>
                </div>
                <div className="space-y-2">
                  {patients.filter((p) => p.triage === "BLACK").map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="p-3 rounded-lg border border-border bg-surface hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main text-xs">{patient.name}</span>
                        <span className="text-xs text-text-muted font-mono">{patient.age} th ({patient.gender})</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{patient.complaint}</p>
                      <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs text-text-muted font-mono">
                        <span>Waktu: {patient.time}</span>
                        <span>DVI Mandiri</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MODAL / DRAWER PEMERIKSAAN PASIEN LANGSUNG */}
            {selectedPatient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                <div className="w-full max-w-md bg-surface border-[1.5px] border-border rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-text-muted">{selectedPatient.id}</span>
                      <h4 className="font-bold text-text-main text-base">{selectedPatient.name}</h4>
                      <p className="text-xs text-text-muted">{selectedPatient.age} tahun • {selectedPatient.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-text-muted hover:text-text-main"
                    >
                      <Icon name="close" variant="linear" size={20} />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs bg-surface-subtle p-3 rounded-lg border border-border">
                    <div className="font-semibold text-text-main">Keluhan &amp; Diagnosis Medis:</div>
                    <p className="text-text-muted leading-relaxed">{selectedPatient.complaint}</p>
                    <div className="pt-2 border-t border-border grid grid-cols-3 gap-2 font-mono">
                      <div>Tensi: <strong className="text-text-main">{selectedPatient.bp}</strong></div>
                      <div>Nadi: <strong className="text-text-main">{selectedPatient.pulse}x</strong></div>
                      <div>SpO2: <strong className="text-text-main">{selectedPatient.spo2}%</strong></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main block">
                      Ubah Prioritas Triase Pasien:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <Button
                        variant={selectedPatient.triage === "RED" ? "danger" : "outline"}
                        size="sm"
                        className="text-xs justify-center"
                        onClick={() => handleUpdatePatientTriage("RED")}
                      >
                        Merah P1
                      </Button>
                      <Button
                        variant={selectedPatient.triage === "YELLOW" ? "warning" : "outline"}
                        size="sm"
                        className="text-xs justify-center"
                        onClick={() => handleUpdatePatientTriage("YELLOW")}
                      >
                        Kuning P2
                      </Button>
                      <Button
                        variant={selectedPatient.triage === "GREEN" ? "success" : "outline"}
                        size="sm"
                        className="text-xs justify-center"
                        onClick={() => handleUpdatePatientTriage("GREEN")}
                      >
                        Hijau P3
                      </Button>
                      <Button
                        variant={selectedPatient.triage === "BLACK" ? "primary" : "outline"}
                        size="sm"
                        className="text-xs justify-center"
                        onClick={() => handleUpdatePatientTriage("BLACK")}
                      >
                        Hitam P0
                      </Button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="text-xs">
                      Tutup
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODUL 2: GUDANG LOGISTIK ================= */}
        {activeTab === "logistics" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-text-main text-sm sm:text-base">
                  Buku Kasir &amp; Saldo Stok Logistik Gudang
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Satu komputer memegang kunci pencatatan gudang agar bantuan tidak keluar dua kali.
                </p>
              </div>
              <span className="text-xs font-mono text-status-safe font-semibold self-start sm:self-auto">
                Buku Terkunci Aman
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface-subtle text-xs text-text-muted flex items-center gap-2">
              <Icon name="check" variant="bold" size={16} className="text-status-safe shrink-0" />
              <span>{logisticsNotice}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="p-4 rounded-xl border-[1.5px] border-border bg-surface flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{stock.category}</span>
                      <span className="font-semibold text-text-main">{stock.daysRemaining} hari stok</span>
                    </div>
                    <h5 className="font-bold text-text-main text-sm mt-1">{stock.name}</h5>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-text-main">{stock.quantity}</span>
                      <span className="text-xs text-text-muted font-medium">{stock.unit}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs justify-center"
                      onClick={() => handleDisburseStock(stock.id, stock.id === "S-1" ? 50 : 15)}
                    >
                      Salurkan (-{stock.id === "S-1" ? 50 : 15})
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs px-2"
                      onClick={() => handleReceiveStock(stock.id, 50)}
                    >
                      + Pasokan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= MODUL 3: DATA PENGUNGSI & INTAKE KILAT ================= */}
        {activeTab === "refugees" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-text-main text-sm sm:text-base">
                  Daftar Warga &amp; Registrasi Kilat (&lt;30 Detik)
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Mendata warga di antrean pengungsian secara cepat tanpa hambatan jaringan.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon="user-plus"
                iconVariant="bold"
                onClick={() => setIntakeModalOpen(true)}
                className="text-xs font-semibold self-start sm:self-auto"
              >
                Registrasi Warga Baru
              </Button>
            </div>

            {/* Filter Kerentanan */}
            <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
              <span className="text-text-muted font-medium shrink-0">Filter:</span>
              {[
                { id: "ALL", label: "Semua Warga" },
                { id: "BALITA", label: "Balita" },
                { id: "IBU_HAMIL", label: "Ibu Hamil" },
                { id: "LANSIA", label: "Lansia" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setVulnFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-all whitespace-nowrap ${
                    vulnFilter === f.id
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-surface text-text-muted border-border hover:text-text-main"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tabel Warga Asli */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="divide-y divide-border">
                {filteredCitizens.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-muted text-text-main font-bold text-xs flex items-center justify-center shrink-0">
                        {c.gender}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-main text-xs sm:text-sm">{c.name}</span>
                          <span className="text-xs text-text-muted font-mono">{c.age} tahun</span>
                        </div>
                        <div className="text-xs text-text-muted font-mono mt-0.5">
                          {c.nikMasked} • {c.tent}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {c.vulnerabilities.map((v) => (
                        <span
                          key={v}
                          className="text-xs px-2 py-0.5 rounded border border-border bg-surface-muted text-text-main font-medium"
                        >
                          {v === "IBU_HAMIL" ? "Bumil" : v}
                        </span>
                      ))}
                      <span className="text-xs font-mono text-text-muted">{c.registeredTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FORM FAST INTAKE MODAL */}
            {intakeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                <form
                  onSubmit={handleSaveIntake}
                  className="w-full max-w-md bg-surface border-[1.5px] border-border rounded-xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-text-main text-base">Registrasi Kilat Warga</h4>
                      <p className="text-xs text-text-muted">Target input di bawah 30 detik per orang</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIntakeModalOpen(false)}
                      className="text-text-muted hover:text-text-main"
                    >
                      <Icon name="close" variant="linear" size={20} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-text-main block">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Contoh: Hendra Gunawan"
                        value={newCitizenName}
                        onChange={(e) => setNewCitizenName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-text-main block">Usia (Tahun)</label>
                        <input
                          type="number"
                          placeholder="35"
                          value={newCitizenAge}
                          onChange={(e) => setNewCitizenAge(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-primary text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-text-main block">Kategori Khusus</label>
                        <select
                          value={newCitizenVuln}
                          onChange={(e) => setNewCitizenVuln(e.target.value as VulnerabilityCategory | "NONE")}
                          className="w-full h-9 px-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-primary text-xs"
                        >
                          <option value="NONE">Umum (Tidak Rentan)</option>
                          <option value="BALITA">Balita</option>
                          <option value="IBU_HAMIL">Ibu Hamil</option>
                          <option value="LANSIA">Lansia</option>
                          <option value="DISABILITAS">Disabilitas</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIntakeModalOpen(false)}
                      className="text-xs"
                    >
                      Batal
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="text-xs font-semibold">
                      Simpan ke Memori Posko
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= MODUL 4: CARI KERABAT ================= */}
        {activeTab === "reunion" && (
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-text-main text-sm sm:text-base">
                Layanan Pencarian Kerabat Terpisah (Mode Warga)
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Cari anggota keluarga antar-posko tanpa perlu akun atau izin khusus.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                <Icon name="search" variant="linear" size={16} />
              </div>
              <input
                type="text"
                placeholder="Ketik nama keluarga (misal: Budi, Siti, Maryam...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-surface text-text-main text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-border bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-text-main text-xs sm:text-sm">{c.name}</h5>
                    <span className="text-xs font-mono text-status-safe font-semibold">Selamat di Posko</span>
                  </div>
                  <div className="text-xs text-text-muted space-y-0.5">
                    <div>Lokasi: <strong className="text-text-main">{c.tent}</strong></div>
                    <div>Usia: <strong className="text-text-main">{c.age} tahun</strong></div>
                    <div>Terdata: <strong className="text-text-main">{c.registeredTime}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. FOOTER STATUS TERMINAL */}
      <div className="p-3 bg-surface-subtle border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <Icon name="shield" variant="linear" size={15} />
          <span>Seluruh data tersimpan permanen di memori fisik perangkat Anda</span>
        </span>
        <span className="font-medium">Sinkronisasi Otomatis Antar-HP Aktif</span>
      </div>
    </div>
  );
}
