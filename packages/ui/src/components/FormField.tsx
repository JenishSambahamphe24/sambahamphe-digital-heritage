import type { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

// Pass `aria-describedby={`${id}-message`}` to the input so the error or hint
// is read out with the field.
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      {message ? (
        <p
          id={`${id}-message`}
          className={error ? "text-danger text-sm" : "text-foreground-muted text-sm"}
          role={error ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
