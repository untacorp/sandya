"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

export interface AlertBannerProps {
  variant?: "danger" | "warning" | "info" | "safe";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: SolarIconName;
  className?: string;
}

export function AlertBanner({
  variant = "danger",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: AlertBannerProps) {
  const styles = {
  danger: {
  container: "bg-status-danger-bg border-status-danger",
  iconBg: "bg-status-danger text-text-inverse",
  titleColor: "text-status-danger",
  defaultIcon: "sos" as SolarIconName,
  btnVariant: "danger" as const,
  },
  warning: {
  container: "bg-status-warning-bg border-status-warning-border",
  iconBg: "bg-status-warning text-text-main",
  titleColor: "text-status-warning",
  defaultIcon: "shield" as SolarIconName,
  btnVariant: "warning" as const,
  },
  safe: {
  container: "bg-status-safe-bg border-status-safe-border",
  iconBg: "bg-status-safe text-text-inverse",
  titleColor: "text-status-safe",
  defaultIcon: "check" as SolarIconName,
  btnVariant: "primary" as const,
  },
  info: {
  container: "bg-surface-subtle border-border",
  iconBg: "bg-primary text-primary-foreground",
  titleColor: "text-text-main",
  defaultIcon: "radar" as SolarIconName,
  btnVariant: "secondary" as const,
  },
  }[variant];

  const iconName = icon || styles.defaultIcon;

  return (
  <div
  className={cn(
  "p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs",
  styles.container,
  className
  )}
  >
  <div className="flex items-center gap-3 min-w-0">
  <div
  className={cn(
  "w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0",
  styles.iconBg
  )}
  >
  <Icon name={iconName} variant="bold" size={18} />
  </div>
  <div className="min-w-0">
  <h3 className={cn("text-sm font-bold truncate", styles.titleColor)}>
  {title}
  </h3>
  <p className="text-xs text-text-main mt-0.5 leading-relaxed">
  {description}
  </p>
  </div>
  </div>

  {actionLabel && (
  <div className="shrink-0">
  {actionHref ? (
  <Link href={actionHref}>
  <Button variant={styles.btnVariant} size="sm">
  {actionLabel}
  </Button>
  </Link>
  ) : (
  <Button variant={styles.btnVariant} size="sm" onClick={onAction}>
  {actionLabel}
  </Button>
  )}
  </div>
  )}
  </div>
  );
}
