import { useTranslations } from "use-intl";

import { cn } from "@repo/ui";

import { LOCALES } from "../../i18n/locale.constants";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";

export interface LanguageSwitchProps {
  // Light text for the solid navbar.
  onPrimary?: boolean;
}

export function LanguageSwitch({ onPrimary = false }: LanguageSwitchProps) {
  const t = useTranslations();
  const { locale, setLocale } = useLocaleSwitch();
  return (
    <div role="group" aria-label={t("language_label")} className="flex gap-1 text-sm">
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option)}
            className={cn(
              "rounded-md px-3 py-2 focus-visible:outline-2",
              onPrimary
                ? active
                  ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                  : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                : active
                  ? "bg-surface-muted font-medium"
                  : "text-foreground-muted hover:text-foreground",
              onPrimary && "focus-visible:outline-primary-foreground",
            )}
          >
            {t(`language_${option}`)}
          </button>
        );
      })}
    </div>
  );
}
