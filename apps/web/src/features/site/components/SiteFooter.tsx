import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "#/i18n/navigation";
import { BRAND_LOGO } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="bg-foreground text-inverse-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-14 pb-8 md:px-12">
        <div className="flex flex-wrap gap-x-12 gap-y-10">
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image
                src={BRAND_LOGO.src}
                width={BRAND_LOGO.width}
                height={BRAND_LOGO.height}
                alt=""
                sizes="44px"
                className="bg-surface h-11 w-11 rounded-full object-contain p-1"
              />
              <span className="font-display text-primary-foreground text-lg font-semibold">
                {t("site_name")}
              </span>
            </div>
            <p className="max-w-sm text-sm">{t("site_tagline")}</p>
          </div>
          <nav aria-label={t("footer_sangh")} className="flex flex-col gap-2.5 text-sm">
            <span className="text-primary-foreground font-semibold">{t("footer_sangh")}</span>
            <Link href={ROUTES.about} className="hover:text-primary-foreground">
              {t("nav_about")}
            </Link>
            <Link href={ROUTES.boards} className="hover:text-primary-foreground">
              {t("nav_boards")}
            </Link>
          </nav>
          <nav aria-label={t("footer_account")} className="flex flex-col gap-2.5 text-sm">
            <span className="text-primary-foreground font-semibold">{t("footer_account")}</span>
            <Link href={ROUTES.login} className="hover:text-primary-foreground">
              {t("nav_login")}
            </Link>
            <Link href={ROUTES.register} className="hover:text-primary-foreground">
              {t("nav_register")}
            </Link>
          </nav>
        </div>
        <div className="border-primary-foreground/15 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-sm">
          <span>{t("footer_text")}</span>
          <LanguageSwitcher compact />
        </div>
      </div>
    </footer>
  );
}
