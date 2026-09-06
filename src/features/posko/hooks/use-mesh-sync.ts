"use client";

import * as React from "react";
import { usePoskoStore } from "../store/use-posko-store";
import { type MeshPeer } from "@/shared/types";
import { meshRuntime } from "@/core/mesh/mesh-runtime";
import { BleRadioState } from "@/core/mesh/transport/ble-transport";

export const MESH_SYNC_CONSTANTS = {
  GOSSIP_INTERVAL_MS: 15000,
  PEER_HEARTBEAT_TIMEOUT_MS: 45000,
  SIMULATED_PEERS: [] as const,
} as const;

export type RadioDisplayStatus = "SCANNING" | "CONNECTED" | "IDLE" | "RADIO_OFF" | "UNAVAILABLE";

export function useMeshSync() {
  const {
    session,
    peers,
    pendingOutboxCount,
    simulateSync,
  } = usePoskoStore();

  const [isMeshActive, setIsMeshActive] = React.useState(true);
  const [lastGossipTimestamp, setLastGossipTimestamp] = React.useState<number>(0);
  const [meshRadioStatus, setMeshRadioStatus] = React.useState<RadioDisplayStatus>("SCANNING");

  // Initialize and synchronize meshRuntime
  React.useEffect(() => {
    let isMounted = true;

    meshRuntime.initialize({
      session,
      onPeersUpdated: (updatedPeers) => {
        usePoskoStore.getState().setPeers(updatedPeers);
      },
      onMessageReceived: (msg) => {
        usePoskoStore.getState().addIncomingMessage(msg);
      },
      onEventsApplied: () => {
        usePoskoStore.getState().simulateSync();
      },
    }).then(() => {
      if (!isMounted) return;
      const rawState = meshRuntime.getRadioState();
      if (rawState === "OFF") {
        setMeshRadioStatus("RADIO_OFF");
      } else if (rawState === "UNAVAILABLE") {
        setMeshRadioStatus("UNAVAILABLE");
      } else if (peers.length > 0) {
        setMeshRadioStatus("CONNECTED");
      } else {
        setMeshRadioStatus("SCANNING");
      }
    }).catch((err) => {
      console.error("[useMeshSync] Mesh runtime init error:", err);
    });

    const unsubscribeRadio = meshRuntime.onRadioStateChanged((state) => {
      if (state === "OFF") {
        setMeshRadioStatus("RADIO_OFF");
      } else if (state === "UNAVAILABLE") {
        setMeshRadioStatus("UNAVAILABLE");
      } else if (usePoskoStore.getState().peers.length > 0) {
        setMeshRadioStatus("CONNECTED");
      } else {
        setMeshRadioStatus("SCANNING");
      }
    });

    return () => {
      isMounted = false;
      unsubscribeRadio();
    };
  }, [session]);

  // Sync mesh active toggle with runtime radio state
  React.useEffect(() => {
    if (!isMeshActive) {
      meshRuntime.setRadioState("OFF");
      setMeshRadioStatus("RADIO_OFF");
    } else {
      const currentState = meshRuntime.getRadioState();
      if (currentState === "OFF") {
        meshRuntime.setRadioState("SCANNING");
      }
      if (peers.length > 0) {
        setMeshRadioStatus("CONNECTED");
      } else {
        setMeshRadioStatus("SCANNING");
      }
    }
  }, [isMeshActive, peers.length]);

  // Periodic Vector Clock Gossip & Outbox Synchronization
  React.useEffect(() => {
    if (!isMeshActive || meshRadioStatus === "RADIO_OFF" || meshRadioStatus === "UNAVAILABLE") {
      return;
    }

    let syncTimeout: NodeJS.Timeout | null = null;

    const gossipInterval = setInterval(() => {
      const now = Date.now();
      setLastGossipTimestamp(now);

      // Trigger vector probe broadcast across mesh
      meshRuntime.broadcastVectorProbe().catch((err) => {
        console.error("[useMeshSync] Vector probe gossip error:", err);
      });

      // If there are pending outbox items, clear them upon gossip
      if (pendingOutboxCount > 0) {
        setMeshRadioStatus("SCANNING");
        syncTimeout = setTimeout(() => {
          simulateSync();
          if (usePoskoStore.getState().peers.length > 0) {
            setMeshRadioStatus("CONNECTED");
          } else {
            setMeshRadioStatus("SCANNING");
          }
        }, 800);
      }
    }, MESH_SYNC_CONSTANTS.GOSSIP_INTERVAL_MS);

    return () => {
      clearInterval(gossipInterval);
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [isMeshActive, meshRadioStatus, pendingOutboxCount, simulateSync]);

  const triggerManualGossip = React.useCallback(() => {
    setMeshRadioStatus("SCANNING");
    setLastGossipTimestamp(Date.now());
    meshRuntime.broadcastVectorProbe().catch((err) => {
      console.error("[useMeshSync] Manual vector probe error:", err);
    });
    setTimeout(() => {
      simulateSync();
      if (usePoskoStore.getState().peers.length > 0) {
        setMeshRadioStatus("CONNECTED");
      } else {
        setMeshRadioStatus("SCANNING");
      }
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
