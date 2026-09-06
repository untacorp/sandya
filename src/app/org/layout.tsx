"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useAutoCloudSync } from "@/features/posko/hooks/use-auto-cloud-sync";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { UnifiedAppHeader, UnifiedAppSidebar } from "@/features/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: SolarIconName;
  exact?: boolean;
}

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { session } = usePoskoStore();
  const [isMounted, setIsMounted] = useState(false);

  // Mount background auto-sync across all organization pages
  useAutoCloudSync();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  const mobileNavItems: NavItem[] = [
    { href: "/org", label: "Ringkasan", icon: "buildings", exact: true },
    { href: "/org/members", label: "Pengurus", icon: "users" },
    { href: "/org/settings", label: "Pengaturan", icon: "settings" },
  ];

  const isLeader = session.userRole === "PEMIMPIN_ORGANISASI";

  // RBAC Guard: Organisasi level is strictly restricted to PEMIMPIN_ORGANISASI
  if (!isLeader) {
    return (
      <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between p-4 sm:p-8">
        <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
          >
            <Icon name="arrow-left" variant="linear" size={16} />
            <span>Kembali ke Gerbang Utama</span>
          </Link>
          <span className="text-xs font-semibold text-text-muted">Akses Terbatas</span>
        </header>

        <main className="max-w-md mx-auto w-full my-auto text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-status-danger-bg border border-status-danger-border text-status-danger flex items-center justify-center mx-auto shadow-2xs">
            <Icon name="shield" variant="bold" size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-text-main">
              Akses Khusus Pemimpin Organisasi
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              Tingkat Pengelola Lembaga hanya dapat diakses oleh Pemegang Master Authority Key (Ed25519). Peran aktif Anda saat ini:{" "}
              <strong className="text-text-main">{session.userRole.replace(/_/g, " ")}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border text-left space-y-3 shadow-2xs text-xs">
            <p className="font-semibold text-text-muted text-[11px] uppercase tracking-wider">
              Akses yang Disarankan:
            </p>
            {session.missionId && (
              <Link
                href={`/missions/${session.missionId}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-subtle hover:bg-surface-muted transition-colors border border-border font-semibold text-text-main"
              >
                <div className="flex items-center gap-2">
                  <Icon name="radar" variant="bold" size={16} className="text-primary" />
                  <span>Ruang Situasi Misi ({session.missionName || session.missionId})</span>
                </div>
                <Icon name="arrow-right" variant="linear" size={14} />
              </Link>
            )}
            {session.poskoId && (
              <Link
                href={`/posko/${session.poskoId}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-subtle hover:bg-surface-muted transition-colors border border-border font-semibold text-text-main"
              >
                <div className="flex items-center gap-2">
                  <Icon name="home" variant="bold" size={16} className="text-primary" />
                  <span>Dasbor Posko ({session.poskoName || session.poskoId})</span>
                </div>
                <Icon name="arrow-right" variant="linear" size={14} />
              </Link>
            )}
            <Link
              href="/activate"
              className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors border border-primary/30 font-semibold text-primary"
            >
              <div className="flex items-center gap-2">
                <Icon name="qr-code" variant="bold" size={16} />
                <span>Pindai Kartu Tugas Pemimpin</span>
              </div>
              <Icon name="arrow-right" variant="linear" size={14} />
            </Link>
          </div>
        </main>

        <footer className="text-center text-xs text-text-muted py-4 border-t border-border">
          Sandya • Sistem Tanggap Darurat Bencana Mandiri
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-canvas text-text-main">
      {/* Universal Desktop Sidebar */}
      <UnifiedAppSidebar levelOverride="ORG" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
        {/* Universal Top Header */}
        <UnifiedAppHeader />

        {/* Page Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full p-3.5 sm:p-6 md:p-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden shadow-sm safe-area-bottom">
          <div className="flex items-center justify-around h-14 max-w-xs mx-auto px-4">
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
                    "flex items-center justify-center flex-1 h-full transition-colors select-none",
                    isActive
                      ? "text-primary"
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
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
