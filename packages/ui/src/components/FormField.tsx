import type { ReactNode } from "react";

import { cn } from "../cn.js";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  // Off only for a control that can never show a message (a plain select).
  reserveMessage?: boolean;
  children: ReactNode;
}

// The message line is always rendered, so an error appearing never moves the
// fields below it. Pass `aria-describedby={`${id}-message`}` to the input so
// the error or hint is read out with the field; the line is a polite live
// region, so a new error is announced without stealing focus.
export function FormField({
  id,
  label,
  error,
  hint,
  reserveMessage = true,
  children,
}: FormFieldProps) {
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      {reserveMessage || message ? (
        <p
          id={`${id}-message`}
          aria-live="polite"
          className={cn("min-h-5 text-sm", error ? "text-danger" : "text-foreground-muted")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
