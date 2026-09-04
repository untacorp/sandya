"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = "md",
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full z-10 bg-surface rounded-2xl border-[1.5px] border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150",
          maxWidth === "sm" && "max-w-sm",
          maxWidth === "md" && "max-w-md",
          maxWidth === "lg" && "max-w-lg",
          maxWidth === "xl" && "max-w-xl",
          maxWidth === "full" && "max-w-3xl",
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border bg-surface-subtle">
            <div>
              {title && (
                <h2 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 -mr-1.5 -mt-1 text-text-subtle hover:text-text-main rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <Icon name="close" variant="linear" size={20} />
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border bg-surface-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
