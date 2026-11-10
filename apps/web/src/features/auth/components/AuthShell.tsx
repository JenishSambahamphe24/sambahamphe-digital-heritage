import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "#/i18n/navigation";
import { BRAND_LOGO } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

import { LanguageSwitcher } from "../../site/components/LanguageSwitcher";
import { AuthPainting } from "./AuthPainting";

export interface AuthShellProps {
  children: ReactNode;
}

// Design: docs/design/canvas/Main.dc.html (desktop) and Mobile.dc.html.
export function AuthShell({ children }: AuthShellProps) {
  const t = useTranslations();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthPainting />
      <div className="flex flex-1 flex-col px-4 pt-4 pb-6 lg:px-16 lg:py-8">
        <header className="hidden items-center justify-between gap-4 lg:flex">
          <Link href={ROUTES.home} className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO.src}
              width={BRAND_LOGO.width}
              height={BRAND_LOGO.height}
              alt={t("logo_alt")}
              sizes="48px"
              className="h-11 w-auto"
            />
            <span className="font-display text-foreground text-lg font-semibold">
              {t("site_name")}
            </span>
          </Link>
          <LanguageSwitcher />
        </header>
        <main className="flex flex-1 items-start justify-center lg:items-center lg:py-8">
          <div className="flex w-full max-w-100 flex-col gap-5 lg:gap-6">{children}</div>
        </main>
        <footer className="text-foreground-muted hidden text-xs lg:block">
          {t("footer_text")}
        </footer>
      </div>
    </div>
  );
}
