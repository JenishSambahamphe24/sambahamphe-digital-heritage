"use client";

import { useTranslations } from "next-intl";

import { Link } from "#/i18n/navigation";
import { ROUTES } from "#/lib/routes";

import { useMe } from "../../account/hooks/useMe";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const t = useTranslations();
  const { data: me } = useMe();
  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href={ROUTES.home} className="font-display text-primary text-lg font-semibold">
          {t("site_name")}
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            {me ? (
              <Link href={ROUTES.account} className="hover:text-primary">
                {t("nav_account")}
              </Link>
            ) : (
              <>
                <Link href={ROUTES.login} className="hover:text-primary">
                  {t("nav_login")}
                </Link>
                <Link href={ROUTES.register} className="hover:text-primary">
                  {t("nav_register")}
                </Link>
              </>
            )}
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
