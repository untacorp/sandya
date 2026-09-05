import * as React from "react";
import { cn } from "@/shared/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
  <div
  className={cn(
  "animate-pulse rounded-lg bg-surface-muted border border-border/50",
  className
  )}
  {...props}
  />
  );
}
