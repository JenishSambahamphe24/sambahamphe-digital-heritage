"use client";

import * as RadixToast from "@radix-ui/react-toast";

import { useToasts } from "../hooks/useToasts.js";
import { ToastHelper } from "../toast.helper.js";
import { Toast } from "./Toast.js";

export const TOAST_DURATION_MS = 5000;

export interface ToasterProps {
  closeLabel: string;
  duration?: number;
}

// Mount once near the app root. Bottom-right on wide screens, full width with
// the page gutter on phones.
export function Toaster({ closeLabel, duration = TOAST_DURATION_MS }: ToasterProps) {
  const toasts = useToasts();
  return (
    <RadixToast.Provider duration={duration} swipeDirection="right">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          tone={toast.tone}
          title={toast.title}
          description={toast.description}
          closeLabel={closeLabel}
          onOpenChange={(open) => {
            if (!open) ToastHelper.dismiss(toast.id);
          }}
        />
      ))}
      <RadixToast.Viewport className="fixed right-0 bottom-0 z-50 flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </RadixToast.Provider>
  );
}
