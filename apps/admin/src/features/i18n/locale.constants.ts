export const LOCALES = ["en", "ne"] as const;
export type TLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: TLocale = "en";
export const LOCALE_STORAGE_KEY = "admin.locale";
