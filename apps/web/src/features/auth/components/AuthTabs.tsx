import { useTranslations } from "next-intl";
import Image from "next/image";

import { cn } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { HERITAGE_IMAGES } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

export interface AuthTabsProps {
  active: "login" | "register";
}

const TABS = [
  { id: "login", href: ROUTES.login, label: "auth_login_title" },
  { id: "register", href: ROUTES.register, label: "auth_register_submit" },
] as const;

// Links rather than ARIA tabs: each form is its own URL, so email links and
// the back button land on the right one.
export function AuthTabs({ active }: AuthTabsProps) {
  const t = useTranslations();
  return (
    <>
      <Image
        src={HERITAGE_IMAGES.motif.src}
        width={HERITAGE_IMAGES.motif.width}
        height={HERITAGE_IMAGES.motif.height}
        alt=""
        sizes="40px"
        className="hidden size-10 lg:block"
      />
      <nav
        aria-label={t("auth_tabs_label")}
        className="border-border flex justify-center gap-8 border-b lg:justify-start lg:gap-6"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-1 pt-2 pb-3 text-base lg:pt-0",
              tab.id === active
                ? "border-primary text-foreground font-semibold"
                : "text-foreground-muted hover:text-foreground border-transparent font-medium",
            )}
          >
            {t(tab.label)}
          </Link>
        ))}
      </nav>
    </>
  );
}
