import * as React from "react";
import { cn } from "@/shared/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "subtle" | "interactive" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
  ref={ref}
  className={cn(
  "rounded-xl border-[1.5px] transition-all duration-150",
  variant === "default" && "bg-surface border-border shadow-2xs",
  variant === "subtle" && "bg-surface-subtle border-border shadow-none",
  variant === "interactive" &&
  "bg-surface border-border shadow-2xs hover:border-border-hover hover:shadow-xs cursor-pointer active:scale-[0.99]",
  className
  )}
  {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
  ref={ref}
  className={cn("flex flex-col space-y-1.5 p-4 sm:p-5", className)}
  {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
  ref={ref}
  className={cn(
  "font-semibold text-base sm:text-lg text-text-main leading-tight tracking-tight",
  className
  )}
  {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
  ref={ref}
  className={cn("text-xs sm:text-sm text-text-muted leading-relaxed", className)}
  {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-5 pt-0 sm:pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
  ref={ref}
  className={cn(
  "flex items-center px-4 sm:px-5 py-3 sm:py-3.5 border-t border-border mt-3",
  className
  )}
  {...props}
  />
));
CardFooter.displayName = "CardFooter";
