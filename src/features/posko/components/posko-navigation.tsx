"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";

interface NavItem {
  label: string;
  href: string;
  icon: SolarIconName;
  exact?: boolean;
}

export function PoskoBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const { session } = usePoskoStore();
  const routePoskoId = (params?.poskoId as string) || (pathname.startsWith("/posko/") ? pathname.split("/")[2] : null);
  const poskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  const navItems: NavItem[] = [
  {
  label: "Ringkasan",
  href: `/posko/${poskoId}`,
  icon: "home",
  exact: true,
  },
  {
  label: "Warga",
  href: `/posko/${poskoId}/refugees`,
  icon: "users",
  },
  {
  label: "Logistik",
  href: `/posko/${poskoId}/logistics`,
  icon: "box",
  },
  {
  label: "Obrolan",
  href: `/posko/${poskoId}/tactical`,
  icon: "chat",
  },
  {
  label: "Kirim Data",
  href: `/posko/${poskoId}/sync`,
  icon: "sync",
  },
  ];

  return (
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden shadow-sm safe-area-bottom">
  <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
  {navItems.map((item) => {
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
  );
}

export function PoskoDesktopSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { session } = usePoskoStore();
  const routePoskoId = (params?.poskoId as string) || (pathname.startsWith("/posko/") ? pathname.split("/")[2] : null);
  const poskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  const mainNavItems: NavItem[] = [
  {
  label: "Ringkasan Posko",
  href: `/posko/${poskoId}`,
  icon: "home",
  exact: true,
  },
  {
  label: "Daftar Warga & Medis",
  href: `/posko/${poskoId}/refugees`,
  icon: "users",
  },
  {
  label: "Stok Barang & Logistik",
  href: `/posko/${poskoId}/logistics`,
  icon: "box",
  },
  {
  label: "Obrolan & Pesan Tim",
  href: `/posko/${poskoId}/tactical`,
  icon: "chat",
  },
  {
  label: "Kirim & Terima Data",
  href: `/posko/${poskoId}/sync`,
  icon: "sync",
  },
  ];

  const adminNavItems: NavItem[] = [
  {
  label: "Pengelola Induk Organisasi",
  href: `/org`,
  icon: "buildings",
  },
  {
  label: "Ringkasan Operasi Wilayah",
  href: `/missions/${session.missionId}`,
  icon: "radar",
  },
  {
  label: "Pengaturan Posko",
  href: `/posko/${poskoId}/settings`,
  icon: "settings",
  },
  ];

  return (
  <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface shrink-0 min-h-screen">
  {/* Brand Header */}
  <div className="p-4 border-b border-border flex items-center gap-2.5 bg-surface-subtle">
        <SandyaLogo size={28} />
  <div>
  <h1 className="font-bold text-sm tracking-tight text-text-main">
  Sandya
  </h1>
  <p className="text-[11px] text-text-muted">
  Tanggap Darurat Posko
  </p>
  </div>
  </div>

  {/* Navigation Sections */}
  <div className="flex-1 p-3 space-y-5 overflow-y-auto">
  <div>
  <p className="px-3 text-[11px] font-semibold text-text-muted mb-1.5">
  Menu Posko
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
  Tingkat Wilayah & Induk
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
  );
}
