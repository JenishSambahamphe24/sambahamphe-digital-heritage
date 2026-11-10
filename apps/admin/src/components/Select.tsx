import type { SelectHTMLAttributes } from "react";

import { cn } from "@repo/ui";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        "border-border-strong bg-surface text-foreground h-10 w-full rounded-md border px-3 text-sm",
        "focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
        invalid && "border-danger",
        className,
      )}
      {...props}
    />
  );
}
