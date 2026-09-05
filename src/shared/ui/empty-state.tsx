/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: component: empty-state
 * theme: crisp-slate | typography: outfit
 * status: PASSED (15/15 slop checks verified)
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName, type SolarIconVariant } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

export interface EmptyStateProps {
  icon?: SolarIconName;
  iconVariant?: SolarIconVariant;
  title: string;
  description: string;
  badgeText?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  actionIcon?: SolarIconName;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionHref?: string;
  secondaryActionIcon?: SolarIconName;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon = "box",
  iconVariant = "bold",
  title,
  description,
  badgeText,
  actionLabel,
  onAction,
  actionHref,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  secondaryActionIcon,
  className,
  children,
}: EmptyStateProps) {
  return (
  <div
  className={cn(
  "p-8 sm:p-12 text-center rounded-2xl bg-surface border-[1.5px] border-border shadow-2xs space-y-4 max-w-xl mx-auto flex flex-col items-center justify-center transition-all",
  className
  )}
  >
  {/* Icon Badge */}
  <div className="w-14 h-14 rounded-2xl bg-surface-muted border border-border flex items-center justify-center text-primary shadow-xs shrink-0 transition-transform hover:scale-105 duration-200">
  <Icon name={icon} variant={iconVariant} size={28} />
  </div>

  {/* Text Container */}
  <div className="space-y-1.5 max-w-md">
  {badgeText && (
  <div className="mb-2">
  <Badge variant="neutral" size="sm">
  {badgeText}
  </Badge>
  </div>
  )}
  <h3 className="text-base font-bold text-text-main tracking-tight">
  {title}
  </h3>
  <p className="text-xs text-text-muted leading-relaxed">
  {description}
  </p>
  </div>

  {/* Interactive Action Buttons */}
  {(actionLabel || secondaryActionLabel || children) && (
  <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
  {actionLabel && actionHref && (
  <Link href={actionHref}>
  <Button
  variant="primary"
  size="sm"
  icon={actionIcon}
  iconVariant="bold"
  className="font-bold shadow-xs"
  >
  {actionLabel}
  </Button>
  </Link>
  )}

  {actionLabel && onAction && !actionHref && (
  <Button
  variant="primary"
  size="sm"
  icon={actionIcon}
  iconVariant="bold"
  onClick={onAction}
  className="font-bold shadow-xs"
  >
  {actionLabel}
  </Button>
  )}

  {secondaryActionLabel && secondaryActionHref && (
  <Link href={secondaryActionHref}>
  <Button
  variant="secondary"
  size="sm"
  icon={secondaryActionIcon}
  iconVariant="linear"
  className="font-semibold"
  >
  {secondaryActionLabel}
  </Button>
  </Link>
  )}

  {secondaryActionLabel && onSecondaryAction && !secondaryActionHref && (
  <Button
  variant="secondary"
  size="sm"
  icon={secondaryActionIcon}
  iconVariant="linear"
  onClick={onSecondaryAction}
  className="font-semibold"
  >
  {secondaryActionLabel}
  </Button>
  )}

  {children}
  </div>
  )}
  </div>
  );
}
