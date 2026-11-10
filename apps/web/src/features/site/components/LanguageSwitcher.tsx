"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@repo/ui";

import { Link, usePathname } from "#/i18n/navigation";
import { routing } from "#/i18n/routing";

export interface LanguageSwitcherProps {
  // Only the other language, as a pill that stays readable over a photo.
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const options = compact ? routing.locales.filter((option) => option !== locale) : routing.locales;
  return (
    <nav aria-label={t("language_label")} className="flex gap-1 text-sm">
      {options.map((option) => (
        <Link
          key={option}
          href={pathname}
          locale={option}
          lang={option}
          aria-current={option === locale ? "true" : undefined}
          className={cn(
            "rounded-md px-3 py-2",
            compact && "bg-surface/90 text-foreground font-medium",
            !compact &&
              (option === locale
                ? "bg-surface-muted text-foreground font-medium"
                : "text-foreground-muted hover:text-foreground"),
          )}
        >
          {t(`language_${option}`)}
        </Link>
      ))}
    </nav>
  );
}
