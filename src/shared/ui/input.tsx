"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: SolarIconName;
  iconRight?: SolarIconName;
  onRightIconClick?: () => void;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
  {
  className,
  type,
  label,
  icon,
  iconRight,
  onRightIconClick,
  error,
  helperText,
  disabled,
  id,
  ...props
  },
  ref
) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

  return (
  <div className="w-full space-y-1.5">
  {label && (
  <label
  htmlFor={inputId}
  className="text-xs font-bold uppercase tracking-wider text-text-muted block"
  >
  {label}
  </label>
  )}
  <div className="relative flex items-center w-full">
  {icon && (
  <div className="absolute left-3.5 flex items-center pointer-events-none text-text-subtle">
  <Icon name={icon} variant="linear" size={18} />
  </div>
  )}
  <input
  id={inputId}
  type={type}
  className={cn(
  "flex h-11 w-full rounded-lg border-[1.5px] bg-surface px-3.5 py-2 text-sm text-text-main transition-colors duration-150",
  "placeholder:text-text-subtle",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-border-strong",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle",
  icon && "pl-10",
  iconRight && "pr-10",
  error
  ? "border-status-danger focus-visible:ring-status-danger"
  : "border-border hover:border-border-hover",
  className
  )}
  ref={ref}
  disabled={disabled}
  {...props}
  />
  {iconRight && (
  <button
  type="button"
  onClick={onRightIconClick}
  tabIndex={onRightIconClick ? 0 : -1}
  className={cn(
  "absolute right-3.5 flex items-center text-text-subtle transition-colors",
  onRightIconClick && "hover:text-text-main cursor-pointer"
  )}
  >
  <Icon name={iconRight} variant="linear" size={18} />
  </button>
  )}
  </div>
  {error ? (
  <p className="text-xs font-medium text-status-danger">{error}</p>
  ) : helperText ? (
  <p className="text-xs text-text-muted">{helperText}</p>
  ) : null}
  </div>
  );
  }
);

Input.displayName = "Input";
