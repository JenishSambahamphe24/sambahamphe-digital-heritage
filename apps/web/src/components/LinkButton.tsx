import type { ComponentProps } from "react";

import { cn } from "@repo/ui";

import { Link } from "#/i18n/navigation";

export type TLinkButtonVariant = "primary" | "secondary" | "inverse";

const VARIANT_CLASSES: Record<TLinkButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "border border-border-strong bg-surface text-foreground hover:bg-surface-muted",
  inverse: "border border-inverse-muted/60 text-primary-foreground hover:bg-primary-foreground/10",
};

export interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: TLinkButtonVariant;
}

// A navigation link that looks like Button; a <button> must not navigate.
export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
        "focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
