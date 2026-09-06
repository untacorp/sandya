"use client";

import * as React from "react";
import { usePoskoStore } from "../store/use-posko-store";
import { type MeshPeer } from "@/shared/types";
import { TIME_CONSTANTS } from "@/core/shared/constants";

export const MESH_SYNC_CONSTANTS = {
  GOSSIP_INTERVAL_MS: 15000,
  PEER_HEARTBEAT_TIMEOUT_MS: 45000,
  SIMULATED_PEERS: [
    {
      peerId: "PEER-MED-01",
      aliasName: "dr. Siti Rahma",
      role: "PETUGAS_MEDIS" as const,
      rssi: -58,
      hops: 1,
      isDirect: true,
      lastSeenOffsetMs: 4000,
    },
    {
      peerId: "PEER-LOG-02",
      aliasName: "Budi Santoso (Gudang)",
      role: "PETUGAS_LOGISTIK" as const,
      rssi: -67,
      hops: 1,
      isDirect: true,
      lastSeenOffsetMs: 9000,
    },
    {
      peerId: "PEER-REL-03",
      aliasName: "Ahmad Fauzi (Tenda B)",
      role: "RELAWAN_LAPANGAN" as const,
      rssi: -82,
      hops: 2,
      isDirect: false,
      lastSeenOffsetMs: 18000,
    },
  ],
} as const;

export function useMeshSync() {
  const {
    session,
    peers,
    pendingOutboxCount,
    simulateSync,
  } = usePoskoStore();

  const [isMeshActive, setIsMeshActive] = React.useState(true);
  const [lastGossipTimestamp, setLastGossipTimestamp] = React.useState<number>(0);
  const [meshRadioStatus, setMeshRadioStatus] = React.useState<"SCANNING" | "CONNECTED" | "IDLE">("CONNECTED");

  // Initialize or maintain peers in vicinity
  React.useEffect(() => {
    if (!isMeshActive) return;

    const updatePeers = () => {
      const now = Date.now();
      const updatedPeers: MeshPeer[] = MESH_SYNC_CONSTANTS.SIMULATED_PEERS.map((p) => ({
        peerId: p.peerId,
        noisePubkey: `noise_${p.peerId.toLowerCase()}`,
        signingPubkey: `sig_${p.peerId.toLowerCase()}`,
        aliasName: p.aliasName,
        role: p.role,
        rssi: p.rssi + Math.floor(Math.random() * 5 - 2), // Natural RSSI jitter
        hops: p.hops,
        lastSeen: now - p.lastSeenOffsetMs,
      }));

      // Update zustand store state
      usePoskoStore.setState({ peers: updatedPeers });
      setMeshRadioStatus("CONNECTED");
    };

    updatePeers();
    const peerInterval = setInterval(updatePeers, MESH_SYNC_CONSTANTS.GOSSIP_INTERVAL_MS);

    return () => {
      clearInterval(peerInterval);
    };
  }, [isMeshActive]);

  // Background Gossip & Vector Clock Delta Exchange
  React.useEffect(() => {
    if (!isMeshActive) return;

    const gossipInterval = setInterval(() => {
      const now = Date.now();
      setLastGossipTimestamp(now);

      // If there are pending outbox items, gossip them across mesh
      if (pendingOutboxCount > 0) {
        setMeshRadioStatus("SCANNING");
        setTimeout(() => {
          simulateSync();
          setMeshRadioStatus("CONNECTED");
        }, 800);
      }
    }, MESH_SYNC_CONSTANTS.GOSSIP_INTERVAL_MS);

    return () => {
      clearInterval(gossipInterval);
    };
  }, [isMeshActive, pendingOutboxCount, simulateSync]);

  const triggerManualGossip = React.useCallback(() => {
    setMeshRadioStatus("SCANNING");
    setLastGossipTimestamp(Date.now());
    setTimeout(() => {
      simulateSync();
      setMeshRadioStatus("CONNECTED");
    }, 600);
  }, [simulateSync]);

  return {
    isMeshActive,
    setIsMeshActive,
    peerCount: peers.length,
    peers,
    pendingOutboxCount,
    lastGossipTimestamp,
    meshRadioStatus,
    triggerManualGossip,
  };
}
