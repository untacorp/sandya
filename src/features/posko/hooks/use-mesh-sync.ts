"use client";

import * as React from "react";
import { usePoskoStore } from "../store/use-posko-store";
import { type MeshPeer, type TacticalMessage } from "@/shared/types";
import { SmpPacketCodec, SmpPacketType, SmpPacket } from "@/core/mesh/smp-packet";
import { LruSeenCache } from "@/core/mesh/seen-cache";
import { VectorClockTracker } from "@/core/mesh/vector-clock";
import { IngestMeshPacketUseCase } from "@/core/use-cases/sync/ingest-mesh-packet.usecase";
import { packManifestV4 } from "@/core/codecs/bitpacker-v4";

export type MeshRadioStatus = "CONNECTED" | "SCANNING" | "BLUETOOTH_OFF" | "PERMISSION_DENIED" | "IDLE" | "RADIO_OFF" | "UNAVAILABLE";

export const MESH_SYNC_CONSTANTS = {
  CHANNEL_NAME: "sandya_mesh_transport_v1",
  BEACON_INTERVAL_MS: 8000,
  GOSSIP_INTERVAL_MS: 15000,
  PEER_HEARTBEAT_TIMEOUT_MS: 30000,
} as const;

// Singleton cache & tracker for the local browser instance
const localSeenCache = new LruSeenCache(2048);
const localVectorTracker = new VectorClockTracker();
const ingestUseCase = new IngestMeshPacketUseCase(localSeenCache, localVectorTracker);

