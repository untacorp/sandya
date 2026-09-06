"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { type Posko, type PostStatus } from "@/shared/types";

export const POSKO_CARD_CONSTANTS = {
  PERCENTAGE_BASE: 100,
  HIGH_OCCUPANCY_THRESHOLD: 90,
  MEDIUM_OCCUPANCY_THRESHOLD: 70,
  PIN_ICON_SIZE: 13,
} as const;

export interface PoskoCardProps {
  posko: Posko;
  onToggleStatus?: (id: string, newStatus: PostStatus) => void;
  className?: string;
  showToggleAction?: boolean;
}

export function PoskoCard({
  posko,
  onToggleStatus,
  className,
  showToggleAction = true,
}: PoskoCardProps) {
  const { refugees } = usePoskoStore();
  const isEvac = posko.status === "HAZARD_EVACUATION";
  const realCount = refugees.filter((r) => r.postId === posko.id).length || posko.currentRefugees || 0;
  const percent = Math.round((realCount / (posko.capacity || 1)) * POSKO_CARD_CONSTANTS.PERCENTAGE_BASE);

  const getPostTypeLabel = (type: string) => {
  switch (type) {
  case "FIELD_SHELTER":
  return "Posko Tenda";
  case "MEDICAL_POST":
  return "Pos Medis";
  case "MAIN_WAREHOUSE":
  return "Gudang Logistik";
  default:
  return "Posko Lapangan";
  }
  };

  return (
  <Card
  className={cn(
  "p-4 space-y-3 transition-all",
  isEvac ? "border-status-danger bg-status-danger-bg/15" : "border-border bg-surface",
  className
  )}
  >
  {/* Top Row: Consistent Top-Left Status Badge & Single Capacity Count */}
  <div className="flex items-center justify-between gap-2">
  <Badge
  variant={
  posko.status === "HAZARD_EVACUATION"
  ? "danger"
  : posko.status === "OPERATIONAL_NORMAL"
  ? "safe"
  : "warning"
  }
  size="sm"
  >
  {posko.status === "HAZARD_EVACUATION"
  ? "Evakuasi"
  : posko.status === "OPERATIONAL_NORMAL"
  ? "Normal"
  : "Siaga"}
  </Badge>

  <span className="text-xs font-bold text-text-main">
  {realCount}{" "}
  <span className="font-normal text-text-muted">/ {posko.capacity} Jiwa</span>
  </span>
  </div>

  {/* Main Info: Posko Name & Location */}
  <div className="space-y-0.5">
  <h3 className="text-sm font-bold text-text-main">
  {posko.name}
  </h3>
  <p className="text-xs text-text-muted flex items-center gap-1">
  <Icon name="pin" variant="linear" size={POSKO_CARD_CONSTANTS.PIN_ICON_SIZE} />
  {posko.locationName}
  </p>
  </div>

  {/* Progress Bar Okupansi (No duplicate number, percentage only) */}
  <div className="space-y-1">
  <div className="flex justify-between text-xs text-text-muted font-medium">
  <span>Kapasitas Tampung</span>
  <span
  className={
  percent > POSKO_CARD_CONSTANTS.HIGH_OCCUPANCY_THRESHOLD
  ? "text-status-danger font-bold"
  : "text-text-main"
  }
  >
  {percent}%
  </span>
  </div>
  <div className="w-full h-1.5 rounded-full bg-surface-muted border border-border overflow-hidden">
  <div
  className={cn(
  "h-full rounded-full transition-all duration-300",
  percent > POSKO_CARD_CONSTANTS.HIGH_OCCUPANCY_THRESHOLD
  ? "bg-status-danger"
  : percent > POSKO_CARD_CONSTANTS.MEDIUM_OCCUPANCY_THRESHOLD
  ? "bg-status-warning"
  : "bg-status-safe"
  )}
  style={{ width: `${Math.min(POSKO_CARD_CONSTANTS.PERCENTAGE_BASE, percent)}%` }}
  />
  </div>
  </div>

  {/* Action Footer */}
  <div className="flex items-center justify-between pt-2 border-t border-border gap-2 text-xs">
  <span className="text-text-muted font-medium">
  {getPostTypeLabel(posko.postType)}
  </span>

  <div className="flex items-center gap-1.5">
  {showToggleAction && onToggleStatus && (
  <>
  {posko.status !== "HAZARD_EVACUATION" ? (
  <Button
  variant="ghost"
  size="sm"
  onClick={() => onToggleStatus(posko.id, "HAZARD_EVACUATION")}
  >
  Tandai Evakuasi
  </Button>
  ) : (
  <Button
  variant="secondary"
  size="sm"
  onClick={() => onToggleStatus(posko.id, "OPERATIONAL_NORMAL")}
  >
  Kembalikan Normal
  </Button>
  )}
  </>
  )}

  <Link href={`/posko/${posko.id}`}>
  <Button
  variant="primary"
  size="sm"
  icon="arrow-right"
  iconVariant="bold"
  >
  Buka Posko
  </Button>
  </Link>
  </div>
  </div>
  </Card>
  );
}
