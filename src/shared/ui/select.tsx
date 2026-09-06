"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/utils";
import { Icon, type SolarIconName } from "@/shared/ui/icon";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  category?: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  icon?: SolarIconName;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options = [],
  label,
  placeholder = "Pilih opsi...",
  icon,
  error,
  helperText,
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    minWidth: number;
    maxWidth: number;
  }>({ left: 0, minWidth: 0, maxWidth: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedItem = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    options.forEach((opt) => {
      if (opt.category) cats.add(opt.category);
    });
    return Array.from(cats);
  }, [options]);

  const filteredItems = useMemo(() => {
    return options.filter((item) => {
      const matchSearch = item.label.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
      const matchFilter = filter === "ALL" || item.category === filter;
      return matchSearch && matchFilter;
    });
  }, [options, search, filter]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popoverMaxHeight = 280;

    const openUp = spaceBelow < popoverMaxHeight && spaceAbove > spaceBelow;

    setCoords({
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 260)),
      minWidth: rect.width,
      maxWidth: Math.min(480, window.innerWidth - 16),
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SelectOption) => {
    onChange(item.value);
    setIsOpen(false);
    setSearch("");
  };

  const showSearch = options.length > 10;

  return (
    <div className="w-full space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted block">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-text-subtle z-10">
            <Icon name={icon} variant="linear" size={18} />
          </div>
        )}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "w-full h-10 flex items-center justify-between rounded-lg border border-border bg-surface text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-strong transition-colors text-left cursor-pointer",
            icon ? "pl-10" : "pl-3",
            "pr-3",
            error && "border-status-danger focus:ring-status-danger",
            disabled && "cursor-not-allowed opacity-50 bg-surface-subtle",
            className
          )}
        >
          <span className="truncate">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <Icon name={isOpen ? "arrow-up" : "arrow-down"} size={16} className="text-text-muted shrink-0 ml-2" />
        </button>
      </div>

      {error ? (
        <p className="text-xs font-medium text-status-danger">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}

      {/* Dropdown Popover (Rendered in Portal to escape overflow-hidden in modals/tables) */}
      {isOpen && mounted && coords.minWidth > 0 && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            minWidth: `${coords.minWidth}px`,
            maxWidth: `${coords.maxWidth}px`,
            zIndex: 9999,
          }}
          className={cn(
            "bg-surface rounded-xl border border-border shadow-xl overflow-hidden flex flex-col max-h-[280px]",
            "animate-in fade-in duration-100",
            coords.top !== undefined ? "origin-top zoom-in-95" : "origin-bottom zoom-in-95"
          )}
        >
          {/* Search Box */}
          {showSearch && (
            <div className="p-2 border-b border-border bg-surface-subtle shrink-0">
              <div className="relative">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari..."
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-xs font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Filters Horizontal Scroll */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 p-2 border-b border-border bg-surface overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={cn(
                  "shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer",
                  filter === "ALL" ? "bg-primary text-white" : "bg-surface-muted text-text-muted hover:bg-surface-hover"
                )}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer",
                    filter === cat ? "bg-primary text-white" : "bg-surface-muted text-text-muted hover:bg-surface-hover"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Item List */}
          <div className="overflow-y-auto flex-1 p-1">
            {filteredItems.length === 0 ? (
              <div className="py-4 text-center text-xs text-text-muted">
                Tidak ada opsi yang ditemukan.
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full text-left px-3 py-2 flex items-center justify-between gap-2 rounded-lg transition-colors cursor-pointer",
                    item.value === value ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-text-main"
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold truncate">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-text-subtle truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.value === value && (
                    <Icon name="check" size={16} className="text-primary shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
