"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";
import { Badge } from "@/shared/ui/badge";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useHierarchicalNav, type HierarchyLevel } from "../hooks/use-hierarchical-nav";
import { HierarchySwitcherModal } from "./hierarchy-switcher-modal";
import { RoleActivationModal } from "@/features/auth/components/role-activation-modal";

interface NavItem {
  label: string;
  href: string;
  icon: SolarIconName;
  exact?: boolean;
  badgeCount?: number;
}

const LEVEL_THEME: Record<
  HierarchyLevel,
  {
    tag: string;
    levelName: string;
    levelNumber: string;
    icon: SolarIconName;
  }
> = {
  ORG: {
    tag: "TK 1 • LEMBAGA",
    levelName: "Organisasi",
    levelNumber: "Tingkat 1",
    icon: "buildings",
  },
  MISSION: {
    tag: "TK 2 • MISI",
    levelName: "Misi Bencana",
    levelNumber: "Tingkat 2",
    icon: "radar",
  },
  POSKO: {
    tag: "TK 3 • POSKO",
    levelName: "Posko Lapangan",
    levelNumber: "Tingkat 3",
    icon: "home",
  },
  SYSTEM: {
    tag: "SISTEM",
    levelName: "Sistem",
    levelNumber: "Umum",
    icon: "shield",
  },
};

