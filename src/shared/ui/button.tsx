"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName, type SolarIconVariant } from "@/shared/ui/icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover border border-primary shadow-xs",
        secondary:
          "bg-surface text-text-main hover:bg-surface-subtle border-[1.5px] border-border hover:border-border-hover shadow-2xs",
        outline:
          "bg-transparent text-text-main hover:bg-surface-muted border-[1.5px] border-border hover:border-border-strong",
        ghost:
          "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text-main border border-transparent",
        danger:
          "bg-status-danger text-text-inverse hover:opacity-90 border border-status-danger shadow-xs",
        "danger-outline":
          "bg-status-danger-bg text-status-danger hover:bg-status-danger-border/30 border-[1.5px] border-status-danger-border",
        success:
          "bg-status-safe text-text-inverse hover:opacity-90 border border-status-safe shadow-xs",
        "success-outline":
          "bg-status-safe-bg text-status-safe hover:bg-status-safe-border/30 border-[1.5px] border-status-safe-border",
        warning:
          "bg-status-warning text-text-inverse hover:opacity-90 border border-status-warning shadow-xs",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-5 text-base rounded-lg",
        xl: "h-14 px-6 text-base rounded-xl font-semibold",
        icon: "h-10 w-10 p-0 rounded-lg",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
        "icon-lg": "h-12 w-12 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: SolarIconName;
  iconVariant?: SolarIconVariant;
  iconRight?: SolarIconName;
  iconRightVariant?: SolarIconVariant;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconVariant = "linear",
      iconRight,
      iconRightVariant = "linear",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon && (
            <Icon
              name={icon}
              variant={iconVariant}
              size={size === "sm" ? 16 : size === "lg" ? 22 : 18}
            />
          )
        )}
        {children}
        {!loading && iconRight && (
          <Icon
            name={iconRight}
            variant={iconRightVariant}
            size={size === "sm" ? 16 : size === "lg" ? 22 : 18}
          />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
