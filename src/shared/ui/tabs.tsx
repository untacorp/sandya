"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

export interface TabItem {
  id: string;
  label: string;
  href?: string;
  icon?: SolarIconName;
  badgeCount?: number;
  badgeVariant?: "safe" | "warning" | "danger" | "neutral";
}

export interface TabsProps {
  items: TabItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
  variant?: "segmented" | "line";
}

export function Tabs({
  items,
  activeId,
  onChange,
  className,
  variant = "segmented",
}: TabsProps) {
  if (variant === "segmented") {
  return (
  <div
  className={cn(
  "flex items-center p-1 rounded-xl bg-surface-muted border border-border overflow-x-auto no-scrollbar gap-1",
  className
  )}
  >
  {items.map((tab) => {
  const isActive = activeId ? tab.id === activeId : false;
  const content = (
  <>
  {tab.icon && (
  <Icon
  name={tab.icon}
  variant={isActive ? "bold" : "linear"}
  size={15}
  className={isActive ? "text-primary" : "text-text-muted"}
  />
  )}
  <span>{tab.label}</span>
  {typeof tab.badgeCount === "number" && tab.badgeCount > 0 && (
  <span
  className={cn(
  "px-1.5 py-0.2 text-[10px] font-bold rounded-full",
  isActive
  ? "bg-primary text-primary-foreground"
  : "bg-surface border border-border text-text-muted"
  )}
  >
  {tab.badgeCount}
  </span>
  )}
  </>
  );

  const baseClass = cn(
  "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-all select-none cursor-pointer whitespace-nowrap min-w-max",
  isActive
  ? "bg-surface text-text-main shadow-2xs font-bold"
  : "text-text-muted hover:text-text-main hover:bg-surface/60 font-medium"
  );

  if (tab.href) {
  return (
  <Link key={tab.id} href={tab.href} className={baseClass}>
  {content}
  </Link>
  );
  }

  return (
  <button
  key={tab.id}
  type="button"
  onClick={() => onChange?.(tab.id)}
  className={baseClass}
  >
  {content}
  </button>
  );
  })}
  </div>
  );
  }

  // Line variant (Underline tab)
  return (
  <div
  className={cn(
  "flex border-b border-border overflow-x-auto no-scrollbar gap-4 sm:gap-6",
  className
  )}
  >
  {items.map((tab) => {
  const isActive = activeId ? tab.id === activeId : false;
  const content = (
  <>
  {tab.icon && (
  <Icon
  name={tab.icon}
  variant={isActive ? "bold" : "linear"}
  size={15}
  className={isActive ? "text-primary" : "text-text-muted"}
  />
  )}
  <span>{tab.label}</span>
  {typeof tab.badgeCount === "number" && tab.badgeCount > 0 && (
  <span
  className={cn(
  "px-1.5 py-0.2 text-[10px] font-bold rounded-full",
  isActive
  ? "bg-primary text-primary-foreground"
  : "bg-surface-muted text-text-muted"
  )}
  >
  {tab.badgeCount}
  </span>
  )}
  </>
  );

  const baseClass = cn(
  "flex items-center gap-2 py-2 px-1 text-xs transition-all select-none cursor-pointer whitespace-nowrap border-b-2 -mb-[2px]",
  isActive
  ? "border-primary text-text-main font-bold"
  : "border-transparent text-text-muted hover:text-text-main font-medium"
  );

  if (tab.href) {
  return (
  <Link key={tab.id} href={tab.href} className={baseClass}>
  {content}
  </Link>
  );
  }

  return (
  <button
  key={tab.id}
  type="button"
  onClick={() => onChange?.(tab.id)}
  className={baseClass}
  >
  {content}
  </button>
  );
  })}
  </div>
  );
}
