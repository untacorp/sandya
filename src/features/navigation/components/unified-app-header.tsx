"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
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
  const { session, pendingOutboxCount, sidebarCollapsed, toggleSidebar } = usePoskoStore();
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
          {/* Left: Sidebar Toggle (only when collapsed) + Operational Context Switcher Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Desktop Sidebar Toggle Button: Centralized control in navbar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                "hidden md:flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer shrink-0",
                sidebarCollapsed
                  ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 shadow-2xs"
                  : "bg-surface-subtle border-border/80 text-text-muted hover:text-text-main hover:bg-surface-muted"
              )}
              title={sidebarCollapsed ? "Buka Sidebar Penuh" : "Kecilkan Sidebar"}
              aria-label={sidebarCollapsed ? "Buka Sidebar Penuh" : "Kecilkan Sidebar"}
            >
              <Icon
                name="sidebar-collapse"
                variant={sidebarCollapsed ? "bold" : "linear"}
                size={18}
                className={cn(
                  "transition-transform duration-200",
                  sidebarCollapsed ? "rotate-180 text-primary" : "text-text-muted"
                )}
              />
            </button>
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
              <span className="text-xs sm:text-sm font-bold text-text-main truncate max-w-[140px] sm:max-w-[220px]">
                {displayTitle}
              </span>
              <Icon
                name="arrow-down"
                variant="linear"
                size={13}
                className="text-text-muted group-hover:text-primary transition-colors shrink-0"
              />
            </button>

            {/* Desktop: Operational Context Pill */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSwitcherOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-muted border border-border/80 hover:border-primary/40 transition-all text-left group cursor-pointer"
                title="Beralih tingkat operasi atau ganti posko"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold",
                    currentLevel === "POSKO"
                      ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                      : currentLevel === "MISSION"
                      ? "bg-status-warning-bg text-status-warning border border-status-warning-border"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon name={getLevelIcon()} variant="bold" size={12} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded",
                    currentLevel === "POSKO"
                      ? "bg-status-safe-bg text-status-safe"
                      : currentLevel === "MISSION"
                      ? "bg-status-warning-bg text-status-warning"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {currentLevel === "POSKO"
                    ? "TK 3 • POSKO"
                    : currentLevel === "MISSION"
                    ? "TK 2 • MISI"
                    : "TK 1 • LEMBAGA"}
                </span>
                <span className="text-xs font-bold text-text-main truncate max-w-[220px]">
                  {displayTitle}
                </span>
                <Icon
                  name="arrow-down"
                  variant="linear"
                  size={12}
                  className="text-text-muted group-hover:text-primary transition-colors shrink-0"
                />
              </button>
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
