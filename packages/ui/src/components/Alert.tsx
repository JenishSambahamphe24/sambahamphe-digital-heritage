import type { ReactNode } from "react";

import { cn } from "../cn.js";

export type TAlertTone = "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<TAlertTone, string> = {
  info: "border-info bg-info-subtle text-info",
  success: "border-success bg-success-subtle text-success",
  warning: "border-warning bg-warning-subtle text-warning",
  danger: "border-danger bg-danger-subtle text-danger",
};

export interface AlertProps {
  tone?: TAlertTone;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border-l-4 px-4 py-3 text-sm", TONE_CLASSES[tone], className)}
    >
      {children}
    </div>
  );
}
