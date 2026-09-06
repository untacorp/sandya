"use client";
import { Select } from "@/shared/ui/select";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asRefugeeId, asPoskoId } from "@/core/shared/branded-types";
import { RefugeeAggregate } from "@/core/domain/refugees/refugee.aggregate";
import { DISASTER_NEEDS_CATALOG } from "@/core/codecs/needs-catalog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { EmptyState } from "@/shared/ui/empty-state";
import { type TriageCategory, type DisasterPerson } from "@/shared/types";
import { canConductTriage } from "@/core/permissions/posko-permissions";

interface PrescriptionFormItem {
  needTokenId: number;
  quantity: number;
  unit: string;
  dosage: string;
}

export default function PoskoTriagePage() {
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const {
    session,
    refugees,
    needsTickets,
    updateRefugeeTriage,
    createNeedsTicket,
    handleRefugeeDeceasedResolution,
  } = usePoskoStore();
  const effectivePoskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : session.poskoId;

  const [triageFilter, setTriageFilter] = React.useState<string>("ALL");
  const [selectedPatient, setSelectedPatient] = React.useState<DisasterPerson | null>(null);
  const [examOpen, setExamOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Deceased / Triase Hitam Resolution State
  const [deceasedModalOpen, setDeceasedModalOpen] = React.useState(false);
  const [deceasedTargetPatient, setDeceasedTargetPatient] = React.useState<DisasterPerson | null>(null);
  const [generalLogisticsAction, setGeneralLogisticsAction] = React.useState<"CANCEL_ALL" | "TRANSFER_TO_KIN">("CANCEL_ALL");
  const [targetKinName, setTargetKinName] = React.useState("");
  const [issueMortuaryKit, setIssueMortuaryKit] = React.useState(true);
  
  // Optimasi Papan Kanban
  const [visibleCounts, setVisibleCounts] = React.useState<Record<TriageCategory, number>>({
  RED: 15,
  YELLOW: 15,
  GREEN: 15,
  BLACK: 15,
  });
  const [isCompact, setIsCompact] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const [selectedRefugeeId, setSelectedRefugeeId] = React.useState<string>("");

  // RBAC Permission Check
  const isAuthorized = canConductTriage(session.userRole);

  // Form State
  const [temp, setTemp] = React.useState("37.0");
  const [systolic, setSystolic] = React.useState("120");
  const [diastolic, setDiastolic] = React.useState("80");
  const [pulse, setPulse] = React.useState("80");
  const [spo2, setSpo2] = React.useState("98");
  const [complaint, setComplaint] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [triageColor, setTriageColor] = React.useState<TriageCategory>("GREEN");

  // Pharmacy Prescriptions State (Katalog Medis & Obat)
  const [prescribeMedicine, setPrescribeMedicine] = React.useState(false);
  const [prescriptions, setPrescriptions] = React.useState<PrescriptionFormItem[]>([
  {
  needTokenId: 0x27, // Paracetamol default
  quantity: 1,
  unit: "STRIP",
  dosage: "3x1 tablet sesudah makan",
  },
  ]);

  const medicalCatalog = React.useMemo(() => {
  return Object.values(DISASTER_NEEDS_CATALOG).filter((item) => item.cluster === "MEDICAL");
  }, []);

  const openExam = (patient: DisasterPerson) => {
  setSelectedPatient(patient);
  setTriageColor(patient.triageStatus || "GREEN");
  setComplaint("");
  setDiagnosis("");
  setTemp("36.8");
  setSystolic("120");
  setDiastolic("80");
  setPulse("80");
  setSpo2("98");
  setPrescribeMedicine(false);
  setPrescriptions([
  {
  needTokenId: 0x27,
  quantity: 1,
  unit: "STRIP",
  dosage: "3x1 tablet sesudah makan",
  },
  ]);
  setErrorMessage(null);
  setExamOpen(true);
  };

  const handleAddPrescriptionItem = () => {
  setPrescriptions((prev) => [
  ...prev,
  {
  needTokenId: 0x27,
  quantity: 1,
  unit: "STRIP",
  dosage: "3x1 tablet sesudah makan",
  },
  ]);
  };

  const handleRemovePrescriptionItem = (index: number) => {
  setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePrescription = (
  index: number,
  field: keyof PrescriptionFormItem,
  val: string | number
  ) => {
  setPrescriptions((prev) =>
  prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
  );
  };

  const ensureRefugeeInRepo = async (container: ServiceContainer, person: DisasterPerson) => {
  const existing = await container.refugeeRepo.findById(asRefugeeId(person.id));
  if (!existing.ok || !existing.value) {
  const agg = RefugeeAggregate.reconstitute({
  id: asRefugeeId(person.id),
  poskoId: asPoskoId(effectivePoskoId),
  fullName: person.fullName,
  nationalId: person.nik || null,
  gender: person.gender,
  age: person.age,
  domicileOrigin: person.domicileOrigin || null,
  shelterLocation: person.shelterLocation || null,
  missingKinName: person.missingKinName || null,
  currentTriage: person.triageStatus || "GREEN",
  registeredByUserId: person.registeredByUserId,
  createdAt: person.createdAt,
  version: 1,
  });
  await container.refugeeRepo.save(agg);
  }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!isAuthorized) {
      setErrorMessage("Akses ditolak: Hanya Petugas Medis Berlisensi yang berwenang menetapkan triase dan resep.");
      return;
    }

    // Jika Triase Hitam dan terdapat tiket aktif, alihkan ke modal resolusi jenazah
    if (triageColor === "BLACK") {
      const activeTickets = needsTickets.filter(
        (t) =>
          (t.refugeeId === selectedPatient.id ||
            t.refugeeName.toLowerCase() === selectedPatient.fullName.toLowerCase()) &&
          (t.status === "PENDING" || t.status === "ALLOCATED")
      );
      if (activeTickets.length > 0) {
        setExamOpen(false);
        setDeceasedTargetPatient(selectedPatient);
        setTargetKinName(selectedPatient.missingKinName || `Keluarga ${selectedPatient.fullName}`);
        setGeneralLogisticsAction("CANCEL_ALL");
        setIssueMortuaryKit(true);
        setDeceasedModalOpen(true);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const container = ServiceContainer.getInstance();
      await ensureRefugeeInRepo(container, selectedPatient);

      const validPrescriptions = prescribeMedicine
        ? prescriptions.map((rx) => ({
            needTokenId: rx.needTokenId,
            medicineName: DISASTER_NEEDS_CATALOG[rx.needTokenId]?.nameId || "Obat Medis",
            quantity: Math.max(1, rx.quantity),
            unit: rx.unit,
            dosage: rx.dosage,
          }))
        : [];

      const result = await container.recordTriageExamUseCase.execute({
        refugeeId: selectedPatient.id,
        poskoId: session.poskoId,
        authorId: session.userId,
        authorName: session.userName,
        authorRole: session.userRole,
        triageCategory: triageColor,
        vitalSigns: {
          systolic: systolic ? parseInt(systolic) : undefined,
          diastolic: diastolic ? parseInt(diastolic) : undefined,
          temperature: temp ? parseFloat(temp) : undefined,
          pulse: pulse ? parseInt(pulse) : undefined,
          spo2: spo2 ? parseInt(spo2) : undefined,
          complaint: complaint.trim() || undefined,
          diagnosis: diagnosis.trim() || undefined,
        },
        prescriptions: validPrescriptions.length > 0 ? validPrescriptions : undefined,
      });

      if (!result.ok) {
        setErrorMessage(result.error.message);
        setIsSubmitting(false);
        return;
      }

      // 1. Update Posko Store Triage
      updateRefugeeTriage(selectedPatient.id, triageColor);

      // 2. Dispatch Tickets to Local Store for immediate warehouse fulfillment visibility
      if (prescribeMedicine && validPrescriptions.length > 0) {
        validPrescriptions.forEach((rx) => {
          createNeedsTicket({
            refugeeId: selectedPatient.id,
            refugeeName: selectedPatient.fullName,
            shelterLocation: selectedPatient.shelterLocation,
            postId: effectivePoskoId,
            itemName: rx.medicineName,
            quantity: rx.quantity,
            unit: rx.unit,
            urgency: triageColor === "RED" ? "HIGH" : triageColor === "YELLOW" ? "MEDIUM" : "LOW",
            createdByUserId: session.userId,
            createdByUserName: session.userName,
          });
        });
      }

      setSuccessToast(
        `Triase ${selectedPatient.fullName} berhasil diperbarui ke ${triageColor}${
          validPrescriptions.length > 0 ? ` (+${validPrescriptions.length} tiket obat diterbitkan)` : ""
        }`
      );
      setTimeout(() => setSuccessToast(null), 4000);

      setExamOpen(false);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Terjadi kesalahan saat menyimpan rekam triase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTriageChange = async (
    patient: DisasterPerson,
    newTriage: TriageCategory,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!isAuthorized) {
      alert("Akses ditolak: Hanya Petugas Medis Berlisensi yang berwenang mengubah klasifikasi triase.");
      return;
    }

    // Jika perubahan cepat ke Hitam dan ada tiket aktif, buka dialog resolusi
    if (newTriage === "BLACK") {
      const activeTickets = needsTickets.filter(
        (t) =>
          (t.refugeeId === patient.id ||
            t.refugeeName.toLowerCase() === patient.fullName.toLowerCase()) &&
          (t.status === "PENDING" || t.status === "ALLOCATED")
      );
      if (activeTickets.length > 0) {
        setDeceasedTargetPatient(patient);
        setTargetKinName(patient.missingKinName || `Keluarga ${patient.fullName}`);
        setGeneralLogisticsAction("CANCEL_ALL");
        setIssueMortuaryKit(true);
        setDeceasedModalOpen(true);
        return;
      }
    }

    try {
      const container = ServiceContainer.getInstance();
      await ensureRefugeeInRepo(container, patient);
      const res = await container.recordTriageExamUseCase.execute({
        refugeeId: patient.id,
        poskoId: effectivePoskoId,
        authorId: session.userId,
        authorName: session.userName,
        authorRole: session.userRole,
        triageCategory: newTriage,
        vitalSigns: {
          complaint: `Penyesuaian cepat status triase lapangan ke ${newTriage}`,
        },
      });

      if (res.ok) {
        updateRefugeeTriage(patient.id, newTriage);
      }
    } catch (err) {
      console.error("Failed quick triage change", err);
    }
  };

  const handleConfirmDeceasedResolution = async () => {
    if (!deceasedTargetPatient) return;
    setIsSubmitting(true);
    try {
      const container = ServiceContainer.getInstance();
      await ensureRefugeeInRepo(container, deceasedTargetPatient);

      // 1. Record triage event in repository & outbox
      await container.recordTriageExamUseCase.execute({
        refugeeId: deceasedTargetPatient.id,
        poskoId: effectivePoskoId,
        authorId: session.userId,
        authorName: session.userName,
        authorRole: session.userRole,
        triageCategory: "BLACK",
        vitalSigns: {
          complaint: "Warga dinyatakan meninggal dunia (Triase Hitam). Resolusi tiket kebutuhan diterapkan.",
        },
      });

      // 2. Execute resolution on store (rollbacks allocated inventory, cancels medical, handles general logistics, issues mortuary kit)
      handleRefugeeDeceasedResolution({
        refugeeId: deceasedTargetPatient.id,
        cancelMedicalTickets: true,
        generalLogisticsAction,
        targetKinName: generalLogisticsAction === "TRANSFER_TO_KIN" ? targetKinName : undefined,
        issueMortuaryKit,
      });

      setSuccessToast(
        `Triase ${deceasedTargetPatient.fullName} ditetapkan ke Hitam. Resolusi kebutuhan berhasil diterapkan.`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      setDeceasedModalOpen(false);
      setDeceasedTargetPatient(null);
    } catch (err: unknown) {
      console.error("Failed deceased resolution:", err);
      alert("Terjadi kesalahan saat menyelesaikan resolusi jenazah.");
    } finally {
      setIsSubmitting(false);
    }
  };

    const poskoRefugees = React.useMemo(() => {
      return refugees.filter((r) => r.postId === effectivePoskoId);
    }, [refugees, effectivePoskoId]);

    const filteredRefugees = React.useMemo(() => {
      if (!searchQuery.trim()) return poskoRefugees;
      const q = searchQuery.toLowerCase();
      return poskoRefugees.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.shelterLocation?.toLowerCase().includes(q) ||
          r.domicileOrigin?.toLowerCase().includes(q) ||
          (r.nik && r.nik.includes(q))
      );
    }, [poskoRefugees, searchQuery]);

  const getPatientsByTriage = (color: TriageCategory) => {
  return filteredRefugees.filter((r) => (r.triageStatus || "GREEN") === color);
  };

  const categories: {
  color: TriageCategory;
  priorityLabel: string;
  title: string;
  desc: string;
  headerCls: string;
  dotCls: string;
  badgeVariant: "triage-red" | "triage-yellow" | "triage-green" | "triage-black";
  }[] = [
  {
  color: "RED",
  priorityLabel: "P1 - KRITIS",
  title: "Tindakan Segera",
  desc: "Gawat darurat, syok, henti nafas tertolong, rujukan RS",
  headerCls: "bg-status-danger-bg text-status-danger border-status-danger-border",
  dotCls: "bg-status-danger ring-2 ring-status-danger/30",
  badgeVariant: "triage-red",
  },
  {
  color: "YELLOW",
  priorityLabel: "P2 - MENDESAK",
  title: "Perawatan Posko",
  desc: "Kondisi mendesak, hemodinamik stabil, observasi medis",
  headerCls: "bg-status-warning-bg text-status-warning border-status-warning-border",
  dotCls: "bg-status-warning ring-2 ring-status-warning/30",
  badgeVariant: "triage-yellow",
  },
  {
  color: "GREEN",
  priorityLabel: "P3 - RINGAN",
  title: "Kondisi Ringan",
  desc: "Rawat jalan, luka minor, stabil dan mandiri",
  headerCls: "bg-status-safe-bg text-status-safe border-status-safe-border",
  dotCls: "bg-status-safe ring-2 ring-status-safe/30",
  badgeVariant: "triage-green",
  },
  {
  color: "BLACK",
  priorityLabel: "P0 - EKSPEKTAN",
  title: "Meninggal Dunia",
  desc: "Korban jiwa terdata / tidak tertolong",
  headerCls: "bg-surface-muted text-text-muted border-border",
  dotCls: "bg-triage-black ring-2 ring-border",
  badgeVariant: "triage-black",
  },
  ];

  return (
  <div className="space-y-4">
  {/* 2. Banner Notifikasi RBAC & Sukses */}
  {!isAuthorized && (
  <AlertBanner
  variant="warning"
  title="Mode Peninjauan (Read-Only)"
  description="Akses wewenang penetapan triase klinis dan peresepan obat dibatasi khusus untuk Petugas Medis Berlisensi, Koordinator Posko, atau Komandan Misi."
  icon="shield"
  />
  )}

  {successToast && (
  <AlertBanner
  variant="safe"
  title="Rekam Medis Tersimpan"
  description={successToast}
  icon="check"
  />
  )}

  {/* 3. Bar Kontrol & Pencarian */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border shadow-2xs">
  <div className="relative flex-1">
  <Icon
  name="search"
  variant="linear"
  size={16}
  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
  />
  <Input value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Cari pasien berdasarkan nama, NIK, atau lokasi tenda..."
  className="pl-9 text-xs h-10"
  />
  </div>
  <div className="flex flex-wrap items-center gap-2">
  <button 
  onClick={() => setIsCompact(!isCompact)}
  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border text-xs font-semibold hover:bg-surface-subtle transition-colors text-text-main"
  >
  <Icon name="filter" variant="linear" size={14} />
  <span className="hidden sm:inline">{isCompact ? "Tampilan Detail" : "Tampilan Ringkas"}</span>
  </button>
  <div className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-surface-subtle border border-border text-xs font-semibold text-text-main">
  <Icon name="heart-pulse" variant="bold" size={14} className="text-primary" />
  <span>Total Pasien: {refugees.length}</span>
  </div>
  <div className="flex items-center gap-1">
  <span className="w-2.5 h-2.5 rounded-full bg-status-danger" title="Merah" />
  <span className="text-xs font-bold text-status-danger mr-1.5">{getPatientsByTriage("RED").length}</span>
  <span className="w-2.5 h-2.5 rounded-full bg-status-warning" title="Kuning" />
  <span className="text-xs font-bold text-status-warning mr-1.5">{getPatientsByTriage("YELLOW").length}</span>
  <span className="w-2.5 h-2.5 rounded-full bg-status-safe" title="Hijau" />
  <span className="text-xs font-bold text-status-safe mr-1.5">{getPatientsByTriage("GREEN").length}</span>
  <span className="w-2.5 h-2.5 rounded-full bg-triage-black" title="Hitam" />
  <span className="text-xs font-bold text-text-muted">{getPatientsByTriage("BLACK").length}</span>
  </div>
  </div>
  </div>

  {/* 4. Grid 4 Kolom Kategori Medis START (High-Contrast Outdoor Board) */}
  {refugees.length === 0 ? (
  <EmptyState
  icon="health"
  title="Belum Ada Pasien Terdaftar"
  description="Belum ada data warga terdaftar di posko ini untuk diperiksa secara medis (START Triage). Silakan lakukan intake warga terlebih dahulu."
  actionLabel="+ Intake Warga Baru"
  actionHref={`/posko/${session.poskoId}/refugees`}
  />
  ) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
  {categories.map((cat) => {
  const patientList = getPatientsByTriage(cat.color);
  return (
  <div
  key={cat.color}
  className="rounded-xl border border-border bg-surface flex flex-col min-h-[280px] md:min-h-[480px] shadow-2xs overflow-hidden"
  >
  {/* Header Kolom */}
  <div className={`p-3 border-b flex items-center justify-between ${cat.headerCls}`}>
  <div className="min-w-0">
  <div className="flex items-center gap-1.5">
  <span className={`w-2.5 h-2.5 rounded-full ${cat.dotCls}`} />
  <span className="text-[10px] font-black uppercase tracking-wider">
  {cat.priorityLabel}
  </span>
  </div>
  <h2 className="text-xs font-bold text-text-main mt-0.5 truncate">
  {cat.title}
  </h2>
  <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
  {cat.desc}
  </p>
  </div>
  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-surface border border-border shadow-2xs text-text-main shrink-0">
  {patientList.length}
  </span>
  </div>

  {/* Daftar Pasien */}
  <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-[460px] md:max-h-[640px]">
  {patientList.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center text-text-subtle space-y-1">
  <Icon name="health" variant="linear" size={24} className="text-border" />
  <p className="text-xs">Tidak ada pasien dalam status ini</p>
  </div>
  ) : (
  <React.Fragment>
  {patientList.slice(0, visibleCounts[cat.color]).map((patient) => (
  <div
  key={patient.id}
  onClick={() => openExam(patient)}
  className={`p-3 rounded-lg border border-border hover:border-primary/60 transition-all bg-surface hover:shadow-xs cursor-pointer group ${isCompact ? "space-y-1" : "space-y-2"}`}
  >
  {/* Header Pasien */}
  <div className="flex items-start justify-between gap-2">
  <div className="min-w-0">
  <span className="font-bold text-xs text-text-main block truncate group-hover:text-primary transition-colors">
  {patient.fullName}
  </span>
  <span className="text-[11px] text-text-muted">
  {patient.gender === "M" ? "Laki-laki" : "Perempuan"} • {patient.age} th
  </span>
  </div>
  <Badge variant={cat.badgeVariant} size="sm">
  {cat.color}
  </Badge>
  </div>

  {!isCompact && (
  <React.Fragment>
  {/* Lokasi & Asal */}
  <p className="text-[11px] text-text-muted truncate">
  <span className="font-semibold text-text-main">{patient.shelterLocation}</span> • Asal {patient.domicileOrigin}
  </p>

  {/* Vulnerability Badges */}
  {patient.vulnerabilities && patient.vulnerabilities.length > 0 && (
  <div className="flex flex-wrap gap-1">
  {patient.vulnerabilities.map((v) => (
  <span
  key={v}
  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-text-muted"
  >
  {v}
  </span>
  ))}
  </div>
  )}
  </React.Fragment>
  )}

  {/* Baris Tombol Aksi Cepat */}
  <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-1">
  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
  {(["RED", "YELLOW", "GREEN", "BLACK"] as TriageCategory[]).map((c) => {
  if (c === cat.color) return null;
  const dotColor =
  c === "RED"
  ? "hover:bg-status-danger hover:text-white"
  : c === "YELLOW"
  ? "hover:bg-status-warning hover:text-white"
  : c === "GREEN"
  ? "hover:bg-status-safe hover:text-white"
  : "hover:bg-triage-black hover:text-white";
  return (
  <button
  key={c}
  type="button"
  disabled={!isAuthorized}
  onClick={(e) => handleQuickTriageChange(patient, c, e)}
  title={`Pindahkan ke status ${c}`}
  className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center transition-colors border border-border cursor-pointer bg-surface ${dotColor}`}
  >
  {c[0]}
  </button>
  );
  })}
  </div>

  <div className="flex items-center gap-1 text-[11px] text-primary font-bold">
  <span>Periksa</span>
  <Icon name="arrow-right" variant="linear" size={12} />
  </div>
  </div>
  </div>
  ))}

  {patientList.length > visibleCounts[cat.color] && (
  <Button
  variant="secondary"
  size="sm"
  className="w-full mt-1 text-xs py-1 h-8"
  onClick={() => setVisibleCounts(prev => ({ ...prev, [cat.color]: prev[cat.color] + 15 }))}
  >
  Tampilkan Lebih ({patientList.length - visibleCounts[cat.color]} lagi)
  </Button>
  )}
  </React.Fragment>
  )}
  </div>
  </div>
  );
  })}
  </div>
  )}

  {/* 5. Modal Form Pemeriksaan Kesehatan & Rekam Medis START */}
  <Dialog
  open={examOpen}
  onOpenChange={setExamOpen}
  title={`Pemeriksaan Klinis & Triase: ${selectedPatient?.fullName || ""}`}
  description="Catat tanda vital, keluhan klinis, penyesuaian triase, dan penerbitan resep obat ke gudang logistik."
  >
  {selectedPatient && (
  <form onSubmit={handleSaveExam} className="space-y-4 pt-1 text-xs">
  {/* Header Profil Pasien */}
  <div className="p-3 rounded-lg bg-surface-subtle border border-border flex items-center justify-between gap-2">
  <div>
  <span className="font-bold text-xs text-text-main block">
  {selectedPatient.fullName} ({selectedPatient.gender === "M" ? "Laki-laki" : "Perempuan"}, {selectedPatient.age} th)
  </span>
  <span className="text-[11px] text-text-muted">
  Lokasi: {selectedPatient.shelterLocation}
  </span>
  </div>
  <Badge
  variant={
  triageColor === "RED"
  ? "triage-red"
  : triageColor === "YELLOW"
  ? "triage-yellow"
  : triageColor === "GREEN"
  ? "triage-green"
  : "triage-black"
  }
  size="md"
  >
  {triageColor}
  </Badge>
  </div>

  {errorMessage && (
  <div className="p-2.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger text-xs font-semibold">
  {errorMessage}
  </div>
  )}

  {/* Skrining Tanda Vital */}
  <div className="space-y-2">
  <label className="font-bold text-text-main block">
  Skrining Tanda Vital (Vital Signs)
  </label>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted block">Suhu Tubuh (°C)</label>
  <Input type="number"
  step="0.1"
  value={temp}
  onChange={(e) => setTemp(e.target.value)}
  placeholder="36.5"
  className="h-10"
  />
  </div>
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted block">Tekanan Darah (TD)</label>
  <div className="flex h-9 w-full items-center rounded-lg border-[1.5px] border-border bg-surface px-1 focus-within:border-border-strong focus-within:ring-2 focus-within:ring-primary hover:border-border-hover transition-colors">
  <input
  type="number"
  value={systolic}
  onChange={(e) => setSystolic(e.target.value)}
  placeholder="120"
  className="w-full bg-transparent text-center text-sm text-text-main outline-none placeholder:text-text-subtle"
  />
  <span className="text-text-subtle font-bold px-0.5">/</span>
  <input
  type="number"
  value={diastolic}
  onChange={(e) => setDiastolic(e.target.value)}
  placeholder="80"
  className="w-full bg-transparent text-center text-sm text-text-main outline-none placeholder:text-text-subtle"
  />
  </div>
  </div>
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted block">Nadi (bpm)</label>
  <Input type="number"
  value={pulse}
  onChange={(e) => setPulse(e.target.value)}
  placeholder="80"
  className="h-10 text-center"
  />
  </div>
  <div className="space-y-1">
  <label className="text-[11px] font-semibold text-text-muted block">SpO2 (%)</label>
  <Input type="number"
  value={spo2}
  onChange={(e) => setSpo2(e.target.value)}
  placeholder="98"
  className="h-10 text-center"
  />
  </div>
  </div>
  </div>

  {/* Keluhan Utama & Diagnosa Klinis */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Keluhan Utama (Chief Complaint)</label>
  <Input value={complaint}
  onChange={(e) => setComplaint(e.target.value)}
  placeholder="Contoh: Demam tinggi 3 hari, batuk, pusing"
  className="h-10"
  />
  </div>
  <div className="space-y-1">
  <label className="font-semibold text-text-main block">Diagnosa Medis Singkat</label>
  <Input value={diagnosis}
  onChange={(e) => setDiagnosis(e.target.value)}
  placeholder="Contoh: ISPA Akut / Hipertensi Primer"
  className="h-10"
  />
  </div>
  </div>

  {/* Pilihan Klasifikasi Triase START 4-Warna */}
  <div className="space-y-1.5">
  <label className="font-bold text-text-main block">Klasifikasi Triase Medis (START)</label>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
  {[
  { id: "RED", label: "Merah (P1 - Kritis)", cls: "text-status-danger border-status-danger-border bg-status-danger-bg" },
  { id: "YELLOW", label: "Kuning (P2 - Mendesak)", cls: "text-status-warning border-status-warning-border bg-status-warning-bg" },
  { id: "GREEN", label: "Hijau (P3 - Ringan)", cls: "text-status-safe border-status-safe-border bg-status-safe-bg" },
  { id: "BLACK", label: "Hitam (P0 - Ekspektan)", cls: "text-text-main border-border bg-surface-muted" },
  ].map((item) => (
  <button
  key={item.id}
  type="button"
  onClick={() => setTriageColor(item.id as TriageCategory)}
  className={`py-2 px-2 rounded-lg font-bold border-[1.5px] transition-all cursor-pointer text-center text-xs ${
  triageColor === item.id
  ? `${item.cls} ring-2 ring-primary/40 font-black shadow-2xs`
  : "bg-surface text-text-muted border-border hover:bg-surface-subtle"
  }`}
  >
  {item.label}
  </button>
  ))}
  </div>
  </div>

  {/* Peresepan Obat uint8 Kamus Bencana (Auto-Ticket Farmasi) */}
  <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-3">
  <div className="flex items-center justify-between">
  <label className="flex items-center gap-2 cursor-pointer select-none">
  <input
  type="checkbox"
  id="prescribe"
  checked={prescribeMedicine}
  onChange={(e) => setPrescribeMedicine(e.target.checked)}
  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
  />
  <span className="font-bold text-xs text-text-main">
  Terbitkan Resep Obat ke Gudang Farmasi (Auto-Ticket)
  </span>
  </label>

  {prescribeMedicine && (
  <Button
  type="button"
  variant="outline"
  size="sm"
  onClick={handleAddPrescriptionItem}
  className="text-xs h-7 px-2"
  >
  <Icon name="add-circle" variant="bold" size={12} className="mr-1" />
  Tambah Obat
  </Button>
  )}
  </div>

  {prescribeMedicine && (
  <div className="space-y-2.5 pt-1">
  {prescriptions.map((rx, idx) => (
  <div
  key={idx}
  className="p-2.5 rounded-lg bg-surface border border-border space-y-2 shadow-2xs"
  >
  <div className="flex items-center justify-between gap-2">
  <span className="text-[11px] font-bold text-text-muted">
  Obat #{idx + 1}
  </span>
  {prescriptions.length > 1 && (
  <button
  type="button"
  onClick={() => handleRemovePrescriptionItem(idx)}
  className="text-status-danger hover:underline text-[11px] font-bold"
  >
  Hapus
  </button>
  )}
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
  {/* Selector Item Medis */}
  <div className="sm:col-span-2 space-y-1">
  <label className="text-[10px] font-semibold text-text-muted block">
  Nama Obat / Kebutuhan Medis
  </label>
  <Select
    value={rx.needTokenId.toString()}
    onChange={(val) => handleUpdatePrescription(idx, "needTokenId", parseInt(val))}
    options={medicalCatalog.map((item) => ({
      value: item.id.toString(),
      label: `[0x${item.id.toString(16).padStart(2, "0")}] ${item.nameId} (${item.nameEn})`,
    }))}
  />
  </div>

  {/* Jumlah & Satuan */}
  <div className="grid grid-cols-2 gap-1.5 space-y-1">
  <div>
  <label className="text-[10px] font-semibold text-text-muted block">
  Jumlah
  </label>
  <Input type="number"
  min="1"
  value={rx.quantity}
  onChange={(e) =>
  handleUpdatePrescription(
  idx,
  "quantity",
  parseInt(e.target.value) || 1
  )
  }
  className="h-10 text-center"
  />
  </div>
  <div>
  <label className="text-[10px] font-semibold text-text-muted block">
  Satuan
  </label>
  <Select value={rx.unit}
  onChange={(val) => handleUpdatePrescription(idx, "unit", val)}
  options={[
    { value: "STRIP", label: "STRIP" },
    { value: "BOTOL", label: "BOTOL" },
    { value: "TUBE", label: "TUBE" },
    { value: "SACHET", label: "SACHET" },
    { value: "TABUNG", label: "TABUNG" },
    { value: "PCS", label: "PCS" }
  ]}
  />
  </div>
  </div>
  </div>

  {/* Dosis */}
  <div className="space-y-1">
  <label className="text-[10px] font-semibold text-text-muted block">
  Aturan Pakai / Dosis Medis
  </label>
  <Input value={rx.dosage}
  onChange={(e) => handleUpdatePrescription(idx, "dosage", e.target.value)}
  placeholder="Contoh: 3x1 tablet sesudah makan"
  className="h-8 text-xs"
  />
  </div>
  </div>
  ))}
  </div>
  )}
  </div>

  {/* Tombol Simpan */}
  <div className="pt-2 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center gap-2">
  <Button
  type="button"
  variant="secondary"
  size="md"
  className="w-full sm:flex-1"
  onClick={() => setExamOpen(false)}
  >
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  size="md"
  disabled={!isAuthorized || isSubmitting}
  className="w-full sm:flex-1 justify-center"
  >
  {isSubmitting
  ? "Menyimpan Rekam..."
  : isAuthorized
  ? "Simpan & Terbitkan Rekam Medis"
  : "Akses Khusus Petugas Medis"}
  </Button>
  </div>
        </form>
      )}
    </Dialog>

    {/* 4. Modal Resolusi Kebutuhan Warga Meninggal (Triase Hitam) */}
    {deceasedTargetPatient && (
      <Dialog
        open={deceasedModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeceasedModalOpen(false);
            setDeceasedTargetPatient(null);
          }
        }}
        title={`Resolusi Kebutuhan Almarhum: ${deceasedTargetPatient.fullName}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Header Alert */}
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center shrink-0">
              <Icon name="alert" variant="bold" size={20} className="text-white" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-white">
                Klasifikasi Triase Hitam (Meninggal Dunia)
              </h4>
              <p className="text-[11px] text-slate-300">
                Pasien <strong>{deceasedTargetPatient.fullName}</strong> ({deceasedTargetPatient.age} thn, {deceasedTargetPatient.shelterLocation}) memiliki tiket kebutuhan aktif yang belum terselesaikan.
              </p>
            </div>
          </div>

          {/* List Active Tickets */}
          <div className="space-y-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-text-muted block">
              Tiket Kebutuhan Aktif Terdeteksi:
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {needsTickets
                .filter(
                  (t) =>
                    (t.refugeeId === deceasedTargetPatient.id ||
                      t.refugeeName.toLowerCase() === deceasedTargetPatient.fullName.toLowerCase()) &&
                    (t.status === "PENDING" || t.status === "ALLOCATED")
                )
                .map((t) => {
                  const isMed = [
                    "obat", "medis", "paracetamol", "amoxicillin", "oralit", "infus",
                    "p3k", "vitamin", "salep", "antibiotik", "antasida", "captopril",
                    "ibuprofen", "dexamethasone", "kasa", "perban", "betadine", "injeksi"
                  ].some((kw) => t.itemName.toLowerCase().includes(kw));

                  return (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-surface-subtle border border-border flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-main">
                            {t.quantity} {t.unit} {t.itemName}
                          </span>
                          <Badge variant={isMed ? "danger" : "warning"} size="sm">
                            {isMed ? "Resep Medis" : "Logistik Umum"}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-text-muted">
                          ID: {t.id} • Status Saat Ini: <strong className="font-semibold text-text-main">{t.status}</strong>
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-text-muted">
                        {isMed ? "Otomatis Batal & Rollback" : "Menunggu Pilihan"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action 1: Resep Medis */}
          <div className="p-3 rounded-xl bg-status-danger-bg border border-status-danger-border space-y-1">
            <span className="font-bold text-status-danger flex items-center gap-1.5 text-xs">
              <Icon name="check" variant="bold" size={14} />
              <span>Resep & Tindakan Medis: Otomatis Dibatalkan</span>
            </span>
            <p className="text-[11px] text-text-muted">
              Sesuai SOP darurat, seluruh resep obat almarhum dibatalkan otomatis dan alokasi obat farmasi yang tertahan dikembalikan ke stok gudang posko.
            </p>
          </div>

          {/* Action 2: Ransum & Logistik Umum */}
          <div className="space-y-2 p-3 rounded-xl bg-surface-subtle border border-border">
            <span className="font-bold text-xs text-text-main block">
              Penanganan Bantuan Non-Medis (Sembako, Selimut, dll.):
            </span>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-surface border border-border cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="radio"
                  name="genAction"
                  value="CANCEL_ALL"
                  checked={generalLogisticsAction === "CANCEL_ALL"}
                  onChange={() => setGeneralLogisticsAction("CANCEL_ALL")}
                  className="mt-0.5 text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-text-main block">
                    Batalkan Semua Tiket & Kembalikan Stok ke Gudang (Rekomendasi)
                  </span>
                  <p className="text-[11px] text-text-muted">
                    Tiket diberi status CANCELLED dan saldo stok gudang fisik bertambah kembali.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-surface border border-border cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="radio"
                  name="genAction"
                  value="TRANSFER_TO_KIN"
                  checked={generalLogisticsAction === "TRANSFER_TO_KIN"}
                  onChange={() => setGeneralLogisticsAction("TRANSFER_TO_KIN")}
                  className="mt-0.5 text-primary focus:ring-primary"
                />
                <div className="space-y-1.5 flex-1">
                  <div>
                    <span className="font-bold text-xs text-text-main block">
                      Alihkan Bantuan Pangan/Sandang ke Kerabat / Wali Tenda
                    </span>
                    <p className="text-[11px] text-text-muted">
                      Tetap salurkan jatah sembako/selimut keluarga kepada kerabat yang masih tinggal di tenda yang sama.
                    </p>
                  </div>

                  {generalLogisticsAction === "TRANSFER_TO_KIN" && (
                    <div className="pt-1">
                      <Input
                        placeholder="Nama Kerabat / Ahli Waris Penerima"
                        value={targetKinName}
                        onChange={(e) => setTargetKinName(e.target.value)}
                        className="h-8 text-xs font-semibold"
                        icon="user"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Action 3: Kebutuhan Pemulasaran Jenazah */}
          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={issueMortuaryKit}
                onChange={(e) => setIssueMortuaryKit(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-text-main block">
                  Terbitkan Tiket Kebutuhan Pemulasaran Jenazah (Kain Kafan / Kantong Jenazah)
                </span>
                <p className="text-[11px] text-text-muted">
                  Otomatis mengirimkan tiket prioritas tinggi ke posko logistik untuk persiapan pemulasaran jenazah.
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setDeceasedModalOpen(false);
                setDeceasedTargetPatient(null);
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              onClick={handleConfirmDeceasedResolution}
              icon="check"
              iconVariant="bold"
            >
              {isSubmitting ? "Menyimpan Resolusi..." : "Konfirmasi Triase Hitam & Terapkan Resolusi"}
            </Button>
          </div>
        </div>
      </Dialog>
    )}
  </div>
  );
}
