"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function List({ children, className, ...props }: ListProps) {
  return (
    <div
      className={cn(
        "divide-y divide-border border-[1.5px] border-border rounded-xl bg-surface shadow-2xs overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  disabled,
  className,
  ...props
}: ListItemProps) {
  const isInteractive = !!onClick && !disabled;

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={cn(
        "flex items-center gap-3 p-4 bg-surface transition-colors duration-150",
        isInteractive && "hover:bg-surface-subtle cursor-pointer active:bg-surface-muted",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      {...props}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-main truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-text-muted mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {trailing && <div className="shrink-0 flex items-center ml-2">{trailing}</div>}
    </div>
  );
}
