import type { LucideIcon } from "lucide-react";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

export type TStatusTone = "info" | "success" | "warning" | "danger";

export const STATUS_TONE_CLASSES: Record<TStatusTone, string> = {
  info: "border-info bg-info-subtle text-info",
  success: "border-success bg-success-subtle text-success",
  warning: "border-warning bg-warning-subtle text-warning",
  danger: "border-danger bg-danger-subtle text-danger",
};

// Each tone has its own shape so the status reads without relying on colour.
export const STATUS_TONE_ICONS: Record<TStatusTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};
