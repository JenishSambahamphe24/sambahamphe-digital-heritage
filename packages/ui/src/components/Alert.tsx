import type { TStatusTone } from "../status-tone.js";
import type { ReactNode } from "react";

import { cn } from "../cn.js";
import { STATUS_TONE_CLASSES, STATUS_TONE_ICONS } from "../status-tone.js";

export interface AlertProps {
  tone?: TStatusTone;
  children: ReactNode;
  className?: string;
}

// For states that persist on the page (an invalid link, a missing token).
// Short-lived feedback goes through ToastHelper instead.
export function Alert({ tone = "info", children, className }: AlertProps) {
  const Icon = STATUS_TONE_ICONS[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-3 rounded-md border px-4 py-3 text-sm",
        STATUS_TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
