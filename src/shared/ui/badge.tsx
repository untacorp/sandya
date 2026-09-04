"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName, type SolarIconVariant } from "@/shared/ui/icon";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium border-[1.5px] transition-colors select-none",
  {
    variants: {
      variant: {
        neutral:
          "bg-surface-subtle text-text-main border-border",
        muted:
          "bg-surface-muted text-text-muted border-border",
        primary:
          "bg-primary text-primary-foreground border-primary",
        safe:
          "bg-status-safe-bg text-status-safe border-status-safe-border",
        warning:
          "bg-status-warning-bg text-status-warning border-status-warning-border",
        danger:
          "bg-status-danger-bg text-status-danger border-status-danger-border",
        // START Triage Specific Badges
        "triage-red":
          "bg-status-danger text-text-inverse border-status-danger font-bold tracking-wide",
        "triage-yellow":
          "bg-status-warning text-text-inverse border-status-warning font-bold tracking-wide",
        "triage-green":
          "bg-status-safe text-text-inverse border-status-safe font-bold tracking-wide",
        "triage-black":
          "bg-triage-black text-text-inverse border-triage-black font-bold tracking-wide",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-md",
        md: "px-2.5 py-1 text-xs rounded-lg",
        lg: "px-3 py-1.5 text-sm rounded-lg",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: SolarIconName;
  iconVariant?: SolarIconVariant;
}

export function Badge({
  className,
  variant,
  size,
  icon,
  iconVariant = "linear",
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {icon && (
        <Icon
          name={icon}
          variant={iconVariant}
          size={size === "sm" ? 13 : 15}
        />
      )}
      <span>{children}</span>
    </div>
  );
}
