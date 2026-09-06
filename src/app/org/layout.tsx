"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

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

  return (
  <div className="min-h-screen flex bg-canvas text-text-main">
  {/* Desktop Sidebar */}
  <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface shrink-0 min-h-screen">
  {/* Brand Header */}
  <div className="p-4 border-b border-border flex items-center gap-2.5 bg-surface-subtle">
  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
  S
  </div>
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
  <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
  {/* Sticky Minimal Header */}
  <header className="sticky top-0 z-30 w-full bg-surface border-b border-border shadow-2xs">
  <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 max-w-6xl mx-auto">
  {/* Left: Minimal Back Button */}
  <div className="flex items-center gap-2 min-w-0">
  {!isRootOrg ? (
  <Link
  href="/org"
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors py-1 px-2 rounded-lg hover:bg-surface-muted"
  >
  <Icon name="arrow-left" variant="linear" size={16} />
  <span>Kembali</span>
  </Link>
  ) : (
  <Link
  href="/"
  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors py-1 px-2 rounded-lg hover:bg-surface-muted"
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
  <div className="flex items-center gap-2 md:hidden">
  <Link
  href="/org/settings"
  className="flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-muted border border-transparent hover:border-border transition-colors"
  title="Pengaturan Lembaga"
  >
  <Icon name="settings" variant="linear" size={18} />
  </Link>
  </div>
  </div>
  </header>

  {/* Page Content */}
  <main className="flex-1 max-w-6xl mx-auto w-full p-3.5 sm:p-6 md:p-8">
  {children}
  </main>

  {/* Mobile Bottom Navigation (Icon-only, functional tabs only) */}
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
