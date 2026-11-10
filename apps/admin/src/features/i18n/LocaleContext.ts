import type { TLocale } from "./locale.constants";

import { createContext } from "react";

export interface ILocaleContext {
  locale: TLocale;
  setLocale: (locale: TLocale) => void;
}

export const LocaleContext = createContext<ILocaleContext | null>(null);
