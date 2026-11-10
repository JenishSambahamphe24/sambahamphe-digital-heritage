// Short localized labels (place and clan names) stored as `name_i18n jsonb`,
// e.g. {"en": "Panchthar", "ne": "पाँचथर"}; validated by @repo/contracts.
export type TI18nText = Partial<Record<"en" | "ne", string>>;
