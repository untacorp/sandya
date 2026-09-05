"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  backHref,
  backLabel = "Kembali",
  children,
  className,
}: PageHeaderProps) {
  const desc = description || subtitle;
  return (
  <div
  className={cn(
  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 min-w-0",
  className
  )}
  >
  <div className="space-y-0.5 min-w-0">
  {backHref && (
  <div className="mb-1">
  <Link href={backHref}>
  <Button
  variant="ghost"
  size="sm"
  icon="arrow-left"
  iconVariant="linear"
  className="-ml-2 px-2 py-1 text-xs text-text-muted hover:text-text-main h-7"
  >
  {backLabel}
  </Button>
  </Link>
  </div>
  )}
  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-main truncate">
  {title}
  </h1>
  {desc && (
  <p className="text-xs text-text-muted leading-normal">
  {desc}
  </p>
  )}
  </div>

  {children && (
  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
  {children}
  </div>
  )}
  </div>
  );
}
