import type { TextareaHTMLAttributes } from "react";

import { cn } from "@repo/ui";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "border-border-strong bg-surface text-foreground min-h-20 w-full rounded-md border px-3 py-2 text-sm",
        "focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
        invalid && "border-danger",
        className,
      )}
      {...props}
    />
  );
}
