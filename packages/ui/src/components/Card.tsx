import type { HTMLAttributes } from "react";

import { cn } from "../cn.js";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div className={cn("border-border bg-surface rounded-lg border p-6", className)} {...props} />
  );
}
