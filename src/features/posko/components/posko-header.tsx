"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Icon } from "@/shared/ui/icon";

export function PoskoHeader() {
  const pathname = usePathname();
  const { session, pendingOutboxCount } = usePoskoStore();

  const isRootPosko = pathname === `/posko/${session.poskoId}`;

  return (
  <header className="sticky top-0 z-30 w-full bg-surface border-b border-border shadow-2xs">
  <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 max-w-7xl mx-auto">
  {/* Left: Simple Back button or Brand link */}
  <div className="flex items-center gap-2 min-w-0">
  {!isRootPosko ? (
  <Link
  href={`/posko/${session.poskoId}`}
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
  {session.poskoName}
  </span>
  </div>

  {/* Right: Quick Settings Link (Mobile only) */}
  <div className="flex items-center gap-2">
  <Link
  href={`/posko/${session.poskoId}/settings`}
  className="md:hidden flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-muted border border-transparent hover:border-border transition-colors"
  title="Pengaturan Posko"
  >
  <Icon name="settings" variant="linear" size={18} />
  </Link>
  </div>
  </div>
  </header>
  );
}