export function UnifiedAppSidebar({ levelOverride }: { levelOverride?: HierarchyLevel }) {
  const pathname = usePathname() || "/";
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [roleActivationOpen, setRoleActivationOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const {
    session,
    poskos,
    missions,
    refugees,
    needsTickets,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
  } = usePoskoStore();

  const {
    currentLevel: detectedLevel,
    currentTitle,
    activePoskoId,
    activeMissionId,
    activeOrgName,
    canAccessOrg,
  } = useHierarchicalNav();

  const currentLevel = levelOverride || detectedLevel;
  const currentTheme = LEVEL_THEME[currentLevel] || LEVEL_THEME.POSKO;

  // Visual expansion: pinned open or temporarily opened on hover
  const isExpanded = !sidebarCollapsed || isHovered;

  // Active posko metadata
  const poskoRefugeeCount = refugees.filter((r) => r.postId === activePoskoId).length;
  const pendingTicketsCount = needsTickets.filter(
    (t) => t.postId === activePoskoId && t.status === "PENDING"
  ).length;

  // Construct main navigation based on level
  let mainNavTitle = "Menu Posko";
  let mainNavItems: NavItem[] = [];

  if (currentLevel === "POSKO") {
    mainNavTitle = "Operasional Posko";
    mainNavItems = [
      {
        label: "Ringkasan Posko",
        href: `/posko/${activePoskoId}`,
        icon: "home",
        exact: true,
      },
      {
        label: "Warga & Medis",
        href: `/posko/${activePoskoId}/refugees`,
        icon: "users",
        badgeCount: poskoRefugeeCount || undefined,
      },
      {
        label: "Stok & Logistik",
        href: `/posko/${activePoskoId}/logistics`,
        icon: "box",
        badgeCount: pendingTicketsCount || undefined,
      },
      {
        label: "Obrolan & HT",
        href: `/posko/${activePoskoId}/tactical`,
        icon: "chat",
      },
      {
        label: "Kirim Data (Sync)",
        href: `/posko/${activePoskoId}/sync`,
        icon: "sync",
      },
      {
        label: "Pengaturan Posko",
        href: `/posko/${activePoskoId}/settings`,
        icon: "settings",
      },
    ];
  } else if (currentLevel === "MISSION") {
    mainNavTitle = "Komando Misi";
    mainNavItems = [
      {
        label: "Ringkasan Misi",
        href: `/missions/${activeMissionId}`,
        icon: "radar",
        exact: true,
      },
      {
        label: "Daftar Posko Lapangan",
        href: `/missions/${activeMissionId}/poskos`,
        icon: "home",
        badgeCount: poskos.length || undefined,
      },
      {
        label: "Logistik Wilayah",
        href: `/missions/${activeMissionId}/logistics`,
        icon: "box",
      },
      {
        label: "Pencarian Keluarga",
        href: `/missions/${activeMissionId}/reunion`,
        icon: "search",
      },
      {
        label: "Pengaturan Misi",
        href: `/missions/${activeMissionId}/settings`,
        icon: "settings",
      },
    ];
  } else if (currentLevel === "ORG") {
    mainNavTitle = "Pusat Lembaga";
    mainNavItems = [
      {
        label: "Ringkasan Lembaga",
        href: "/org",
        icon: "buildings",
        exact: true,
      },
      {
        label: "Pengurus & Petugas",
        href: "/org/members",
        icon: "users",
      },
      {
        label: "Pengaturan & Keamanan",
        href: "/org/settings",
        icon: "settings",
      },
    ];
  }

  // Hierarchy levels navigation links
  const hierarchyLinks: {
    label: string;
    tag: string;
    href: string;
    icon: SolarIconName;
    level: HierarchyLevel;
    active: boolean;
  }[] = [];

  if (canAccessOrg) {
    hierarchyLinks.push({
      label: activeOrgName || "Organisasi Induk",
      tag: "TK 1",
      href: "/org",
      icon: "buildings",
      level: "ORG",
      active: currentLevel === "ORG",
    });
  }

  if (activeMissionId) {
    hierarchyLinks.push({
      label: "Misi Bencana",
      tag: "TK 2",
      href: `/missions/${activeMissionId}`,
      icon: "radar",
      level: "MISSION",
      active: currentLevel === "MISSION",
    });
  }

  if (activePoskoId) {
    hierarchyLinks.push({
      label: "Posko Lapangan",
      tag: "TK 3",
      href: `/posko/${activePoskoId}`,
      icon: "home",
      level: "POSKO",
      active: currentLevel === "POSKO",
    });
  }

  return (
    <>
      {/* Outer wrapper: Keeps exact physical width in document flow so right content NEVER shifts on hover */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-all duration-200 ease-in-out relative select-none",
          sidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        <aside
          onMouseEnter={() => {
            if (sidebarCollapsed) setIsHovered(true);
          }}
          onMouseLeave={() => {
            if (sidebarCollapsed) setIsHovered(false);
          }}
          className={cn(
            "flex flex-col border-r border-border bg-surface select-none transition-all duration-200 ease-in-out h-screen sticky top-0",
            sidebarCollapsed
              ? isHovered
                ? "fixed top-0 left-0 bottom-0 w-64 shadow-2xl z-50 bg-surface border-r border-border"
                : "w-[68px]"
              : "w-64"
          )}
        >
          {/* Brand Header */}
          <div
            className={cn(
              "border-b border-border flex items-center bg-surface-subtle h-14 shrink-0 transition-all",
              !isExpanded ? "px-2.5 justify-center" : "px-4"
            )}
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 min-w-0 group"
              title="Kembali ke Gerbang Sandya"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <SandyaLogo size={26} />
              </div>
              {isExpanded && (
                <span className="font-bold text-sm tracking-tight text-text-main group-hover:text-primary transition-colors block">
                  Sandya
                </span>
              )}
            </Link>
          </div>

          {/* Operational Level Indicator & Context Switcher */}
          <div className={cn("border-b border-border/70 bg-surface", !isExpanded ? "p-2" : "p-3")}>
            <button
              type="button"
              onClick={() => setSwitcherOpen(true)}
              className={cn(
                "w-full rounded-xl border border-border bg-surface-subtle hover:bg-surface-muted hover:border-primary/40 transition-all text-left flex items-center group cursor-pointer relative overflow-hidden",
                !isExpanded
                  ? "p-2 justify-center"
                  : "p-2.5 justify-between gap-2.5"
              )}
              title={`Tingkat Aktif: ${currentTheme.levelName} (${currentTitle}) - Klik untuk beralih`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all font-bold",
                    currentLevel === "POSKO"
                      ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                      : currentLevel === "MISSION"
                      ? "bg-status-warning-bg text-status-warning border border-status-warning-border"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon name={currentTheme.icon} variant="bold" size={16} />
                </div>

                {isExpanded && (
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded inline-block",
                          currentLevel === "POSKO"
                            ? "bg-status-safe-bg text-status-safe"
                            : currentLevel === "MISSION"
                            ? "bg-status-warning-bg text-status-warning"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {currentTheme.tag}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-text-main truncate mt-0.5" title={currentTitle}>
                      {currentTitle}
                    </p>
                  </div>
                )}
              </div>

              {isExpanded && (
                <Icon
                  name="arrow-down"
                  variant="linear"
                  size={14}
                  className="text-text-muted group-hover:text-primary transition-colors shrink-0"
                />
              )}
            </button>
          </div>

          {/* Navigation Items Area */}
          <div className="flex-1 p-2 space-y-3 overflow-y-auto overflow-x-hidden">
            {/* 1. Quick Level Hierarchy Switcher at TOP (Prevents layout shift when changing level) */}
            {hierarchyLinks.length > 0 && (
              <div>
                {isExpanded && (
                  <div className="px-2.5 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-subtle">
                      Tingkat Operasi
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  {hierarchyLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!isExpanded ? `${item.tag}: ${item.label}` : undefined}
                      className={cn(
                        "flex items-center rounded-lg text-xs transition-all relative group",
                        !isExpanded
                          ? "justify-center p-2.5"
                          : "justify-between px-3 py-1.5",
                        item.active
                          ? "bg-surface-muted text-text-main font-bold border border-border shadow-2xs"
                          : "text-text-muted hover:text-text-main hover:bg-surface-subtle font-medium"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center min-w-0",
                          !isExpanded ? "justify-center" : "gap-2.5"
                        )}
                      >
                        <Icon
                          name={item.icon}
                          variant={item.active ? "bold" : "linear"}
                          size={17}
                          className={cn(
                            item.active
                              ? "text-primary"
                              : "text-text-muted group-hover:text-text-main"
                          )}
                        />
                        {isExpanded && (
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-text-subtle">
                              {item.tag}
                            </span>
                            <span className="truncate text-xs">{item.label}</span>
                          </div>
                        )}
                      </div>

                      {isExpanded && item.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Divider between Hierarchy and Sub-pages */}
            <div className="border-t border-border/70 my-2" />

            {/* 2. Main Sub-page Navigation for Current Level */}
            <div>
              {isExpanded && (
                <div className="flex items-center justify-between px-2.5 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-subtle">
                    {mainNavTitle}
                  </span>
                  <span className="text-[10px] font-semibold text-text-subtle">
                    {currentTheme.levelNumber}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!isExpanded ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg text-xs transition-all relative group",
                        !isExpanded
                          ? "justify-center p-2.5"
                          : "justify-between px-3 py-2",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                          : "text-text-muted hover:text-text-main hover:bg-surface-subtle font-medium"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center min-w-0",
                          !isExpanded ? "justify-center" : "gap-2.5"
                        )}
                      >
                        <Icon
                          name={item.icon}
                          variant={isActive ? "bold" : "linear"}
                          size={18}
                          className={cn(
                            "transition-transform group-hover:scale-105",
                            isActive ? "text-primary-foreground" : "text-text-muted group-hover:text-text-main"
                          )}
                        />
                        {isExpanded && <span className="truncate">{item.label}</span>}
                      </div>

                      {/* Badge on Expanded */}
                      {isExpanded && item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0",
                            isActive
                              ? "bg-white text-primary"
                              : "bg-surface-muted text-text-muted group-hover:bg-primary/10 group-hover:text-primary"
                          )}
                        >
                          {item.badgeCount}
                        </span>
                      )}

                      {/* Badge Dot on Collapsed */}
                      {!isExpanded && item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger ring-2 ring-surface" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer: User Identity & Expand/Collapse Trigger */}
          <div className="border-t border-border bg-surface-subtle p-2 shrink-0">
            {!isExpanded ? (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setRoleActivationOpen(true)}
                  className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-muted border border-border text-text-main flex items-center justify-center transition-colors cursor-pointer"
                  title={`Petugas: ${session.userName || "Petugas"} (${session.userRole}) - Klik untuk ganti kartu`}
                >
                  <Icon name="qr-code" variant="linear" size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-surface border border-border flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0 pl-1">
                    <p className="text-xs font-bold text-text-main truncate">
                      {session.userName || "Petugas Lapangan"}
                    </p>
                    <p className="text-[10px] text-text-muted truncate mt-0.5 font-medium">
                      {session.userRole.replace(/_/g, " ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoleActivationOpen(true)}
                    className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-muted border border-border text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
                    title="Pindai Kartu Tugas Baru"
                    aria-label="Pindai Kartu Tugas Baru"
                  >
                    <Icon name="qr-code" variant="linear" size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Global Switcher Modal */}
      <HierarchySwitcherModal
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
      />

      {/* In-Place Role Activation Modal */}
      <RoleActivationModal
        open={roleActivationOpen}
        onOpenChange={setRoleActivationOpen}
      />
    </>
  );
}
