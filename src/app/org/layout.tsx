"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";

interface NavItem {
  label: string;
  href: string;
  icon: SolarIconName;
  exact?: boolean;
}

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = usePoskoStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Cegah hydration mismatch
  }

  const mainNavItems: NavItem[] = [
  { href: "/org", label: "Ringkasan Lembaga", icon: "buildings", exact: true },
  { href: "/org/members", label: "Pengurus & Petugas", icon: "users" },
  { href: "/org/settings", label: "Pengaturan & Keamanan", icon: "settings" },
  ];

  const adminNavItems: NavItem[] = [
  {
  label: "Operasi Wilayah Aktif",
  href: `/missions/${session.missionId}`,
  icon: "radar",
  },
  {
  label: "Posko Lapangan Aktif",
  href: `/posko/${session.poskoId}`,
  icon: "home",
  },
  ];

  // Mobile bottom navigation (functional tabs only, settings is in top header)
  const mobileNavItems: NavItem[] = [
  { href: "/org", label: "Ringkasan Lembaga", icon: "buildings", exact: true },
  { href: "/org/members", label: "Pengurus & Petugas", icon: "users" },
  ];

  const isRootOrg = pathname === "/org";
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
          Sandya • Sistem Manajemen Tanggap Darurat Bencana
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-canvas text-text-main">
  {/* Desktop Sidebar */}
  <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface shrink-0 min-h-screen">
  {/* Brand Header */}
  <div className="p-4 border-b border-border flex items-center gap-2.5 bg-surface-subtle">
        <SandyaLogo size={28} />
  <div className="min-w-0">
  <h1 className="font-bold text-sm tracking-tight text-text-main truncate">
  {session.orgName}
  </h1>
  <p className="text-[11px] text-text-muted">
  Pengelola Induk Lembaga
  </p>
  </div>
  </div>

  {/* Navigation Sections */}
  <div className="flex-1 p-3 space-y-5 overflow-y-auto">
  <div>
  <p className="px-3 text-[11px] font-semibold text-text-muted mb-1.5">
  Menu Lembaga
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
  Tingkat Lapangan
  </p>
  <div className="space-y-0.5">
  {adminNavItems.map((item) => {
  const isActive = pathname.startsWith(item.href);
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
  <div className="flex items-center justify-between px-3 sm:px-6 py-2 max-w-6xl mx-auto min-h-[52px]">
  {/* Left: Minimal Back Button */}
  <div className="flex items-center gap-2 min-w-0">
  {!isRootOrg ? (
  <Link
  href="/org"
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors min-h-[40px] px-2.5 rounded-lg hover:bg-surface-muted shrink-0"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>Kembali</span>
  </Link>
  ) : (
  <Link
  href="/"
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors min-h-[40px] px-2.5 rounded-lg hover:bg-surface-muted shrink-0"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>Beranda</span>
  </Link>
  )}

  <span className="text-text-subtle font-light hidden sm:inline">|</span>

  <span className="text-xs sm:text-sm font-bold text-text-main truncate">
  {session.orgName}
  </span>
  </div>

  {/* Right: Settings Link (Mobile only, desktop has it in sidebar) */}
  <div className="flex items-center gap-1 md:hidden">
  <Link
  href="/org/settings"
  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-muted border border-transparent hover:border-border transition-colors"
  title="Pengaturan Lembaga"
  aria-label="Pengaturan Lembaga"
  >
  <Icon name="settings" variant="linear" size={20} />
  </Link>
  </div>
  </div>
  </header>

  {/* Page Content */}
  <main className="flex-1 max-w-6xl mx-auto w-full p-3.5 sm:p-6 md:p-8">
  {children}
  </main>

  {/* Mobile Bottom Navigation (Icon-only, functional tabs only) */}
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden shadow-sm safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]">
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
