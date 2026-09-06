"use client";

import * as React from "react";
import { usePoskoStore } from "../store/use-posko-store";
import { DEFAULT_CLOUD_CONFIG } from "@/infrastructure/config/cloud.config";
import { CloudSyncService } from "@/infrastructure/sync/cloud-sync.service";

export const TACTICAL_SYNC_CONSTANTS = {
  FAST_POLL_INTERVAL_MS: 3000,
} as const;

export function useTacticalChatSync(poskoId?: string) {
  const { importMessagesBatch, session } = usePoskoStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastCheckedAt, setLastCheckedAt] = React.useState<number>(Date.now());

  const effectivePoskoId = poskoId || session.poskoId;

  const pullLatestMessages = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    if (DEFAULT_CLOUD_CONFIG.driver === "LOCAL_FIRST_OFFLINE") return;

    try {
      const cloudSync = new CloudSyncService(DEFAULT_CLOUD_CONFIG);
      const res = await cloudSync.pullFromCloud(effectivePoskoId);
      if (res.data?.messages && res.data.messages.length > 0) {
        importMessagesBatch(res.data.messages);
      }
      setLastCheckedAt(Date.now());
    } catch {
      // Background sync errors in tactical chat are non-fatal
    }
  }, [effectivePoskoId, importMessagesBatch]);

  // Initial pull and periodic fast polling while on Tactical Chat page
  React.useEffect(() => {
    pullLatestMessages();

    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        pullLatestMessages();
      }
    }, TACTICAL_SYNC_CONSTANTS.FAST_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [pullLatestMessages]);

  const refreshNow = React.useCallback(async () => {
    setIsRefreshing(true);
    await pullLatestMessages();
    setIsRefreshing(false);
  }, [pullLatestMessages]);

  return {
    isRefreshing,
    lastCheckedAt,
    refreshNow,
  };
}
