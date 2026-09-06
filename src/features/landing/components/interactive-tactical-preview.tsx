"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

type RadioChannel = "all" | "medis" | "logistik" | "sos";

interface RadioMessage {
  id: string;
  sender: string;
  role: string;
  channel: RadioChannel;
  text: string;
  time: string;
}

const SAMPLE_MESSAGES: RadioMessage[] = [
  {
    id: "M-01",
    channel: "all",
    sender: "Koordinator Lapangan",
    role: "KOORDINATOR_POSKO",
    text: "Pembaruan: Truk pasokan air PMI tiba di gerbang barat dalam 15 menit.",
    time: "17:10",
  },
  {
    id: "M-02",
    channel: "medis",
    sender: "dr. Siti (Tenda Bedah)",
    role: "PETUGAS_MEDIS",
    text: "Butuh tambahan 2 tabung O2 cadangan untuk pasien observasi P1.",
    time: "17:12",
  },
  {
    id: "M-03",
    channel: "logistik",
    sender: "Gudang Sektor 01",
    role: "PETUGAS_LOGISTIK",
    text: "Surat jalan SJ-2026-088 siap kirim 50 selimut ke Posko Nagrak.",
    time: "17:15",
  },
  {
    id: "M-04",
    channel: "sos",
    sender: "Tim Evakuasi Lereng",
    role: "RELAWAN_LAPANGAN",
    text: "WASPADA: Retakan tanah melebar di lereng barat laut. Siaga evakuasi warga!",
    time: "17:18",
  },
];

export function InteractiveTacticalPreview() {
  const [activeChannel, setActiveChannel] = React.useState<RadioChannel>("all");
  const [isTalking, setIsTalking] = React.useState(false);
  const [sosActive, setSosActive] = React.useState(false);

  const filteredMessages = SAMPLE_MESSAGES.filter(
    (m) => m.channel === activeChannel || m.channel === "sos"
  );

  return (
    <div className="rounded-xl border-[1.5px] border-border bg-surface overflow-hidden shadow-2xs">
      <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-main text-base">
            Simulator Radio Taktis Intercom & Mesh
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Komunikasi suara PTT (Push-to-Talk) 3.2 kbps Opus lewat gelombang Bluetooth tanpa tower BTS
          </p>
        </div>
        <span className="text-xs font-mono text-text-muted bg-surface px-2.5 py-1 rounded-md border border-border shrink-0 self-start sm:self-auto">
          BitChat BLE Gossip Protocol
        </span>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Kontrol Saluran & PTT */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-main">
              Pilih Saluran Komunikasi Radio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "all" as const, label: "#all (Koordinasi Umum)" },
                { id: "medis" as const, label: "#medis (Darurat Medis)" },
                { id: "logistik" as const, label: "#logistik (Gudang & Armada)" },
                { id: "sos" as const, label: "#sos (Peringatan Bahaya)" },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={`px-3 py-2 rounded-lg border-[1.5px] text-xs text-left transition-all ${
                    activeChannel === ch.id
                      ? "border-primary bg-surface-muted text-text-main font-semibold"
                      : "border-border bg-surface text-text-muted hover:border-border-hover hover:text-text-main"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tombol Push-to-Talk (PTT) */}
          <div className="p-4 rounded-xl border border-border bg-surface-subtle text-center space-y-3">
            <div className="text-xs text-text-muted">
              Tekan &amp; Tahan tombol di bawah untuk simulasi bicara:
            </div>

            <button
              type="button"
              onMouseDown={() => setIsTalking(true)}
              onMouseUp={() => setIsTalking(false)}
              onTouchStart={() => setIsTalking(true)}
              onTouchEnd={() => setIsTalking(false)}
              className={`w-full py-3.5 px-4 rounded-xl border-2 font-bold text-sm transition-all select-none flex items-center justify-center gap-2 cursor-pointer ${
                isTalking
                  ? "bg-status-safe text-text-inverse border-status-safe scale-[0.98] shadow-inner"
                  : "bg-primary text-primary-foreground border-primary hover:bg-primary-hover shadow-xs active:scale-[0.98]"
              }`}
            >
              <Icon name="microphone" variant="bold" size={20} />
              <span>{isTalking ? "Mengirim Suara ke Mesh..." : "Tekan untuk Bicara (PTT)"}</span>
            </button>

            {/* Animasi Gelombang Suara Sederhana */}
            <div className="h-6 flex items-center justify-center gap-1">
              {[4, 12, 8, 18, 10, 14, 6, 16, 8, 12, 4].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isTalking ? "bg-status-safe animate-pulse" : "bg-border-strong"
                  }`}
                  style={{ height: isTalking ? `${Math.min(24, h * 1.5)}px` : "4px" }}
                />
              ))}
            </div>
            <div className="text-xs font-mono text-text-muted">
              Kompresi Audio Opus 3.2 kbps • Jangkauan Hop BLE Mesh 15-30m
            </div>
          </div>

          {/* Tombol Sirine Darurat SOS */}
          <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-text-main">
                Sirine Darurat Posko (SOS)
              </h5>
              <p className="text-xs text-text-muted mt-0.5">
                Broadcast peringatan gempa susulan / longsor ke seluruh HP tim
              </p>
            </div>
            <Button
              variant={sosActive ? "danger" : "outline"}
              size="sm"
              className="text-xs shrink-0"
              onClick={() => setSosActive(!sosActive)}
            >
              {sosActive ? "Matikan Sirine" : "Uji Sinyal SOS"}
            </Button>
          </div>
        </div>

        {/* Panel Log Pesan Lapangan */}
        <div className="lg:col-span-6 bg-surface-subtle rounded-xl border-[1.5px] border-border p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-main">
                Pesan Radio #{activeChannel}
              </span>
              <span className="text-xs font-mono text-status-safe">
                3 Peer Terhubung (0 Hop)
              </span>
            </div>

            <div className="space-y-2">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg border text-xs ${
                    msg.channel === "sos"
                      ? "bg-status-danger-bg border-status-danger-border text-status-danger font-medium"
                      : "bg-surface border-border text-text-main"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                    <span className="font-semibold">{msg.sender}</span>
                    <span className="font-mono text-xs">{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-text-muted flex items-center justify-between">
            <span>Enkripsi Noise Protocol XX</span>
            <span className="font-mono">Zero Server Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
