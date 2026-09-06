"use client";

import * as React from "react";
import { usePoskoStore } from "../store/use-posko-store";
import { DEFAULT_CLOUD_CONFIG } from "@/infrastructure/config/cloud.config";

export function useAutoCloudSync() {
  const {
    isCloudSyncing,
    lastSyncedAt,
    pendingOutboxCount,
    cloudProvider,
    cloudEndpoint,
    triggerCloudSync,
  } = usePoskoStore();

  const [isOnline, setIsOnline] = React.useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncStatusMessage, setSyncStatusMessage] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  // Monitor browser online / offline state
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync immediately when connection is restored
      triggerCloudSync().then((res) => {
        if (res.success) {
          setSyncStatusMessage(res.message);
          setSyncError(null);
        } else {
          setSyncError(res.message);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerCloudSync]);

  // Periodic background auto-sync interval
  React.useEffect(() => {
    if (DEFAULT_CLOUD_CONFIG.driver === "LOCAL_FIRST_OFFLINE") {
      return;
    }

    const intervalMs = DEFAULT_CLOUD_CONFIG.syncOptions.autoSyncIntervalMs || 30000;

    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine && !isCloudSyncing) {
        triggerCloudSync().then((res) => {
          if (res.success) {
            setSyncStatusMessage(res.message);
            setSyncError(null);
          } else {
            setSyncError(res.message);
          }
        });
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [isCloudSyncing, triggerCloudSync]);

  const handleManualSync = React.useCallback(async () => {
    const res = await triggerCloudSync();
    if (res.success) {
      setSyncStatusMessage(res.message);
      setSyncError(null);
    } else {
      setSyncError(res.message);
    }
    return res;
  }, [triggerCloudSync]);

  return {
    isOnline,
    isSyncing: isCloudSyncing,
    lastSyncedAt,
    pendingOutboxCount,
    cloudProvider,
    cloudEndpoint,
    syncStatusMessage,
    syncError,
    triggerManualSync: handleManualSync,
  };
}