export function useMeshSync() {
  const {
    session,
    peers,
    pendingOutboxCount,
    refugees,
    messages,
    importRefugeeBatch,
    importMessagesBatch,
    simulateSync,
    refreshActivePeers,
  } = usePoskoStore();

  const [isMeshActive, setIsMeshActive] = React.useState(true);
  const [meshRadioStatus, setMeshRadioStatus] = React.useState<MeshRadioStatus>("CONNECTED");
  const [lastGossipTimestamp, setLastGossipTimestamp] = React.useState<number>(Date.now());
  const [livePeers, setLivePeers] = React.useState<MeshPeer[]>([]);

  const channelRef = React.useRef<BroadcastChannel | null>(null);
  const sequenceRef = React.useRef<number>(1);

  // Initialize BroadcastChannel transport
  React.useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    try {
      const channel = new BroadcastChannel(MESH_SYNC_CONSTANTS.CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = async (event: MessageEvent<string>) => {
        if (!isMeshActive || meshRadioStatus === "BLUETOOTH_OFF" || meshRadioStatus === "PERMISSION_DENIED") {
          return;
        }

        try {
          const rawBuffer = Buffer.from(event.data, "base64");
          const result = await ingestUseCase.execute({ rawBuffer });

          if (result.ok) {
            const data = result.value;

            // 1. Live Beacon Presence
            if (data.status === "BEACON_RECORDED" && data.discoveredPeer) {
              const peer = data.discoveredPeer;
              setLivePeers((prev) => {
                const filtered = prev.filter((p) => p.peerId !== peer.peerId);
                return [peer, ...filtered];
              });
            }

            // 2. Incoming Tactical Message
            if (data.tacticalMessage && data.tacticalMessage.textContent) {
              const incomingMsg: TacticalMessage = {
                id: data.tacticalMessage.id || `MSG-${Date.now()}`,
                channel: data.tacticalMessage.channel || "POSKO_ALL",
                senderPeerId: data.senderPeerId,
                senderName: data.tacticalMessage.senderName || `Node ${data.senderPeerId.slice(0, 4)}`,
                senderRole: "RELAWAN_LAPANGAN",
                contentType: data.tacticalMessage.contentType || "TEXT",
                textContent: data.tacticalMessage.textContent,
                createdAt: data.tacticalMessage.createdAt || Date.now(),
                isUrgent: data.tacticalMessage.isUrgent,
              };
              importMessagesBatch([incomingMsg]);
            }
          }
        } catch {
          // Ignored non-mesh or malformed transport payload
        }
      };

      return () => {
        channel.close();
        channelRef.current = null;
      };
    } catch {
      // BroadcastChannel unavailable in restricted iframe
    }
  }, [isMeshActive, meshRadioStatus, importMessagesBatch]);

  // Periodic Compact Presence Beacon Broadcast (16 Bytes)
  React.useEffect(() => {
    if (!isMeshActive || meshRadioStatus === "BLUETOOTH_OFF" || meshRadioStatus === "PERMISSION_DENIED") return;

    const beaconInterval = setInterval(() => {
      if (!channelRef.current) return;

      const senderId = (session.userId || session.poskoId || "0").replace(/[^a-fA-F0-9]/g, "").padStart(16, "0").slice(0, 16);
      const beaconBuf = SmpPacketCodec.encodeBeacon({
        version: 0x02,
        packetType: SmpPacketType.PRESENCE_BEACON,
        sequence: sequenceRef.current++,
        timestamp: Math.floor(Date.now() / 1000),
        senderPeerId: senderId,
      });

      channelRef.current.postMessage(beaconBuf.toString("base64"));
    }, MESH_SYNC_CONSTANTS.BEACON_INTERVAL_MS);

    return () => clearInterval(beaconInterval);
  }, [isMeshActive, meshRadioStatus, session.userId]);

  // Periodic Outbox Gossip across Mesh Channel
  React.useEffect(() => {
    if (!isMeshActive || meshRadioStatus === "BLUETOOTH_OFF" || meshRadioStatus === "PERMISSION_DENIED") return;

    const gossipInterval = setInterval(() => {
      setLastGossipTimestamp(Date.now());

      if (pendingOutboxCount > 0 && channelRef.current && refugees.length > 0) {
        setMeshRadioStatus("SCANNING");

        try {
          const manifestBuf = packManifestV4({
            poskoName: session.poskoName || session.poskoId,
            defaultRegionCode: "320101",
            timestamp: Math.floor(Date.now() / 1000),
            persons: refugees.slice(0, 10).map((r) => {
              // Konversi VulnerabilityCategory[] → bitmask uint8
              const vulnBitMap: Record<string, number> = {
                BALITA: 0x01, IBU_HAMIL: 0x02, LANSIA: 0x04,
                DISABILITAS: 0x08, LUKA_BERAT: 0x10, PENYAKIT_KRONIS: 0x20,
              };
              const vulnMask = (r.vulnerabilities || []).reduce(
                (mask, v) => mask | (vulnBitMap[v] || 0), 0
              );

              return {
                fullName: r.fullName,
                gender: r.gender,
                age: r.age,
                nationalId: r.nik ?? undefined,
                domicileOrigin: r.domicileOrigin,
                shelterLocation: r.shelterLocation,
                urgentNeeds: [] as number[],
                vulnerabilities: vulnMask,
              };
            }),
          });

          const senderId = (session.userId || session.poskoId || "0").replace(/[^a-fA-F0-9]/g, "").padStart(16, "0").slice(0, 16);
          const deltaPacket: SmpPacket = {
            version: 0x02,
            packetType: SmpPacketType.SYNC_DELTA_BATCH,
            ttl: 7,
            flags: 0,
            timestamp: Math.floor(Date.now() / 1000),
            senderPeerId: senderId,
            recipientPeerId: SmpPacketCodec.BROADCAST_PEER_ID,
            sequence: sequenceRef.current++,
            payload: manifestBuf,
          };

          const rawDelta = SmpPacketCodec.encode(deltaPacket);
          channelRef.current.postMessage(rawDelta.toString("base64"));
          simulateSync();
        } catch {
          // Non-blocking sync error
        }

        setTimeout(() => {
          setMeshRadioStatus("CONNECTED");
        }, 500);
      }
    }, MESH_SYNC_CONSTANTS.GOSSIP_INTERVAL_MS);

    return () => clearInterval(gossipInterval);
  }, [isMeshActive, meshRadioStatus, pendingOutboxCount, refugees, session.poskoId, session.userId, simulateSync]);

  // Combined peers: live heartbeats merged with historical store activity
  const mergedPeers = React.useMemo(() => {
    const peerMap = new Map<string, MeshPeer>();
    for (const p of livePeers) {
      peerMap.set(p.peerId, p);
    }
    for (const p of peers) {
      if (!peerMap.has(p.peerId)) {
        peerMap.set(p.peerId, p);
      }
    }
    return Array.from(peerMap.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }, [livePeers, peers]);

  const triggerManualGossip = React.useCallback(() => {
    if (meshRadioStatus === "BLUETOOTH_OFF" || meshRadioStatus === "PERMISSION_DENIED") return;

    setMeshRadioStatus("SCANNING");
    setLastGossipTimestamp(Date.now());
    setTimeout(() => {
      simulateSync();
      setMeshRadioStatus("CONNECTED");
    }, 600);
  }, [meshRadioStatus, simulateSync]);

  const toggleBluetoothRadio = React.useCallback(() => {
    setMeshRadioStatus((curr) => (curr === "BLUETOOTH_OFF" ? "CONNECTED" : "BLUETOOTH_OFF"));
  }, []);

  return {
    isMeshActive,
    setIsMeshActive,
    peerCount: mergedPeers.length,
    peers: mergedPeers,
    livePeers,
    pendingOutboxCount,
    lastGossipTimestamp,
    meshRadioStatus,
    setMeshRadioStatus,
    toggleBluetoothRadio,
    triggerManualGossip,
  };
}

