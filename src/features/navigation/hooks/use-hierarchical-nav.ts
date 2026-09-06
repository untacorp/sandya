"use client";

import { usePathname, useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";

export type HierarchyLevel = "POSKO" | "MISSION" | "ORG" | "SYSTEM";

export interface HierarchicalNavResult {
  currentLevel: HierarchyLevel;
  levelBadgeText: string;
  currentTitle: string;
  currentSubtitle: string;
  backHref: string;
  backLabel: string;
  isRootOfLevel: boolean;
  activePoskoId: string;
  activeMissionId: string;
  activeOrgName: string;
  canAccessOrg: boolean;
  canAccessMission: boolean;
  getSwitchPoskoHref: (targetPoskoId: string) => string;
}

export function useHierarchicalNav(): HierarchicalNavResult {
  const pathname = usePathname() || "/";
  const params = useParams();
  const { session, poskos, missions } = usePoskoStore();

  // Extract poskoId
  const routePoskoId =
    (params?.poskoId as string) ||
    (pathname.startsWith("/posko/") ? pathname.split("/")[2] : "");
  const activePoskoId =
    routePoskoId && routePoskoId !== "POS-LOCAL"
      ? routePoskoId
      : session.poskoId && session.poskoId !== "POS-LOCAL"
      ? session.poskoId
      : routePoskoId || "POS-01";

  const matchedPosko = poskos.find((p) => p.id === activePoskoId);
  const poskoDisplayName =
    matchedPosko?.name ||
    (session.poskoId === activePoskoId &&
    session.poskoName &&
    !session.poskoName.includes("POS-LOCAL")
      ? session.poskoName
      : `Posko ${activePoskoId}`);

  // Extract missionId
  const routeMissionId =
    (params?.missionId as string) ||
    (pathname.startsWith("/missions/") ? pathname.split("/")[2] : "");
  const activeMissionId = routeMissionId || session.missionId || "MSN-2026-01";

  const matchedMission = missions.find((m) => m.id === activeMissionId);
  const missionDisplayName =
    matchedMission?.name || session.missionName || `Misi ${activeMissionId}`;

  const activeOrgName = session.orgName || "Pusat Komando Wilayah";

  const canAccessOrg = session.userRole === "PEMIMPIN_ORGANISASI";
  const canAccessMission = true; // All operational staff can view mission

  // Determine Level
  let currentLevel: HierarchyLevel = "SYSTEM";
  let levelBadgeText = "Sandya";
  let currentTitle = "Sandya";
  let currentSubtitle = "";
  let isRootOfLevel = false;

  let backHref = "/";
  let backLabel = "Beranda";

  if (pathname.startsWith("/posko/")) {
    currentLevel = "POSKO";
    levelBadgeText = "Posko Lapangan";
    currentTitle = poskoDisplayName;
    currentSubtitle = matchedPosko
      ? `${matchedPosko.currentRefugees} Warga • ${matchedPosko.locationName || "Tenda Pengungsian"}`
      : "Posko Evakuasi Mandiri";

    const poskoRoot = `/posko/${activePoskoId}`;

    if (pathname === poskoRoot) {
      isRootOfLevel = true;
      if (activeMissionId) {
        backHref = `/missions/${activeMissionId}`;
        backLabel = "Misi Operasi";
      } else if (canAccessOrg) {
        backHref = "/org";
        backLabel = "Organisasi";
      } else {
        backHref = "/";
        backLabel = "Beranda";
      }
    } else if (pathname.startsWith(`${poskoRoot}/refugees/`)) {
      // Sub-refugees view (e.g. /refugees/[refugeeId])
      backHref = `${poskoRoot}/refugees`;
      backLabel = "Daftar Warga";
    } else if (pathname === `${poskoRoot}/refugees`) {
      backHref = poskoRoot;
      backLabel = "Ringkasan Posko";
    } else if (pathname.startsWith(`${poskoRoot}/logistics/`)) {
      // Sub-logistics view (distribute, waybills)
      backHref = `${poskoRoot}/logistics`;
      backLabel = "Stok Logistik";
    } else if (pathname === `${poskoRoot}/logistics`) {
      backHref = poskoRoot;
      backLabel = "Ringkasan Posko";
    } else if (pathname.startsWith(`${poskoRoot}/tactical/`)) {
      // Radar or direct channel
      backHref = `${poskoRoot}/tactical`;
      backLabel = "Obrolan HT";
    } else if (pathname === `${poskoRoot}/tactical`) {
      backHref = poskoRoot;
      backLabel = "Ringkasan Posko";
    } else if (pathname.startsWith(`${poskoRoot}/sync/`)) {
      // Animated QR or poster print
      backHref = `${poskoRoot}/sync`;
      backLabel = "Pusat Data";
    } else if (pathname === `${poskoRoot}/sync`) {
      backHref = poskoRoot;
      backLabel = "Ringkasan Posko";
    } else if (pathname === `${poskoRoot}/settings`) {
      backHref = poskoRoot;
      backLabel = "Ringkasan Posko";
    } else {
      backHref = poskoRoot;
      backLabel = "Ringkasan Posko";
    }
  } else if (pathname.startsWith("/missions/")) {
    currentLevel = "MISSION";
    levelBadgeText = "Misi Bencana";
    currentTitle = missionDisplayName;
    currentSubtitle = matchedMission
      ? `${matchedMission.location} • ${matchedMission.status === "ACTIVE_EMERGENCY" ? "Tanggap Darurat" : "Siaga"}`
      : "Wilayah Operasi Bencana";

    const missionRoot = `/missions/${activeMissionId}`;

    if (pathname === missionRoot) {
      isRootOfLevel = true;
      if (canAccessOrg) {
        backHref = "/org";
        backLabel = "Markas Lembaga";
      } else {
        backHref = "/";
        backLabel = "Beranda";
      }
    } else if (pathname === `${missionRoot}/poskos/create`) {
      backHref = `${missionRoot}/poskos`;
      backLabel = "Daftar Posko";
    } else if (pathname.startsWith(`${missionRoot}/`)) {
      backHref = missionRoot;
      backLabel = "Ringkasan Misi";
    } else {
      backHref = missionRoot;
      backLabel = "Ringkasan Misi";
    }
  } else if (pathname.startsWith("/org")) {
    currentLevel = "ORG";
    levelBadgeText = "Markas Lembaga";
    currentTitle = activeOrgName;
    currentSubtitle = "Pusat Komando Organisasi";

    if (pathname === "/org") {
      isRootOfLevel = true;
      backHref = "/";
      backLabel = "Gerbang Utama";
    } else {
      backHref = "/org";
      backLabel = "Ringkasan Lembaga";
    }
  }

  const getSwitchPoskoHref = (targetPoskoId: string): string => {
    if (pathname.startsWith("/posko/")) {
      const parts = pathname.split("/");
      // parts: ["", "posko", currentPoskoId, ...rest]
      if (parts.length >= 3) {
        // If on refugee detail page (/posko/[id]/refugees/[refugeeId]), route to target posko refugees list
        if (parts[3] === "refugees" && parts.length > 4) {
          return `/posko/${targetPoskoId}/refugees`;
        }
        parts[2] = targetPoskoId;
        return parts.join("/");
      }
    }
    return `/posko/${targetPoskoId}`;
  };

  return {
    currentLevel,
    levelBadgeText,
    currentTitle,
    currentSubtitle,
    backHref,
    backLabel,
    isRootOfLevel,
    activePoskoId,
    activeMissionId,
    activeOrgName,
    canAccessOrg,
    canAccessMission,
    getSwitchPoskoHref,
  };
}
