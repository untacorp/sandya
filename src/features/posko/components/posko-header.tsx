"use client";

import * as React from "react";
import { UnifiedAppHeader, type UnifiedAppHeaderProps } from "@/features/navigation";

export function PoskoHeader(props: UnifiedAppHeaderProps) {
  return <UnifiedAppHeader {...props} />;
}
