"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: SolarIconName;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      icon,
      error,
      helperText,
      disabled,
      id,
      options,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold uppercase tracking-wider text-text-muted block"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-text-subtle z-10">
              <Icon name={icon} variant="linear" size={18} />
            </div>
          )}
          <select id={selectId}
            className={cn(
              "flex w-full rounded-lg bg-surface transition-colors duration-150 appearance-none cursor-pointer",
              "h-10 text-xs font-semibold text-text-main",
              "border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-border-strong",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle",
              icon ? "pl-9" : "pl-3",
              "pr-9", // Space for dropdown arrow
              error && "border-status-danger focus:ring-status-danger",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 flex items-center pointer-events-none text-text-muted appearance-none focus:border-border-strong transition-colors">
            <Icon name="arrow-down" size={16} />
          </div>
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

Select.displayName = "Select";
