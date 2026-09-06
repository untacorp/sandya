"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useMeshSync } from "@/features/posko/hooks/use-mesh-sync";
import { meshRuntime } from "@/core/mesh/mesh-runtime";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { type TacticalChannel, type TacticalMessage } from "@/shared/types";
import { TIME_CONSTANTS } from "@/core/shared/constants";
import { useTacticalChatSync } from "@/features/posko/hooks/use-tactical-chat-sync";
import { useAudioRecorder } from "@/features/posko/hooks/use-audio-recorder";
import { getRoleBadgeLabel } from "@/features/auth/utils/role-routing";

export const TACTICAL_PAGE_CONSTANTS = {
  MAX_RECORDING_SECONDS: 5,
  TIMER_INTERVAL_MS: 1000,
  DEFAULT_VOICE_DURATION_MS: 4000,
  MIN_WAVEFORM_HEIGHT_PERCENT: 20,
  PERCENT_BASE: 100,
  DEFAULT_WAVEFORM: [30, 45, 80, 95, 60, 40, 75, 90, 35, 20] as const,
  RSSI_VERY_CLOSE_THRESHOLD: -50,
  RSSI_CLOSE_THRESHOLD: -70,
  RSSI_MEDIUM_THRESHOLD: -85,
  DIRECT_HOP_COUNT: 1,
} as const;

function playSirenSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.7);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.4);
  } catch {
    // Audio synthesis fallback
  }
}

function playRadioTone(durationMs: number, onEnd: () => void) {
  if (typeof window === "undefined") {
    onEnd();
    return;
  }
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      setTimeout(onEnd, durationMs);
      return;
    }
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = onEnd;
  } catch {
    setTimeout(onEnd, durationMs);
  }
}

