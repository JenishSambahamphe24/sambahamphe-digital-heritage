import { useTranslations } from "next-intl";

import { cn } from "@repo/ui";

import { Link } from "#/i18n/navigation";
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
    <nav
      aria-label={t("auth_tabs_label")}
      className="border-border flex justify-center gap-8 border-b"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-1 pt-2 pb-3 text-base",
            tab.id === active
              ? "border-primary text-foreground font-semibold"
              : "text-foreground-muted hover:text-foreground border-transparent font-medium",
          )}
        >
          {t(tab.label)}
        </Link>
      ))}
    </nav>
  );
}
