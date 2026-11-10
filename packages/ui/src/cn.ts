import type { ClassValue } from "clsx";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// The one helper kept as a plain function (like Bitsky's): it is called in
// almost every component, and a class wrapper would add nothing.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
