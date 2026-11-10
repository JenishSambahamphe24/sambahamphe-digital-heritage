"use client";

import type { TStatusTone } from "../status-tone.js";

import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";

import { cn } from "../cn.js";
import { STATUS_TONE_CLASSES, STATUS_TONE_ICONS } from "../status-tone.js";

export interface ToastProps {
  tone?: TStatusTone;
  title?: string;
  description: string;
  closeLabel: string;
  onOpenChange?: (open: boolean) => void;
}

// Renders inside Toaster's Radix provider; raise toasts with ToastHelper.show.
export function Toast({ tone = "info", title, description, closeLabel, onOpenChange }: ToastProps) {
  const Icon = STATUS_TONE_ICONS[tone];
  return (
    <RadixToast.Root
      // Errors interrupt the screen reader; everything else waits its turn.
      type={tone === "danger" ? "foreground" : "background"}
      onOpenChange={onOpenChange}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
        STATUS_TONE_CLASSES[tone],
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <RadixToast.Title className="font-semibold">{title}</RadixToast.Title> : null}
        <RadixToast.Description>{description}</RadixToast.Description>
      </div>
      <RadixToast.Close
        aria-label={closeLabel}
        className="focus-visible:outline-focus shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2"
      >
        <X aria-hidden="true" className="size-4" />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
