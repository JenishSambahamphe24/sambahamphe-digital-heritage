import { useTranslations } from "next-intl";

import { Alert } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { ROUTES } from "#/lib/routes";

export function HomePage() {
  const t = useTranslations();
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <p className="text-accent text-sm font-medium tracking-wide uppercase">{t("site_name")}</p>
      <h1 className="font-display text-foreground text-4xl font-semibold">{t("home_title")}</h1>
      <p className="text-foreground-muted text-lg">{t("home_intro")}</p>
      <Alert tone="info">{t("home_status")}</Alert>
      <div className="flex flex-wrap gap-3">
        <Link
          href={ROUTES.register}
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
        >
          {t("home_cta_register")}
        </Link>
        <Link
          href={ROUTES.login}
          className="border-border-strong hover:bg-surface-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
        >
          {t("home_cta_login")}
        </Link>
      </div>
    </section>
  );
}
