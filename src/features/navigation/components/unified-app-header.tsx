"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";
import { useHierarchicalNav } from "../hooks/use-hierarchical-nav";
import { HierarchySwitcherModal } from "./hierarchy-switcher-modal";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";

export interface UnifiedAppHeaderProps {
  customTitle?: string;
  customBackHref?: string;
  customBackLabel?: string;
  rightActions?: React.ReactNode;
}

export function UnifiedAppHeader({
  customTitle,
  customBackHref,
  customBackLabel,
  rightActions,
}: UnifiedAppHeaderProps) {
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const { session, pendingOutboxCount } = usePoskoStore();
  const {
    currentLevel,
    currentTitle,
    backHref,
    backLabel,
    activePoskoId,
    activeMissionId,
  } = useHierarchicalNav();

  const finalBackHref = customBackHref || backHref;
  const finalBackLabel = customBackLabel || backLabel;
  const displayTitle = customTitle || currentTitle;

  // Level-specific settings URL
  let settingsHref = `/posko/${activePoskoId}/settings`;
  if (currentLevel === "MISSION") {
    settingsHref = `/missions/${activeMissionId}/settings`;
  } else if (currentLevel === "ORG") {
    settingsHref = "/org/settings";
  }

  const getLevelIcon = () => {
    if (currentLevel === "POSKO") return "home";
    if (currentLevel === "MISSION") return "radar";
    if (currentLevel === "ORG") return "buildings";
    return "shield";
  };

  const roleLabel = session.userRole.replace(/_/g, " ");

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-surface border-b border-border shadow-2xs">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 max-w-7xl mx-auto gap-2">
          {/* Left: Deterministic Back Button + Context Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={finalBackHref}
              className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors py-1 px-2 rounded-lg hover:bg-surface-muted shrink-0"
              title={`Kembali ke ${finalBackLabel}`}
            >
              <Icon name="arrow-left" variant="linear" size={16} />
              <span className="hidden xs:inline">{finalBackLabel}</span>
              <span className="xs:hidden">Kembali</span>
            </Link>

            <span className="text-text-subtle font-light hidden sm:inline select-none">|</span>

            {/* Mobile: Interactive Posko/Level Switcher Pill */}
            <button
              type="button"
              onClick={() => setSwitcherOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface-muted border border-border/80 hover:border-primary/40 transition-all text-left group min-w-0"
              title="Ganti Posko & Tingkat Operasi"
            >
              <Icon
                name={getLevelIcon()}
                variant="bold"
                size={14}
                className="text-primary shrink-0 group-hover:scale-105 transition-transform"
              />
              <span className="text-xs sm:text-sm font-bold text-text-main truncate max-w-[130px] sm:max-w-[220px]">
                {displayTitle}
              </span>
              <Icon
                name="arrow-down"
                variant="linear"
                size={13}
                className="text-text-muted group-hover:text-primary transition-colors shrink-0"
              />
            </button>

            {/* Desktop: Clean Static Context Title */}
            <div className="hidden md:flex items-center gap-2 px-1">
              <Icon
                name={getLevelIcon()}
                variant="bold"
                size={15}
                className="text-primary shrink-0"
              />
              <span className="text-sm font-bold text-text-main truncate max-w-md">
                {displayTitle}
              </span>
            </div>
          </div>

          {/* Right: Custom Actions, Pending Sync, Role Badge, and Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {rightActions}

            {pendingOutboxCount > 0 && (
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-warning-bg border border-status-warning-border text-status-warning text-[10px] font-semibold"
                title={`${pendingOutboxCount} mutasi tertunda belum sinkron`}
              >
                <Icon name="sync" variant="linear" size={12} className="animate-spin" />
                <span>{pendingOutboxCount}</span>
              </div>
            )}

            {/* Desktop Role Badge */}
            <div className="hidden lg:flex items-center gap-1.5 pl-1">
              <Badge variant="neutral" size="sm" className="text-[11px] font-medium">
                {roleLabel}
              </Badge>
            </div>

            {/* Quick Settings Link */}
            <Link
              href={settingsHref}
              className="flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-muted border border-transparent hover:border-border transition-colors"
              title="Pengaturan"
            >
              <Icon name="settings" variant="linear" size={17} />
            </Link>
          </div>
        </div>
      </header>

      {/* Global Hierarchy & Posko Switcher Modal */}
      <HierarchySwitcherModal
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
      />
    </>
  );
}
