"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Icon } from "@/shared/ui/icon";

export function PoskoHeader() {
  const pathname = usePathname();
  const params = useParams();
  const { session, poskos, pendingOutboxCount } = usePoskoStore();

  const routePoskoId = (params?.poskoId as string) || (pathname.startsWith("/posko/") ? pathname.split("/")[2] : null);
  const poskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  const matchedPosko = poskos.find((p) => p.id === poskoId);
  const poskoDisplayName = matchedPosko?.name || (session.poskoId === poskoId && session.poskoName && !session.poskoName.includes("POS-LOCAL") ? session.poskoName : `Posko ${poskoId}`);

  const isRootPosko = pathname === `/posko/${poskoId}`;

  return (
    <header className="sticky top-0 z-30 w-full bg-surface border-b border-border shadow-2xs pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 max-w-7xl mx-auto min-h-[52px]">
        {/* Left: Simple Back button or Brand link */}
        <div className="flex items-center gap-2 min-w-0">
          {!isRootPosko ? (
            <Link
              href={`/posko/${poskoId}`}
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
            {poskoDisplayName}
          </span>
        </div>

        {/* Right: Quick Settings Link (Mobile only) */}
        <div className="flex items-center gap-1">
          <Link
            href={`/posko/${poskoId}/settings`}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-muted border border-transparent hover:border-border transition-colors"
            title="Pengaturan Posko"
            aria-label="Pengaturan Posko"
          >
            <Icon name="settings" variant="linear" size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
