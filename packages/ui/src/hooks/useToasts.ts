"use client";

import type { IToast } from "../toast.helper.js";

import { useSyncExternalStore } from "react";

import { ToastHelper } from "../toast.helper.js";

export function useToasts(): readonly IToast[] {
  return useSyncExternalStore(ToastHelper.subscribe, ToastHelper.snapshot, ToastHelper.snapshot);
}
