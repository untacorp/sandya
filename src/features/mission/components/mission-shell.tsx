"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";
import { MissionNotFoundState } from "@/features/mission/components/mission-not-found";

interface NavItem {
  label: string;
  href: string;
  icon: SolarIconName;
  exact?: boolean;
}

export function MissionShell({
  missionId,
  children,
}: {
  missionId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session, missions, setSessionMission } = usePoskoStore();

  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    setHasHydrated(usePoskoStore.persist.hasHydrated());
    const unsub = usePoskoStore.persist.onFinishHydration(() => setHasHydrated(true));
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const mission = missions.find((m) => m.id === missionId || m.id === session.missionId);

  React.useEffect(() => {
    if (mission && (session.missionId !== mission.id || session.missionName !== mission.name)) {
      setSessionMission(mission.id, mission.name);
    }
  }, [mission, session.missionId, session.missionName, setSessionMission]);

  if (hasHydrated && !mission) {
    return <MissionNotFoundState missionId={missionId} />;
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mainNavItems: NavItem[] = [
  {
  label: "Ringkasan Wilayah",
  href: `/missions/${missionId}`,
  icon: "radar",
  exact: true,
  },
  {
  label: "Daftar Posko Lapangan",
  href: `/missions/${missionId}/poskos`,
  icon: "home",
  },
  {
  label: "Gudang Logistik Wilayah",
  href: `/missions/${missionId}/logistics`,
  icon: "box",
  },
  {
  label: "Pencarian Keluarga",
  href: `/missions/${missionId}/reunion`,
  icon: "search",
  },
  ];

  const adminNavItems: NavItem[] = [
  {
  label: "Markas Lembaga Induk",
  href: "/org",
  icon: "buildings",
  },
  {
  label: "Posko Lapangan Aktif",
  href: `/posko/${session.poskoId}`,
  icon: "home",
  },
  {
  label: "Pengaturan Wilayah",
  href: `/missions/${missionId}/settings`,
  icon: "settings",
  },
  ];

  const isRootMission = pathname === `/missions/${missionId}`;

  return (
    <div className="min-h-[100dvh] flex bg-canvas text-text-main">
  {/* Desktop Sidebar */}
  <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface shrink-0 min-h-screen">
  {/* Brand Header */}
  <div className="p-4 border-b border-border flex items-center gap-2.5 bg-surface-subtle">
  <SandyaLogo size={28} className="text-status-danger" />
  <div className="min-w-0">
  <h1 className="font-bold text-sm tracking-tight text-text-main truncate">
  {mission.name}
  </h1>
  <p className="text-[11px] text-text-muted">
  Markas Wilayah Operasi
  </p>
  </div>
  </div>

  {/* Navigation Sections */}
  <div className="flex-1 p-3 space-y-5 overflow-y-auto">
  <div>
  <p className="px-3 text-[11px] font-semibold text-text-muted mb-1.5">
  Menu Wilayah
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
  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
  isActive
  ? "bg-surface-muted text-text-main font-semibold border border-border/80"
  : "text-text-muted hover:text-text-main hover:bg-surface-subtle font-medium"
  )}
  >
  <Icon
  name={item.icon}
  variant={isActive ? "bold" : "linear"}
  size={18}
  className={isActive ? "text-primary" : "text-text-muted"}
  />
  <span>{item.label}</span>
  </Link>
  );
  })}
  </div>
  </div>

  <div>
  <p className="px-3 text-[11px] font-semibold text-text-muted mb-1.5">
  Tingkat Lembaga & Posko
  </p>
  <div className="space-y-0.5">
  {adminNavItems.map((item) => {
  const isActive = pathname === item.href;
  return (
  <Link
  key={item.href}
  href={item.href}
  className={cn(
  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
  isActive
  ? "bg-surface-muted text-text-main font-semibold border border-border/80"
  : "text-text-muted hover:text-text-main hover:bg-surface-subtle font-medium"
  )}
  >
  <Icon
  name={item.icon}
  variant={isActive ? "bold" : "linear"}
  size={18}
  className={isActive ? "text-primary" : "text-text-muted"}
  />
  <span>{item.label}</span>
  </Link>
  );
  })}
  </div>
  </div>
  </div>
  </aside>

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
  {/* Sticky Minimal Header */}
  <header className="sticky top-0 z-30 w-full bg-surface border-b border-border shadow-2xs pt-[env(safe-area-inset-top,0px)]">
  <div className="flex items-center justify-between px-3 sm:px-6 py-2 max-w-7xl mx-auto min-h-[52px]">
  {/* Left: Minimal Back Button */}
  <div className="flex items-center gap-2 min-w-0">
  {!isRootMission ? (
  <Link
  href={`/missions/${missionId}`}
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors min-h-[40px] px-2.5 rounded-lg hover:bg-surface-muted shrink-0"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>Kembali</span>
  </Link>
  ) : (
  <Link
  href="/org"
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors min-h-[40px] px-2.5 rounded-lg hover:bg-surface-muted shrink-0"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>Markas Lembaga</span>
  </Link>
  )}

  <span className="text-text-subtle font-light hidden sm:inline">|</span>

  <span className="text-xs sm:text-sm font-bold text-text-main truncate">
  {mission.name}
  </span>
  </div>

  {/* Right: Quick Settings Link (Mobile only, desktop has it in sidebar) */}
  <div className="flex items-center gap-1 md:hidden">
  <Link
  href={`/missions/${missionId}/settings`}
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-muted border border-transparent hover:border-border transition-colors"
  title="Pengaturan Wilayah"
  aria-label="Pengaturan Wilayah"
  >
  <Icon name="settings" variant="linear" size={20} />
  </Link>
  </div>
  </div>
  </header>

  {/* Page Content */}
  <main className="flex-1 max-w-7xl mx-auto w-full p-3.5 sm:p-6 md:p-8">
  {children}
  </main>

  {/* Mobile Bottom Navigation (Icon-only) */}
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden shadow-sm safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]">
  <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
  {mainNavItems.map((item) => {
  const isActive = item.exact
  ? pathname === item.href
  : pathname.startsWith(item.href);

  return (
  <Link
  key={item.href}
  href={item.href}
  aria-label={item.label}
  title={item.label}
  className={cn(
  "flex items-center justify-center flex-1 h-full min-h-[44px] transition-colors select-none",
  isActive
  ? "text-primary"
  : "text-text-muted hover:text-text-main"
  )}
  >
  <div
  className={cn(
  "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
  isActive
  ? "bg-primary/10 text-primary"
  : "hover:bg-surface-muted"
  )}
  >
  <Icon
  name={item.icon}
  variant={isActive ? "bold" : "linear"}
  size={22}
  />
  </div>
  </Link>
  );
  })}
  </div>
  </nav>
  </div>
  </div>
  );
}
