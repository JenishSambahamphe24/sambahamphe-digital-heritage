import { useTranslations } from "use-intl";

import { cn } from "@repo/ui";

import { LOCALES } from "../../i18n/locale.constants";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";

export function LanguageSwitch() {
  const t = useTranslations();
  const { locale, setLocale } = useLocaleSwitch();
  return (
    <div role="group" aria-label={t("language_label")} className="flex gap-1 text-sm">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className={cn(
            "rounded px-2 py-1",
            option === locale
              ? "bg-surface-muted font-medium"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          {t(`language_${option}`)}
        </button>
      ))}
    </div>
  );
}
