"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { MissionNotFoundState } from "@/features/mission/components/mission-not-found";
import { UnifiedAppHeader, UnifiedAppSidebar } from "@/features/navigation";

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
  const pathname = usePathname() || "";
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

  const mobileNavItems: NavItem[] = [
    {
      label: "Ringkasan Misi",
      href: `/missions/${missionId}`,
      icon: "radar",
      exact: true,
    },
    {
      label: "Daftar Posko",
      href: `/missions/${missionId}/poskos`,
      icon: "home",
    },
    {
      label: "Logistik Wilayah",
      href: `/missions/${missionId}/logistics`,
      icon: "box",
    },
    {
      label: "Pencarian Keluarga",
      href: `/missions/${missionId}/reunion`,
      icon: "search",
    },
  ];

  return (
    <div className="min-h-[100dvh] md:min-h-screen flex bg-canvas text-text-main">
      {/* Universal Desktop Sidebar */}
      <UnifiedAppSidebar levelOverride="MISSION" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        {/* Universal Top Header */}
        <UnifiedAppHeader />

        {/* Page Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-3.5 sm:p-6 md:p-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden shadow-sm safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
            {mobileNavItems.map((item) => {
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
