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

export function UnifiedAppSidebar({ levelOverride }: { levelOverride?: HierarchyLevel }) {
  const pathname = usePathname() || "/";
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [roleActivationOpen, setRoleActivationOpen] = React.useState(false);
  const { session, poskos, missions, refugees, needsTickets } = usePoskoStore();
  const {
    currentLevel: detectedLevel,
    currentTitle,
    activePoskoId,
    activeMissionId,
    activeOrgName,
    canAccessOrg,
  } = useHierarchicalNav();

  const currentLevel = levelOverride || detectedLevel;

  // Active posko metadata
  const currentPosko = poskos.find((p) => p.id === activePoskoId);
  const poskoRefugeeCount = refugees.filter((r) => r.postId === activePoskoId).length;
  const pendingTicketsCount = needsTickets.filter((t) => t.postId === activePoskoId && t.status === "PENDING").length;

  // Construct main navigation based on level
  let mainNavTitle = "Menu Posko";
  let mainNavItems: NavItem[] = [];

  if (currentLevel === "POSKO") {
    mainNavTitle = "Menu Posko";
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
        label: "Kirim Data",
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
    mainNavTitle = "Menu Misi Bencana";
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
    mainNavTitle = "Menu Organisasi";
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
  const hierarchyLinks: { label: string; href: string; icon: SolarIconName; level: HierarchyLevel; active: boolean; disabled?: boolean }[] = [];

  if (canAccessOrg) {
    hierarchyLinks.push({
      label: "Organisasi",
      href: "/org",
      icon: "buildings",
      level: "ORG",
      active: currentLevel === "ORG",
    });
  }

  if (activeMissionId) {
    hierarchyLinks.push({
      label: "Misi Bencana",
      href: `/missions/${activeMissionId}`,
      icon: "radar",
      level: "MISSION",
      active: currentLevel === "MISSION",
    });
  }

  if (activePoskoId) {
    hierarchyLinks.push({
      label: "Posko Lapangan",
      href: `/posko/${activePoskoId}`,
      icon: "home",
      level: "POSKO",
      active: currentLevel === "POSKO",
    });
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface shrink-0 min-h-screen select-none">
        {/* Clean Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-2.5 bg-surface-subtle">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group" title="Beranda Sandya">
            <SandyaLogo size={28} />
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-text-main group-hover:text-primary transition-colors block">
                Sandya
              </span>
            </div>
          </Link>
          <Badge variant="neutral" size="sm" className="text-[10px] font-semibold">
            v2.4
          </Badge>
        </div>

        {/* Posko / Hierarchy Selector Combobox */}
        <div className="p-3 border-b border-border/60 bg-surface">
          <button
            type="button"
            onClick={() => setSwitcherOpen(true)}
            className="w-full p-2.5 rounded-xl border border-border bg-surface-subtle hover:bg-surface-muted hover:border-primary/40 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
            title="Klik untuk ganti Posko atau Tingkat Operasi"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon
                  name={currentLevel === "POSKO" ? "home" : currentLevel === "MISSION" ? "radar" : "buildings"}
                  variant="bold"
                  size={15}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
                    {currentLevel === "POSKO"
                      ? "Posko Aktif"
                      : currentLevel === "MISSION"
                      ? "Misi Bencana"
                      : "Organisasi"}
                  </span>
                </div>
                <p className="text-xs font-bold text-text-main truncate">
                  {currentTitle}
                </p>
              </div>
            </div>
            <Icon
              name="arrow-down"
              variant="linear"
              size={14}
              className="text-text-muted group-hover:text-primary transition-colors shrink-0"
            />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 p-3 space-y-5 overflow-y-auto">
          {/* Main Context Navigation */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              {mainNavTitle}
            </p>
            <div className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-bold shadow-2xs"
                        : "text-text-muted hover:text-text-main hover:bg-surface-subtle font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        name={item.icon}
                        variant={isActive ? "bold" : "linear"}
                        size={17}
                        className={isActive ? "text-primary" : "text-text-muted"}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-muted text-text-muted"
                        )}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tingkat Operasi (Hierarchy Links) */}
          {hierarchyLinks.length > 1 && (
            <div className="border-t border-border/60 pt-3">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Tingkat Operasi
              </p>
              <div className="space-y-0.5">
                {hierarchyLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors",
                      item.active
                        ? "bg-surface-muted text-text-main font-semibold border border-border/80"
                        : "text-text-muted hover:text-text-main hover:bg-surface-subtle font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        name={item.icon}
                        variant={item.active ? "bold" : "linear"}
                        size={16}
                        className={item.active ? "text-primary" : "text-text-muted"}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active User Footer Card */}
        <div className="p-3 border-t border-border bg-surface-subtle">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-text-main truncate">
                {session.userName || "Petugas Lapangan"}
              </p>
              <p className="text-[11px] text-text-muted truncate mt-0.5">
                {session.userRole.replace(/_/g, " ")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRoleActivationOpen(true)}
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-border text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
              title="Pindai Kartu Tugas Baru"
              aria-label="Pindai Kartu Tugas Baru"
            >
              <Icon name="qr-code" variant="linear" size={14} />
            </button>
          </div>
        </div>
      </aside>

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
