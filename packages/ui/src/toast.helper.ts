import type { TStatusTone } from "./status-tone.js";

export interface IToast {
  id: number;
  tone: TStatusTone;
  title?: string;
  description: string;
}

export type TToastInput = Omit<IToast, "id">;

type TListener = () => void;

// A module-level store so any code (a mutation's onError, a form submit) can
// raise a toast without a React context; Toaster subscribes to it. Arrow
// properties so subscribe/snapshot can be handed to useSyncExternalStore.
export class ToastHelper {
  private static toasts: readonly IToast[] = [];
  private static listeners = new Set<TListener>();
  private static nextId = 1;

  static show = (input: TToastInput): number => {
    const id = ToastHelper.nextId++;
    ToastHelper.toasts = [...ToastHelper.toasts, { ...input, id }];
    ToastHelper.emit();
    return id;
  };

  static dismiss = (id: number): void => {
    ToastHelper.toasts = ToastHelper.toasts.filter((toast) => toast.id !== id);
    ToastHelper.emit();
  };

  static subscribe = (listener: TListener): (() => void) => {
    ToastHelper.listeners.add(listener);
    return () => ToastHelper.listeners.delete(listener);
  };

  static snapshot = (): readonly IToast[] => ToastHelper.toasts;

  private static emit(): void {
    ToastHelper.listeners.forEach((listener) => listener());
  }
}
