"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@repo/ui";

import { Link, usePathname } from "#/i18n/navigation";
import { routing } from "#/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t("language_label")} className="flex gap-2 text-sm">
      {routing.locales.map((option) => (
        <Link
          key={option}
          href={pathname}
          locale={option}
          aria-current={option === locale ? "true" : undefined}
          className={cn(
            "rounded px-2 py-1",
            option === locale
              ? "bg-surface-muted font-medium"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          {t(`language_${option}`)}
        </Link>
      ))}
    </nav>
  );
}