export default function TacticalChatPage() {
  const {
    session,
    activeChannel,
    setActiveChannel,
    messages,
    sendTextMessage,
    sendVoiceMessage,
    triggerSOS,
    peers,
  } = usePoskoStore();

  const { meshRadioStatus, isMeshActive, setIsMeshActive } = useMeshSync();
  const { isRefreshing, refreshNow } = useTacticalChatSync(session.poskoId);

  const {
    isRecording,
    recordingSeconds,
    hasPermissionError,
    currentWaveform,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const [inputMsg, setInputMsg] = React.useState("");
  const [sosModalOpen, setSosModalOpen] = React.useState(false);
  const [hazardType, setHazardType] = React.useState("Gempa Bumi Susulan");
  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null);

  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);

  const channelMessages = messages.filter((m) => m.channel === activeChannel);

  const getProximityStatus = (rssi: number, hops: number) => {
    if (rssi >= TACTICAL_PAGE_CONSTANTS.RSSI_VERY_CLOSE_THRESHOLD) {
      return {
        label: "Sangat Dekat (< 15m)",
        color: "text-status-safe",
        bgBadge: "bg-status-safe-bg text-status-safe border-status-safe-border",
        dot: "bg-status-safe",
        hopDesc: "Koneksi Langsung (1 Hop)",
      };
    }
    if (rssi >= TACTICAL_PAGE_CONSTANTS.RSSI_CLOSE_THRESHOLD) {
      return {
        label: "Dekat (15-50m)",
        color: "text-status-safe",
        bgBadge: "bg-status-safe-bg text-status-safe border-status-safe-border",
        dot: "bg-status-safe",
        hopDesc: hops === TACTICAL_PAGE_CONSTANTS.DIRECT_HOP_COUNT ? "Koneksi Langsung (1 Hop)" : `Relay Mesh (${hops} Hops)`,
      };
    }
    if (rssi >= TACTICAL_PAGE_CONSTANTS.RSSI_MEDIUM_THRESHOLD) {
      return {
        label: "Jarak Sedang",
        color: "text-status-warning",
        bgBadge: "bg-status-warning-bg text-status-warning border-status-warning-border",
        dot: "bg-status-warning",
        hopDesc: `Relay Mesh (${hops} Hops)`,
      };
    }
    return {
      label: "Jarak Jauh / Sinyal Lemah",
      color: "text-status-danger",
      bgBadge: "bg-status-danger-bg text-status-danger border-status-danger-border",
      dot: "bg-status-danger",
      hopDesc: `Relay Mesh (${hops} Hops)`,
    };
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const trimmed = inputMsg.trim();
    sendTextMessage(activeChannel, trimmed);
    meshRuntime.sendTextMessage(activeChannel, trimmed).catch(() => {
      // Graceful offline mesh handling
    });
    setInputMsg("");
  };

  const handleSendQuickChip = (text: string) => {
    sendTextMessage(activeChannel, text);
    meshRuntime.sendTextMessage(activeChannel, text).catch(() => {
      // Graceful offline mesh handling
    });
  };

  const startPTT = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    await startRecording();
  };

  const stopPTT = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    const result = await stopRecording();
    if (result && result.durationMs >= 300) {
      sendVoiceMessage(activeChannel, result.durationMs, result.audioBase64, result.waveform);
      // Also broadcast over BLE mesh runtime
      const sampleBytes = Buffer.alloc(Math.min(300, Math.floor(result.durationMs / 50)), 140);
      meshRuntime.sendVoiceNote(activeChannel, result.durationMs, sampleBytes).catch(() => {
        // Graceful offline mesh handling
      });
    }
  };

  const handleCancelPTT = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    cancelRecording();
  };

  const handlePlayVoice = (msg: TacticalMessage) => {
    if (playingVoiceId === msg.id) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setPlayingVoiceId(msg.id);

    if (msg.audioBase64) {
      const audio = new Audio(msg.audioBase64);
      audioElementRef.current = audio;
      audio.onended = () => {
        setPlayingVoiceId(null);
        audioElementRef.current = null;
      };
      audio.onerror = () => {
        setPlayingVoiceId(null);
        audioElementRef.current = null;
      };
      audio.play().catch(() => {
        setPlayingVoiceId(null);
      });
    } else {
      playRadioTone(msg.audioDurationMs || 3000, () => setPlayingVoiceId(null));
    }
  };

  const handleTriggerSOS = () => {
    playSirenSound();
    triggerSOS(hazardType);
    meshRuntime.triggerSOS(hazardType).catch(() => {
      // Graceful offline mesh handling
    });
    setSosModalOpen(false);
  };

  const handleCancelSOS = () => {
    sendTextMessage("SOS", "ALARM DARURAT DIBATALKAN: Situasi telah terkendali oleh Koordinator Posko.", false);
  };

  const channels: { id: TacticalChannel; label: string; icon: SolarIconName; desc: string }[] = [
    { id: "POSKO_ALL", label: "Umum (#posko-all)", icon: "chat", desc: "Koordinasi umum posko" },
    { id: "MEDIS", label: "Tim Medis (#medis)", icon: "health", desc: "Triase & resep obat darurat" },
    { id: "LOGISTIK", label: "Tim Logistik (#logistik)", icon: "box", desc: "Stok gudang & armada kirim" },
    { id: "SOS", label: "Darurat (#sos)", icon: "sos", desc: "Sirene evakuasi & peringatan" },
  ];

  const quickChips = [
  "Butuh Tambahan Tim Medis Segera",
  "Stok Tabung Oksigen Menipis",
  "Truk Logistik Tiba di Gerbang",
  "Dapur Umum Siap Distribusi Konsumsi",
  "Evakuasi Tenda Selesai Terkendali",
  ];

  const isCoordinator =
  session.userRole === "KOORDINATOR_POSKO" ||
  session.userRole === "KOMANDAN_MISI" ||
  session.userRole === "PEMIMPIN_ORGANISASI";

  return (
  <div className="space-y-3">
  {/* Fallback Banner if BLE is Off / Unavailable */}
  {(meshRadioStatus === "RADIO_OFF" || meshRadioStatus === "UNAVAILABLE") && (
    <div className="space-y-2">
      <AlertBanner
        variant="warning"
        title="Modul Bluetooth Rendah Energi (BLE) Dinonaktifkan"
        description="Siaran radio dan transmisi suara PTT antar-perangkat nirkabel tidak dapat dipancarkan saat Bluetooth mati. Aktifkan Bluetooth atau gunakan sinkronisasi visual."
        icon="shield"
      />
      <div className="flex flex-wrap gap-2">
        <Link href={`/posko/${session.poskoId}/sync/animated-qr`}>
          <Button variant="secondary" size="sm" className="text-xs font-bold">
            <Icon name="qr-code" variant="bold" size={14} className="mr-1.5" />
            Buka Sinkronisasi Animated QR
          </Button>
        </Link>
        <Link href={`/posko/${session.poskoId}/sync/poster`}>
          <Button variant="secondary" size="sm" className="text-xs font-bold">
            <Icon name="printer" variant="bold" size={14} className="mr-1.5" />
            Buka Poster Paritas Cetak
          </Button>
        </Link>
      </div>
    </div>
  )}

  {/* 1. Baris Pilihan Saluran Radio Lapangan */}
  <div className="p-2.5 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
  {/* Pilihan 4 Saluran */}
  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
  {channels.map((ch) => {
  const isActive = ch.id === activeChannel;
  return (
  <button
  key={ch.id}
  type="button"
  onClick={() => setActiveChannel(ch.id)}
  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-[1.5px] ${
  isActive
  ? ch.id === "SOS"
  ? "bg-status-danger text-text-inverse border-status-danger shadow-xs"
  : "bg-primary text-primary-foreground border-primary shadow-xs"
  : "bg-surface text-text-muted hover:text-text-main border-border hover:bg-surface-subtle"
  }`}
  >
  <Icon
  name={ch.icon}
  variant={isActive ? "bold" : "linear"}
  size={14}
  />
  <span>{ch.label}</span>
  </button>
  );
  })}
  </div>

  {/* Tombol Radio BLE & Peringatan Bahaya SOS */}
  <div className="flex items-center gap-2 shrink-0">
  <button
    type="button"
    onClick={() => setIsMeshActive(!isMeshActive)}
    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-colors cursor-pointer"
  >
    Radio: <span className={isMeshActive ? "text-status-safe font-bold" : "text-status-danger font-bold"}>{isMeshActive ? "ON" : "OFF"}</span>
  </button>
  <Button
  variant="danger"
  size="sm"
  onClick={() => setSosModalOpen(true)}
  className="text-xs font-bold"
  >
  <Icon name="sos" variant="bold" size={14} className="mr-1" />
  Peringatan Bahaya SOS
  </Button>
  </div>
  </div>

  {/* 2. Tata Letak 2-Kolom: Obrolan Taktis (Kiri) + Petugas Aktif di Sekitar (Kanan) */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  {/* Kolom Utama: Obrolan & Transmisi Suara PTT (Col 1-2) */}
  <div className="lg:col-span-2 rounded-xl border border-border bg-surface overflow-hidden flex flex-col h-[460px] sm:h-[520px] lg:h-[580px] shadow-2xs">
  {/* Header Saluran Obrolan */}
  <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between text-xs">
  <div className="flex items-center gap-2">
  <span className={`w-2.5 h-2.5 rounded-full ${activeChannel === "SOS" ? "bg-status-danger animate-pulse" : "bg-status-safe"}`} />
  <span className="font-bold text-text-main">
  Saluran #{activeChannel.toLowerCase().replace(/_/g, " ")}
  </span>
  <span className="text-[11px] text-text-muted">
  • {channels.find((c) => c.id === activeChannel)?.desc}
  </span>
  </div>
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-text-muted">
        {channelMessages.length} Pesan Lapangan
      </span>
      <button
        type="button"
        onClick={refreshNow}
        disabled={isRefreshing}
        className="p-1 text-text-muted hover:text-text-main transition-colors rounded hover:bg-surface cursor-pointer"
        title="Perbarui transmisi obrolan"
      >
        <Icon name="sync" variant="bold" size={12} className={isRefreshing ? "animate-spin text-primary" : ""} />
      </button>
    </div>
  </div>

  {/* Banner SOS jika di Saluran SOS */}
  {activeChannel === "SOS" && (
  <div className="p-2.5 bg-status-danger-bg border-b border-status-danger-border flex items-center justify-between gap-2 text-xs">
  <div className="flex items-center gap-2 text-status-danger font-bold">
  <Icon name="sos" variant="bold" size={16} />
  <span>Saluran Peringatan Evakuasi & Bahaya Lapangan</span>
  </div>
  {isCoordinator && (
  <Button
  variant="outline"
  size="sm"
  onClick={handleCancelSOS}
  className="text-xs h-7 px-2 border-status-danger-border text-status-danger hover:bg-status-danger hover:text-white"
  >
  Batalkan Alarm
  </Button>
  )}
  </div>
  )}

  {/* Feed Pesan Obrolan & Audio PTT */}
  <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-canvas/40">
  {channelMessages.length === 0 ? (
  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1">
  <Icon name="chat" variant="linear" size={28} className="text-text-subtle" />
  <p className="text-xs font-bold text-text-main">Belum ada transmisi di saluran ini</p>
  <p className="text-[11px] text-text-muted max-w-xs">
  Tekan dan tahan tombol mikrofon untuk bicara suara PTT, atau ketik instruksi teks untuk disiarkan ke posko.
  </p>
  </div>
  ) : (
  channelMessages.map((msg) => {
  const isMe = msg.senderName === session.userName || msg.senderPeerId === session.userId;
  const isSOS = msg.channel === "SOS" || msg.isUrgent;
  const isVoice = msg.contentType === "VOICE_NOTE";
  const isPlaying = playingVoiceId === msg.id;

  return (
  <div
  key={msg.id}
  className={`p-3 rounded-xl border max-w-md transition-all shadow-2xs ${
  isSOS
  ? "bg-status-danger-bg/40 border-status-danger-border mr-auto"
  : isMe
  ? "bg-surface border-primary/40 ml-auto"
  : "bg-surface border-border mr-auto"
  }`}
  >
  {/* Header Pengirim */}
  <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5 text-text-muted">
  <div className="flex items-center gap-1.5">
  <span className="font-bold text-text-main">
  {msg.senderName}
  </span>
  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-subtle border border-border font-semibold">
  {getRoleBadgeLabel(msg.senderRole)}
  </span>
  </div>
  <span className="font-mono text-[10px]">
  {new Date(msg.createdAt).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  })}
  </span>
  </div>

  {/* Isi Pesan: Suara PTT vs Teks */}
  {isVoice ? (
  <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-2">
  <div className="flex items-center justify-between gap-2">
  <button
  type="button"
  onClick={() => handlePlayVoice(msg)}
  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
  >
  <Icon
  name={isPlaying ? "close" : "microphone"}
  variant="bold"
  size={14}
  />
  </button>

  {/* Waveform Visualizer */}
  <div className="flex-1 flex items-center gap-0.5 h-6 px-1">
  {(msg.audioWaveform || TACTICAL_PAGE_CONSTANTS.DEFAULT_WAVEFORM).map((bar, i) => (
  <div
  key={i}
  className={`flex-1 rounded-full transition-all ${
  isPlaying ? "bg-primary animate-pulse" : "bg-text-muted/40"
  }`}
  style={{ height: `${Math.max(TACTICAL_PAGE_CONSTANTS.MIN_WAVEFORM_HEIGHT_PERCENT, (bar / TACTICAL_PAGE_CONSTANTS.PERCENT_BASE) * TACTICAL_PAGE_CONSTANTS.PERCENT_BASE)}%` }}
  />
  ))}
  </div>

  <span className="text-[11px] font-mono font-bold text-text-muted shrink-0">
  {isPlaying ? "Memutar..." : `${Math.round((msg.audioDurationMs || TACTICAL_PAGE_CONSTANTS.DEFAULT_VOICE_DURATION_MS) / TIME_CONSTANTS.MS_PER_SECOND)}s`}
  </span>
  </div>
  <p className="text-[10px] text-text-muted italic">
  Transmisi Suara PTT (Opus 3.2 kbps)
  </p>
  </div>
  ) : (
  <p className={`text-xs leading-relaxed font-medium ${isSOS ? "text-status-danger font-bold" : "text-text-main"}`}>
  {msg.textContent}
  </p>
  )}
  </div>
  );
  })
  )}
  </div>

  {/* Quick Chips Bar */}
  <div className="px-3 py-1.5 bg-surface-subtle border-t border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar">
  <span className="text-[10px] font-bold text-text-muted shrink-0">Pesan Cepat:</span>
  {quickChips.map((chip, idx) => (
  <button
  key={idx}
  type="button"
  onClick={() => handleSendQuickChip(chip)}
  className="text-[10px] font-semibold px-2 py-1 rounded bg-surface border border-border hover:border-primary/50 text-text-main whitespace-nowrap transition-colors"
  >
  {chip}
  </button>
  ))}
  </div>

  {/* Input Bar & Tombol PTT */}
  <div className="p-2.5 bg-surface border-t border-border space-y-2">
  {hasPermissionError && (
  <div className="p-2 rounded-lg bg-status-danger-bg border border-status-danger-border text-xs text-status-danger flex items-center justify-between">
  <span>Izin mikrofon diperlukan untuk merekam suara Push-to-Talk.</span>
  </div>
  )}

  {isRecording && (
  <div className="p-2.5 rounded-lg bg-status-danger-bg border border-status-danger-border flex items-center justify-between text-xs text-status-danger font-bold">
  <div className="flex items-center gap-2">
  <span className="w-2.5 h-2.5 rounded-full bg-status-danger animate-ping" />
  <span>Merekam: 00:0{recordingSeconds} / 00:0{TACTICAL_PAGE_CONSTANTS.MAX_RECORDING_SECONDS} detik</span>
  </div>
  <div className="flex items-center gap-1 h-4">
  {currentWaveform.map((bar, i) => (
  <div
  key={i}
  className="w-1 bg-status-danger rounded-full transition-all duration-75"
  style={{ height: `${Math.max(20, bar)}%` }}
  />
  ))}
  </div>
  <span className="text-[11px] font-normal">Lepas untuk memancarkan</span>
  </div>
  )}

  <div className="flex items-center gap-2">
  {/* Tombol Push-to-Talk (PTT) */}
  <button
    type="button"
    onMouseDown={startPTT}
    onMouseUp={stopPTT}
    onMouseLeave={handleCancelPTT}
    onTouchStart={startPTT}
    onTouchEnd={stopPTT}
    className={`h-10 px-2.5 sm:px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer select-none border-[1.5px] ${
      isRecording
        ? "bg-status-danger text-text-inverse border-status-danger ring-2 ring-status-danger/40 scale-105"
        : "bg-surface-subtle text-text-main border-border hover:bg-surface-muted active:scale-95"
    }`}
    title="Tekan dan tahan untuk bicara (Push-to-Talk)"
  >
    <Icon name="microphone" variant="bold" size={16} />
    <span className="hidden sm:inline">{isRecording ? "Lepas untuk Kirim" : "Tahan Suara (PTT)"}</span>
    <span className="inline sm:hidden">{isRecording ? "Lepas" : "PTT"}</span>
  </button>

  {/* Input Teks Biasa */}
  <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2 min-w-0">
  <Input placeholder={`Ketik pesan ke #${activeChannel.toLowerCase().replace(/_/g, " ")}...`}
  value={inputMsg}
  onChange={(e) => setInputMsg(e.target.value)}
  className="text-base sm:text-xs h-10 flex-1 min-w-0"
  />
  <Button
  type="submit"
  variant="primary"
  size="md"
  disabled={!inputMsg.trim()}
  className="h-10 px-3 sm:px-4 font-bold shrink-0"
  >
  Kirim
  </Button>
  </form>
  </div>
  </div>
  </div>

  {/* Kolom Samping: Petugas Aktif di Sekitar Posko (Col 3) */}
  <div className="rounded-xl border border-border bg-surface flex flex-col h-[360px] sm:h-[420px] lg:h-[580px] shadow-2xs overflow-hidden">
  {/* Header Panel Rekan Tim */}
  <div className="p-3 bg-surface-subtle border-b border-border flex items-center justify-between">
  <div className="flex items-center gap-2">
  <span className="w-2.5 h-2.5 rounded-full bg-status-safe animate-pulse" />
  <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
  Petugas di Sekitar
  </h3>
  </div>
  <span className="text-xs font-bold text-text-muted px-2 py-0.5 rounded-md bg-surface border border-border shadow-2xs">
  {peers.length} Online
  </span>
  </div>

  {/* Daftar Rekan Tim Terhubung */}
  <div className="p-2.5 flex-1 space-y-2 overflow-y-auto">
  {/* Profil Diri Sendiri */}
  <div className="p-2.5 rounded-lg bg-surface-subtle border border-primary/40 space-y-1">
  <div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-1.5">
  <span className="w-2 h-2 rounded-full bg-primary" />
  <span className="font-bold text-xs text-text-main">
  {session.userName} (Perangkat Anda)
  </span>
  </div>
  <Badge variant="primary" size="sm">
  {getRoleBadgeLabel(session.userRole)}
  </Badge>
  </div>
  </div>

  <div className="pt-1">
  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1 block mb-1.5">
  Rekan Tim Jaring Radio:
  </span>

  {peers.length === 0 ? (
  <div className="p-6 text-center text-xs text-text-subtle border border-dashed border-border rounded-lg">
  Tidak ada rekan tim terdeteksi di sekitar
  </div>
  ) : (
  peers.map((peer) => {
  const proximity = getProximityStatus(peer.rssi, peer.hops);
  return (
  <Card key={peer.peerId} className="p-3 space-y-2 border-border bg-surface shadow-2xs">
  <div className="flex items-start justify-between gap-2">
  <div className="min-w-0">
  <h4 className="font-bold text-xs text-text-main truncate">
  {peer.aliasName}
  </h4>
  <span className="text-[11px] font-semibold text-text-muted block">
  {getRoleBadgeLabel(peer.role)}
  </span>
  </div>
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${proximity.bgBadge} shrink-0`}>
  {proximity.label}
  </span>
  </div>

  <div className="pt-1.5 border-t border-border/80 flex items-center justify-between text-[11px] text-text-muted">
  <span className="flex items-center gap-1">
  <span className={`w-1.5 h-1.5 rounded-full ${proximity.dot}`} />
  {proximity.hopDesc}
  </span>
  <span className="font-mono text-[10px]">
  {peer.currentPosId || session.poskoName || (session.poskoId ? `Posko ${session.poskoId}` : "Simpul Mesh")}
  </span>
  </div>
  </Card>
  );
  })
  )}
  </div>
  </div>
  </div>
  </div>

  {/* 3. Modal Peringatan Bahaya Darurat SOS */}
  <Dialog
  open={sosModalOpen}
  onOpenChange={setSosModalOpen}
  title="Peringatan Bahaya Darurat (SOS)"
  description="Siarkan sirene darurat dan notifikasi getar ke seluruh perangkat petugas posko untuk evakuasi cepat."
  >
  <div className="space-y-4 pt-1 text-xs">
  <AlertBanner
  variant="danger"
  title="Peringatan Tingkat Tinggi"
  description="Sirene akan langsung berbunyi di seluruh HP relawan dalam jangkauan posko. Gunakan hanya saat ancaman keselamatan jiwa terdeteksi."
  icon="sos"
  />

  <div className="space-y-1.5">
  <label className="font-bold text-text-main block">
  Pilih Jenis Ancaman Bahaya (Standar BNPB)
  </label>
  <div className="grid grid-cols-2 gap-2">
  {[
  "Gempa Bumi Susulan",
  "Banjir Bandang",
  "Longsor Tebing",
  "Kebakaran Area Tenda",
  "Angin Puting Beliung",
  "Evakuasi Darurat SAR",
  ].map((hazard) => (
  <button
  key={hazard}
  type="button"
  onClick={() => setHazardType(hazard)}
  className={`p-2.5 rounded-lg border text-left font-bold transition-all cursor-pointer text-xs ${
  hazardType === hazard
  ? "bg-status-danger-bg border-status-danger text-status-danger ring-2 ring-status-danger/30"
  : "bg-surface border-border text-text-muted hover:bg-surface-subtle"
  }`}
  >
  {hazard}
  </button>
  ))}
  </div>
  </div>

  <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
  <Button
  type="button"
  variant="secondary"
  size="md"
  className="w-full sm:flex-1"
  onClick={() => setSosModalOpen(false)}
  >
  Batal
  </Button>
  <Button
  type="button"
  variant="danger"
  size="md"
  className="w-full sm:flex-1 justify-center font-bold"
  onClick={handleTriggerSOS}
  >
  <Icon name="sos" variant="bold" size={16} className="mr-1.5" />
  Siarkan Peringatan Darurat
  </Button>
  </div>
  </div>
  </Dialog>
  </div>
  );
}
