import type { InputHTMLAttributes } from "react";

import { cn } from "../cn.js";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "border-border-strong bg-surface text-foreground h-10 w-full rounded-md border px-3 text-sm",
        // Border and outline share the focus colour with no gap, so focus reads as one ring.
        "placeholder:text-foreground-subtle focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
        invalid && "border-danger focus-visible:border-danger focus-visible:outline-danger",
        className,
      )}
      {...props}
    />
  );
}
