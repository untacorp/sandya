"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: SolarIconName;
  variant?: "default" | "danger" | "warning" | "safe" | "primary";
  className?: string;
}

export function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const valueColor = {
    default: "text-text-main",
    danger: "text-status-danger",
    warning: "text-status-warning",
    safe: "text-status-safe",
    primary: "text-primary",
  }[variant];

  return (
    <Card className={cn("p-3 sm:p-4 space-y-1 min-w-0", className)}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-semibold text-text-muted truncate block">
          {title}
        </span>
        {icon && (
          <Icon
            name={icon}
            variant="bold"
            size={16}
            className={cn("shrink-0", valueColor)}
          />
        )}
      </div>

      <div className="flex items-baseline gap-1.5 pt-0.5 min-w-0">
        <span className={cn("text-lg sm:text-2xl font-bold tracking-tight truncate", valueColor)}>
          {value}
        </span>
        {unit && <span className="text-xs text-text-muted font-medium shrink-0">{unit}</span>}
      </div>

      {subtitle && (
        <p className="text-[11px] text-text-muted leading-tight pt-0.5 truncate sm:whitespace-normal">
          {subtitle}
        </p>
      )}
    </Card>
  );
}
