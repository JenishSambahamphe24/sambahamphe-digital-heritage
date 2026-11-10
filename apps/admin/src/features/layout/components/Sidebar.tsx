import { Link } from "@tanstack/react-router";
import { MapPin, ScrollText, UserRound, Users } from "lucide-react";
import { useTranslations } from "use-intl";

import { BRAND_LOGO } from "#/lib/brand";

const NAV_ITEMS = [
  { to: "/persons", label: "nav_persons", icon: UserRound },
  { to: "/places", label: "nav_places", icon: MapPin },
  { to: "/users", label: "nav_users", icon: Users },
  { to: "/audit-log", label: "nav_audit_log", icon: ScrollText },
] as const;

const NAV_ICON_SIZE = 18;
const NAV_LINK =
  "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-primary-foreground flex h-10 items-center gap-3 rounded-md px-3 text-sm focus-visible:outline-2";
const NAV_LINK_ACTIVE = "bg-primary-foreground/15 text-primary-foreground font-medium";

// Solid brand colour, full height, with its own scroll area so a long menu
// never moves the page.
export function Sidebar() {
  const t = useTranslations();
  return (
    <div className="bg-primary text-primary-foreground border-r-primary-foreground/20 flex h-screen w-64 flex-col overflow-hidden border-r">
      <div className="border-b-primary-foreground/20 flex h-18 shrink-0 items-center gap-3 border-b px-4">
        <img
          src={BRAND_LOGO.src}
          width={BRAND_LOGO.width}
          height={BRAND_LOGO.height}
          alt={t("logo_alt")}
          className="bg-surface size-11 shrink-0 rounded-full object-contain p-0.5"
        />
        <p className="font-display text-lg leading-tight font-semibold">{t("admin_title")}</p>
      </div>
      <nav
        aria-label={t("nav_label")}
        className="scrollbar-slim grow overflow-y-auto px-3 py-4 select-none"
      >
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={NAV_LINK}
              activeProps={{ className: NAV_LINK_ACTIVE }}
            >
              <item.icon size={NAV_ICON_SIZE} aria-hidden />
              {t(item.label)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
