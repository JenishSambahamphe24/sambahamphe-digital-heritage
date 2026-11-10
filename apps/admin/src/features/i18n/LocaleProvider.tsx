import type { TLocale } from "./locale.constants";
import type { ReactNode } from "react";

import { useMemo, useState } from "react";
import { IntlProvider } from "use-intl";

import en from "../../../messages/en.json";
import ne from "../../../messages/ne.json";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES } from "./locale.constants";
import { LocaleContext } from "./LocaleContext";

const MESSAGES = { en, ne } satisfies Record<TLocale, Record<string, string>>;

function readStoredLocale(): TLocale {
  // Storage can be unavailable (private mode, blocked site data): fall back.
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return LOCALES.find((locale) => locale === stored) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<TLocale>(readStoredLocale);
  const value = useMemo(
    () => ({
      locale,
      setLocale: (next: TLocale) => {
        setLocaleState(next);
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        } catch {
          // Preference just isn't remembered; the switch still works.
        }
      },
    }),
    [locale],
  );
  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Kathmandu">
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
