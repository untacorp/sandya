"use client";

import React from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { cn } from "@/shared/lib/utils";

export type SolarIconName =
  | "home"
  | "users"
  | "user"
  | "user-plus"
  | "health"
  | "heart-pulse"
  | "pill"
  | "box"
  | "delivery"
  | "waybill"
  | "chat"
  | "microphone"
  | "radar"
  | "sync"
  | "qr-code"
  | "printer"
  | "sos"
  | "shield"
  | "search"
  | "settings"
  | "buildings"
  | "pin"
  | "clock"
  | "check"
  | "alert"
  | "close"
  | "filter"
  | "trash"
  | "edit"
  | "arrow-left"
  | "arrow-right"
  | "arrow-down"
  | "arrow-up"
  | "flashlight"
  | "volume"
  | "add-circle";

export type SolarIconVariant = "linear" | "bold";

const SOLAR_ICON_MAP: Record<SolarIconName, { linear: string; bold: string }> = {
  home: {
  linear: "solar:home-2-linear",
  bold: "solar:home-2-bold",
  },
  users: {
  linear: "solar:users-group-two-rounded-linear",
  bold: "solar:users-group-two-rounded-bold",
  },
  user: {
  linear: "solar:user-rounded-linear",
  bold: "solar:user-rounded-bold",
  },
  "user-plus": {
  linear: "solar:user-plus-linear",
  bold: "solar:user-plus-bold",
  },
  health: {
  linear: "solar:health-linear",
  bold: "solar:health-bold",
  },
  "heart-pulse": {
  linear: "solar:heart-pulse-linear",
  bold: "solar:heart-pulse-bold",
  },
  pill: {
  linear: "solar:pill-linear",
  bold: "solar:pill-bold",
  },
  box: {
  linear: "solar:box-linear",
  bold: "solar:box-bold",
  },
  delivery: {
  linear: "solar:hand-stars-linear",
  bold: "solar:hand-stars-bold",
  },
  waybill: {
  linear: "solar:document-text-linear",
  bold: "solar:document-text-bold",
  },
  chat: {
  linear: "solar:chat-round-line-linear",
  bold: "solar:chat-round-line-bold",
  },
  microphone: {
  linear: "solar:microphone-2-linear",
  bold: "solar:microphone-2-bold",
  },
  radar: {
  linear: "solar:radar-2-linear",
  bold: "solar:radar-2-bold",
  },
  sync: {
  linear: "solar:refresh-circle-linear",
  bold: "solar:refresh-circle-bold",
  },
  "qr-code": {
  linear: "solar:qr-code-linear",
  bold: "solar:qr-code-bold",
  },
  printer: {
  linear: "solar:printer-minimalistic-linear",
  bold: "solar:printer-minimalistic-bold",
  },
  sos: {
  linear: "solar:danger-triangle-linear",
  bold: "solar:danger-triangle-bold",
  },
  shield: {
  linear: "solar:shield-check-linear",
  bold: "solar:shield-check-bold",
  },
  search: {
  linear: "solar:magnifer-linear",
  bold: "solar:magnifer-bold",
  },
  settings: {
  linear: "solar:settings-linear",
  bold: "solar:settings-bold",
  },
  buildings: {
  linear: "solar:buildings-2-linear",
  bold: "solar:buildings-2-bold",
  },
  pin: {
  linear: "solar:map-point-linear",
  bold: "solar:map-point-bold",
  },
  clock: {
  linear: "solar:clock-circle-linear",
  bold: "solar:clock-circle-bold",
  },
  check: {
  linear: "solar:check-circle-linear",
  bold: "solar:check-circle-bold",
  },
  alert: {
  linear: "solar:info-circle-linear",
  bold: "solar:info-circle-bold",
  },
  close: {
  linear: "solar:close-circle-linear",
  bold: "solar:close-circle-bold",
  },
  filter: {
  linear: "solar:filter-linear",
  bold: "solar:filter-bold",
  },
  trash: {
  linear: "solar:trash-bin-trash-linear",
  bold: "solar:trash-bin-trash-bold",
  },
  edit: {
  linear: "solar:pen-2-linear",
  bold: "solar:pen-2-bold",
  },
  "arrow-left": {
  linear: "solar:alt-arrow-left-linear",
  bold: "solar:alt-arrow-left-bold",
  },
  "arrow-right": {
  linear: "solar:alt-arrow-right-linear",
  bold: "solar:alt-arrow-right-bold",
  },
  "arrow-down": {
  linear: "solar:alt-arrow-down-linear",
  bold: "solar:alt-arrow-down-bold",
  },
  "arrow-up": {
  linear: "solar:alt-arrow-up-linear",
  bold: "solar:alt-arrow-up-bold",
  },
  flashlight: {
  linear: "solar:flashlight-linear",
  bold: "solar:flashlight-bold",
  },
  volume: {
  linear: "solar:volume-loud-linear",
  bold: "solar:volume-loud-bold",
  },
  "add-circle": {
  linear: "solar:add-circle-linear",
  bold: "solar:add-circle-bold",
  },
};

export interface IconProps {
  name: SolarIconName;
  /**
  * Strictly enforces either 'linear' or 'bold' variant.
  * Default: 'linear'
  */
  variant?: SolarIconVariant;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standard Solar Icon component for Sandya.
 * Follows strict 'linear' vs 'bold' rules per docs/design/ui-ux/02-pedoman-solar-icons.md
 */
export function Icon({
  name,
  variant = "linear",
  size = 20,
  className,
  style,
}: IconProps) {
  const iconConfig = SOLAR_ICON_MAP[name] || SOLAR_ICON_MAP.alert;
  const iconId = variant === "bold" ? iconConfig.bold : iconConfig.linear;

  return (
  <IconifyIcon
  icon={iconId}
  width={size}
  height={size}
  className={cn("shrink-0 inline-block align-middle", className)}
  style={style}
  />
  );
}
