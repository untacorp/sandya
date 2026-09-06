"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { DISASTER_NEEDS_CATALOG, type DisasterNeedItem } from "@/core/codecs/needs-catalog";
import { Icon } from "@/shared/ui/icon";

interface DisasterCatalogComboboxProps {
  value: number;
  onChange: (id: number, cluster: string) => void;
}

const CLUSTER_LABELS: Record<string, string> = {
  ALL: "Semua Kategori",
  FOOD_WATER: "Pangan & Air",
  MEDICAL: "Medis",
  INFANT: "Bayi & Balita",
  HYGIENE: "Sanitasi",
  CLOTHING_BEDDING: "Sandang & Tidur",
  ASSISTIVE: "Alat Disabilitas",
  EMERGENCY_TOOLS: "Peralatan Darurat",
};

export function DisasterCatalogCombobox({ value, onChange }: DisasterCatalogComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const containerRef = useRef<HTMLDivElement>(null);

  const catalogList = useMemo(() => Object.values(DISASTER_NEEDS_CATALOG), []);
  const selectedItem = DISASTER_NEEDS_CATALOG[value];

  const filteredItems = useMemo(() => {
    return catalogList.filter((item) => {
      const matchSearch = item.nameId.toLowerCase().includes(search.toLowerCase()) || 
                          item.nameEn.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "ALL" || item.cluster === filter;
      return matchSearch && matchFilter;
    });
  }, [catalogList, search, filter]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (item: DisasterNeedItem) => {
    onChange(item.id, item.cluster);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 flex items-center justify-between rounded-lg border border-border bg-surface text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-strong transition-colors text-left"
      >
        <span className="truncate">
          {selectedItem
            ? `${selectedItem.nameId} (${CLUSTER_LABELS[selectedItem.cluster] || "Logistik"})`
            : "Cari dan pilih komoditas bencana..."}
        </span>
        <Icon name={isOpen ? "arrow-up" : "arrow-down"} size={16} className="text-text-muted shrink-0 ml-2" />
      </button>

      {/* Dropdown Popover (Inline to prevent clipping in modal) */}
      {isOpen && (
        <div className="mt-2 w-full bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[280px]">
          
          {/* Search Box */}
          <div className="p-2 border-b border-border bg-surface-subtle shrink-0">
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama barang (Beras, Obat, Genset)..."
                className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-xs font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Filters Horizontal Scroll */}
          <div className="flex items-center gap-1.5 p-2 border-b border-border bg-surface overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
            {Object.entries(CLUSTER_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                  filter === key
                    ? "bg-primary text-white"
                    : "bg-surface-muted text-text-muted hover:bg-surface-hover"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Item List */}
          <div className="overflow-y-auto flex-1 p-1">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">
                Komoditas &quot;{search}&quot; tidak ditemukan dalam filter ini.
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3 py-2.5 flex flex-col gap-0.5 rounded-md transition-colors ${
                    item.id === value ? "bg-primary/10" : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-main">
                      {item.nameId}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {CLUSTER_LABELS[item.cluster]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-subtle">
                      {item.nameEn}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
