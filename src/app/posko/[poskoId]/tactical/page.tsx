"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { type TacticalChannel } from "@/shared/types";

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

  const [inputMsg, setInputMsg] = React.useState("");
  const [sosModalOpen, setSosModalOpen] = React.useState(false);
  const [hazardType, setHazardType] = React.useState("Gempa Susulan");

  // PTT Recording state
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const channelMessages = messages.filter((m) => m.channel === activeChannel);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendTextMessage(activeChannel, inputMsg.trim());
    setInputMsg("");
  };

  const startPTT = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => {
        if (s >= 5) {
          stopPTT(true);
          return 5;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopPTT = (broadcast = true) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (broadcast) {
      sendVoiceMessage(activeChannel, 4200);
    }
  };

  const handleTriggerSOS = () => {
    triggerSOS(hazardType);
    setSosModalOpen(false);
  };

  const channels: { id: TacticalChannel; label: string; icon: any }[] = [
    { id: "POSKO_ALL", label: "Umum", icon: "chat" },
    { id: "MEDIS", label: "Tim Medis", icon: "health" },
    { id: "LOGISTIK", label: "Tim Logistik", icon: "box" },
    { id: "SOS", label: "Darurat SOS", icon: "sos" },
  ];

  return (
    <div className="space-y-3">
      {/* 1. Baris Pilihan Saluran Obrolan */}
      <div className="p-2.5 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        {/* Pilihan Saluran */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {channels.map((ch) => {
            const isActive = ch.id === activeChannel;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? ch.id === "SOS"
                      ? "bg-status-danger text-text-inverse"
                      : "bg-primary text-primary-foreground font-bold"
                    : "bg-surface-subtle text-text-muted hover:text-text-main border border-border"
                }`}
              >
                <Icon
                  name={ch.icon}
                  variant={isActive ? "bold" : "linear"}
                  size={14}
                />
                <span>#{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Aksi Samping */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/posko/${session.poskoId}/tactical/radar`}>
            <Button variant="secondary" size="sm" icon="radar" iconVariant="bold">
              Petugas di Sekitar ({peers.length})
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setSosModalOpen(true)}
          >
            Peringatan Bahaya
          </Button>
        </div>
      </div>

      {/* 2. Jendela Obrolan Tim Bersih */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col h-[520px] shadow-2xs">
        {/* Header Saluran */}
        <div className="px-4 py-2 bg-surface-subtle border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-main font-semibold">
            <span className="w-2 h-2 rounded-full bg-status-safe" />
            <span>Saluran #{activeChannel.toLowerCase().replace(/_/g, " ")}</span>
          </div>
          <span className="text-[11px] text-text-muted">
            {channelMessages.length} Pesan
          </span>
        </div>

        {/* Feed Pesan */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-canvas/40">
          {channelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1">
              <Icon name="chat" variant="linear" size={24} className="text-text-subtle" />
              <p className="text-xs font-semibold text-text-main">Belum ada pesan di saluran ini</p>
              <p className="text-[11px] text-text-muted">
                Tulis pesan teks atau gunakan pesan suara untuk berkomunikasi dengan tim.
              </p>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isMe = msg.senderName === session.userName || msg.senderPeerId === session.userId;
              const isSOS = msg.channel === "SOS" || msg.isUrgent;

              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg border max-w-lg transition-colors ${
                    isSOS
                      ? "bg-status-danger-bg/50 border-status-danger-border mr-auto"
                      : isMe
                      ? "bg-surface border-primary/30 ml-auto shadow-2xs"
                      : "bg-surface border-border mr-auto shadow-2xs"
                  }`}
                >
                  {/* Info Pengirim */}
                  <div className="flex items-center justify-between gap-3 text-[11px] mb-1 text-text-muted">
                    <span className="font-semibold text-text-main">
                      {msg.senderName} ({msg.senderRole.replace(/_/g, " ")})
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Isi Pesan */}
                  {msg.contentType === "VOICE_NOTE" ? (
                    <div className="flex items-center gap-2.5 py-1 text-xs">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Icon name="microphone" variant="bold" size={14} />
                      </button>
                      <span className="font-medium text-text-main">
                        Pesan Suara (4 detik)
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-text-main leading-relaxed">
                      {msg.textContent}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 3. Baris Input Pesan & Suara */}
        <div className="p-2.5 bg-surface border-t border-border space-y-2">
          {isRecording && (
            <div className="p-2 rounded-lg bg-status-danger-bg border border-status-danger-border flex items-center justify-between text-xs text-status-danger font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-danger animate-ping" />
                Merekam Suara: 00:0{recordingSeconds} / 00:05
              </span>
              <span className="text-[11px]">Lepas tombol untuk mengirim</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Tombol Rekam Suara */}
            <button
              type="button"
              onMouseDown={startPTT}
              onMouseUp={() => stopPTT(true)}
              onTouchStart={startPTT}
              onTouchEnd={() => stopPTT(true)}
              className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer select-none ${
                isRecording
                  ? "bg-status-danger text-text-inverse"
                  : "bg-surface-subtle text-text-main border border-border hover:bg-surface-muted"
              }`}
            >
              <Icon name="microphone" variant="bold" size={16} />
              <span>{isRecording ? "Lepas untuk Kirim" : "Tahan Suara"}</span>
            </button>

            {/* Input Teks */}
            <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2">
              <Input
                placeholder={`Tulis pesan ke #${activeChannel.toLowerCase().replace(/_/g, " ")}...`}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="text-xs"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputMsg.trim()}
              >
                Kirim
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Peringatan Darurat SOS */}
      <Dialog
        open={sosModalOpen}
        onOpenChange={setSosModalOpen}
        title="Peringatan Bahaya Lapangan"
        description="Peringatan ini akan segera disiarkan ke seluruh HP petugas yang berada di area posko."
      >
        <div className="space-y-4 pt-1 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-text-main block">
              Jenis Bahaya / Ancaman
            </label>
            <Input
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              placeholder="misal: Gempa Susulan / Longsor Tebing"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setSosModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1 justify-center"
              onClick={handleTriggerSOS}
            >
              Siarkan Peringatan Bahaya
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
