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

  // Graceful browser & mobile swipe back handling
  React.useEffect(() => {
    if (!open || typeof window === "undefined") return;

    let hasPushed = false;
    try {
      window.history.pushState({ isModalOpen: true }, "");
      hasPushed = true;
    } catch {
      // Push state ignored in restricted contexts
    }

    const handlePopState = () => {
      hasPushed = false;
      onOpenChange(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (hasPushed && window.history.state?.isModalOpen) {
        window.history.back();
      }
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full z-10 bg-surface rounded-2xl border-[1.5px] border-border shadow-xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] animate-in zoom-in-95 duration-150",
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
            <div className="min-w-0 pr-2">
              {title && (
                <h2 className="text-base sm:text-lg font-bold text-text-main tracking-tight break-words">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-text-muted mt-0.5 break-words">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-text-subtle hover:text-text-main rounded-lg hover:bg-surface-muted transition-colors cursor-pointer shrink-0"
              aria-label="Tutup modal"
            >
              <Icon name="close" variant="linear" size={20} />
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 p-4 border-t border-border bg-surface-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
