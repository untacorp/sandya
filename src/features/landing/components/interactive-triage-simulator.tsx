"use client";

import * as React from "react";
import { Icon } from "@/shared/ui/icon";

type WalkingStatus = "can_walk" | "cannot_walk";
type BreathingStatus = "spontaneous" | "after_airway" | "none";
type RespRateStatus = "normal" | "rapid"; // <= 30 vs > 30
type PerfusionStatus = "normal" | "weak"; // CRT <= 2s / pulse vs CRT > 2s / no pulse
type MentalStatus = "can_follow" | "cannot_follow";

interface TriageResult {
  code: "P1" | "P2" | "P3" | "P0";
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  priorityText: string;
  actionText: string;
  fieldGuidance: string;
}

export function InteractiveTriageSimulator() {
  const [canWalk, setCanWalk] = React.useState<WalkingStatus>("cannot_walk");
  const [breathing, setBreathing] = React.useState<BreathingStatus>("spontaneous");
  const [respRate, setRespRate] = React.useState<RespRateStatus>("normal");
  const [perfusion, setPerfusion] = React.useState<PerfusionStatus>("normal");
  const [mental, setMental] = React.useState<MentalStatus>("can_follow");

  // Kalkulasi START Triage Algorithm secara deterministik
  const triageResult: TriageResult = React.useMemo(() => {
    // 1. Ambulatory?
    if (canWalk === "can_walk") {
      return {
        code: "P3",
        label: "Hijau — Luka Ringan (Minor)",
        colorClass: "text-status-safe",
        bgClass: "bg-status-safe-bg",
        borderClass: "border-status-safe-border",
        priorityText: "Prioritas 3 • Penanganan Tertunda",
        actionText: "Arahkan ke posko evakuasi ringan / observasi mandiri.",
        fieldGuidance: "Korban sadar dan mampu bergerak sendiri menjauhi zona bahaya.",
      };
    }

    // 2. Breathing?
    if (breathing === "none") {
      return {
        code: "P0",
        label: "Hitam — Meninggal / Ekspektan",
        colorClass: "text-text-main",
        bgClass: "bg-surface-muted",
        borderClass: "border-border-strong",
        priorityText: "Prioritas 0 • Tidak Ada Harapan Hidup",
        actionText: "Karantina area, tutup jenazah, prioritaskan korban yang masih bernapas.",
        fieldGuidance: "Tidak bernapas spontan meski jalan napas telah diposisikan secara manual.",
      };
    }

    if (breathing === "after_airway") {
      return {
        code: "P1",
        label: "Merah — Gawat Darurat (Immediate)",
        colorClass: "text-status-danger",
        bgClass: "bg-status-danger-bg",
        borderClass: "border-status-danger-border",
        priorityText: "Prioritas 1 • Penyelamatan Jiwa Segera",
        actionText: "Pasang oropharyngeal airway, kirim ke meja bedah posko darurat sekarang.",
        fieldGuidance: "Napas kembali terbuka hanya setelah reposisi jalan napas darurat.",
      };
    }

    // 3. Respiratory Rate?
    if (respRate === "rapid") {
      return {
        code: "P1",
        label: "Merah — Gawat Darurat (Immediate)",
        colorClass: "text-status-danger",
        bgClass: "bg-status-danger-bg",
        borderClass: "border-status-danger-border",
        priorityText: "Prioritas 1 • Laju Napas Kritis (>30x/menit)",
        actionText: "Beri bantuan oksigenasi masker sungkup dan stabilisasi sirkulasi.",
        fieldGuidance: "Takipnea akut menandakan hipoksia berat, trauma dada, atau syok hemoragik.",
      };
    }

    // 4. Perfusion / Pulse?
    if (perfusion === "weak") {
      return {
        code: "P1",
        label: "Merah — Gawat Darurat (Immediate)",
        colorClass: "text-status-danger",
        bgClass: "bg-status-danger-bg",
        borderClass: "border-status-danger-border",
        priorityText: "Prioritas 1 • Syok Sirkulasi (CRT >2 detik)",
        actionText: "Pasang infus NaCl 2 jalur, kendalikan perdarahan eksternal aktif.",
        fieldGuidance: "Denyut nadi radialis tidak teraba atau pengisian kapiler sangat lambat.",
      };
    }

    // 5. Mental Status?
    if (mental === "cannot_follow") {
      return {
        code: "P1",
        label: "Merah — Gawat Darurat (Immediate)",
        colorClass: "text-status-danger",
        bgClass: "bg-status-danger-bg",
        borderClass: "border-status-danger-border",
        priorityText: "Prioritas 1 • Penurunan Kesadaran Akut",
        actionText: "Cek cedera kepala tertutup, pasang cervical collar, monitoring GCS ketat.",
        fieldGuidance: "Pasien bernapas stabil namun tidak mampu merespons perintah verbal sederhana.",
      };
    }

    // Default jika lolos semua: Kuning P2
    return {
      code: "P2",
      label: "Kuning — Mendesak (Delayed)",
      colorClass: "text-status-warning",
      bgClass: "bg-status-warning-bg",
      borderClass: "border-status-warning-border",
      priorityText: "Prioritas 2 • Butuh Tindakan Lanjutan",
      actionText: "Bebat fraktur tertutup, bersihkan luka dalam, monitor tanda vital tiap 30 menit.",
      fieldGuidance: "Kondisi stabil, sirkulasi dan napas cukup baik, namun tidak mampu berjalan.",
    };
  }, [canWalk, breathing, respRate, perfusion, mental]);

  return (
    <div className="rounded-xl border-[1.5px] border-border bg-surface overflow-hidden shadow-2xs">
      <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-main text-base">
            Simulator Protokol Triase Medis START
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Metode seleksi korban massal internasional di bawah 60 detik per pasien
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-text-muted bg-surface px-2.5 py-1 rounded-md border border-border shrink-0 self-start sm:self-auto">
          Standar Lapangan WHO / BNPB
        </span>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kontrol Parameter Klinis */}
        <div className="lg:col-span-7 space-y-4">
          {/* Langkah 1: Kemampuan Berjalan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-main flex items-center justify-between">
              <span>1. Kemampuan Berjalan Mandiri</span>
              <span className="text-xs font-normal text-text-muted">Instruksi pertama posko</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCanWalk("can_walk")}
                className={`text-left px-3 py-2.5 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                  canWalk === "can_walk"
                    ? "border-primary bg-surface-muted text-text-main font-semibold shadow-xs"
                    : "border-border bg-surface text-text-muted hover:border-border-hover"
                }`}
              >
                Mampu berjalan sendiri
              </button>
              <button
                type="button"
                onClick={() => setCanWalk("cannot_walk")}
                className={`text-left px-3 py-2.5 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                  canWalk === "cannot_walk"
                    ? "border-primary bg-surface-muted text-text-main font-semibold shadow-xs"
                    : "border-border bg-surface text-text-muted hover:border-border-hover"
                }`}
              >
                Tidak dapat berdiri / terbaring
              </button>
            </div>
          </div>

          {/* Langkah 2: Status Pernapasan (Jika tidak bisa jalan) */}
          {canWalk === "cannot_walk" && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                <span>2. Kondisi Pernapasan</span>
                <span className="text-xs font-normal text-text-muted">Cek dada & hembusan napas</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBreathing("spontaneous")}
                  className={`text-left px-3 py-2 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                    breathing === "spontaneous"
                      ? "border-primary bg-surface-muted text-text-main font-semibold"
                      : "border-border bg-surface text-text-muted hover:border-border-hover"
                  }`}
                >
                  Bernapas spontan
                </button>
                <button
                  type="button"
                  onClick={() => setBreathing("after_airway")}
                  className={`text-left px-3 py-2 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                    breathing === "after_airway"
                      ? "border-primary bg-surface-muted text-text-main font-semibold"
                      : "border-border bg-surface text-text-muted hover:border-border-hover"
                  }`}
                >
                  Hanya usai buka airway
                </button>
                <button
                  type="button"
                  onClick={() => setBreathing("none")}
                  className={`text-left px-3 py-2 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                    breathing === "none"
                      ? "border-primary bg-surface-muted text-text-main font-semibold"
                      : "border-border bg-surface text-text-muted hover:border-border-hover"
                  }`}
                >
                  Tidak bernapas sama sekali
                </button>
              </div>
            </div>
          )}

          {/* Langkah 3 & 4 (Laju Napas & Perfusi) */}
          {canWalk === "cannot_walk" && breathing === "spontaneous" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">
                  3. Laju Napas (Frekuensi)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRespRate("normal")}
                    className={`px-2.5 py-2 rounded-lg border-[1.5px] text-xs text-center transition-all ${
                      respRate === "normal"
                        ? "border-primary bg-surface-muted text-text-main font-semibold"
                        : "border-border bg-surface text-text-muted hover:border-border-hover"
                    }`}
                  >
                    10 - 30 x/menit
                  </button>
                  <button
                    type="button"
                    onClick={() => setRespRate("rapid")}
                    className={`px-2.5 py-2 rounded-lg border-[1.5px] text-xs text-center transition-all ${
                      respRate === "rapid"
                        ? "border-primary bg-surface-muted text-text-main font-semibold"
                        : "border-border bg-surface text-text-muted hover:border-border-hover"
                    }`}
                  >
                    &gt; 30 x/menit
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">
                  4. Denyut Nadi Radialis / CRT
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPerfusion("normal")}
                    className={`px-2.5 py-2 rounded-lg border-[1.5px] text-xs text-center transition-all ${
                      perfusion === "normal"
                        ? "border-primary bg-surface-muted text-text-main font-semibold"
                        : "border-border bg-surface text-text-muted hover:border-border-hover"
                    }`}
                  >
                    Teraba kuat (CRT &lt;2dtk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerfusion("weak")}
                    className={`px-2.5 py-2 rounded-lg border-[1.5px] text-xs text-center transition-all ${
                      perfusion === "weak"
                        ? "border-primary bg-surface-muted text-text-main font-semibold"
                        : "border-border bg-surface text-text-muted hover:border-border-hover"
                    }`}
                  >
                    Lemah / CRT &gt;2dtk
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Langkah 5: Status Mental */}
          {canWalk === "cannot_walk" &&
            breathing === "spontaneous" &&
            respRate === "normal" &&
            perfusion === "normal" && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                  <span>5. Respon Perintah Sederhana</span>
                  <span className="text-xs font-normal text-text-muted">Misal: &quot;Buka mata, remas tangan saya&quot;</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMental("can_follow")}
                    className={`text-left px-3 py-2 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                      mental === "can_follow"
                        ? "border-primary bg-surface-muted text-text-main font-semibold"
                        : "border-border bg-surface text-text-muted hover:border-border-hover"
                    }`}
                  >
                    Dapat mengikuti perintah
                  </button>
                  <button
                    type="button"
                    onClick={() => setMental("cannot_follow")}
                    className={`text-left px-3 py-2 rounded-lg border-[1.5px] text-xs font-medium transition-all ${
                      mental === "cannot_follow"
                        ? "border-primary bg-surface-muted text-text-main font-semibold"
                        : "border-border bg-surface text-text-muted hover:border-border-hover"
                    }`}
                  >
                    Tidak merespons / bingung
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Kotak Hasil Penilaian Triase */}
        <div className="lg:col-span-5 bg-surface-subtle rounded-xl border-[1.5px] border-border p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Keputusan Triase Lapangan
            </div>
            
            <div className="mt-3 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border-[1.5px] ${triageResult.bgClass} ${triageResult.colorClass} ${triageResult.borderClass}`}
              >
                {triageResult.code}
              </div>
              <div>
                <h4 className="font-bold text-text-main text-sm sm:text-base leading-tight">
                  {triageResult.label}
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  {triageResult.priorityText}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div>
                <span className="text-xs font-medium text-text-muted block">
                  Kondisi Klinis Terdeteksi:
                </span>
                <p className="text-xs text-text-main mt-0.5 leading-relaxed">
                  {triageResult.fieldGuidance}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-text-muted block">
                  Instruksi Penanganan:
                </span>
                <p className="text-xs text-text-main font-medium mt-0.5 leading-relaxed">
                  {triageResult.actionText}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="shield" variant="linear" size={14} className="text-text-muted" />
              Tercatat permanen di SQLite lokal
            </span>
            <span className="font-mono">Sync BLE Gossip</span>
          </div>
        </div>
      </div>
    </div>
  );
}
