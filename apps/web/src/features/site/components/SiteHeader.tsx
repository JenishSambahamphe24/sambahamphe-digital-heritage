"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@repo/ui";

import { LinkButton } from "#/components/LinkButton";
import { Link, usePathname } from "#/i18n/navigation";
import { BRAND_LOGO } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

import { useMe } from "../../account/hooks/useMe";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Only pages that exist; family tree, news, events and gallery join as they ship.
const NAV_ITEMS = [
  { href: ROUTES.home, label: "nav_home" },
  { href: ROUTES.about, label: "nav_about" },
  { href: ROUTES.boards, label: "nav_boards" },
] as const;

export function SiteHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: me } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);
  // The home hero is a dark illustration: the header sits on it, transparent.
  const overlay = pathname === ROUTES.home;
  const isActive = (href: string) =>
    href === ROUTES.home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "z-20 w-full",
        overlay
          ? "text-primary-foreground absolute inset-x-0 top-0"
          : "border-border bg-surface relative border-b",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4 md:px-12">
        <Link href={ROUTES.home} className="mr-auto flex items-center gap-3">
          <Image
            src={BRAND_LOGO.src}
            width={BRAND_LOGO.width}
            height={BRAND_LOGO.height}
            alt={t("logo_alt")}
            sizes="44px"
            preload
            className={cn("h-11 w-auto", overlay && "bg-surface rounded-full p-1")}
          />
          <span
            className={cn("font-display text-lg font-semibold", overlay ? "" : "text-foreground")}
          >
            {t("site_name")}
          </span>
        </Link>

        <nav aria-label={t("nav_main")} className="hidden gap-1 text-sm font-medium md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "border-b-2 px-3 py-2",
                isActive(item.href)
                  ? overlay
                    ? "border-inverse-accent"
                    : "border-primary text-primary"
                  : cn(
                      "border-transparent",
                      overlay
                        ? "text-inverse-muted hover:text-primary-foreground"
                        : "text-foreground-muted hover:text-foreground",
                    ),
              )}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher compact />
          {me ? (
            <LinkButton href={ROUTES.account} variant={overlay ? "inverse" : "secondary"}>
              {t("nav_account")}
            </LinkButton>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className={cn(
                  "px-3 py-2 text-sm font-medium",
                  overlay ? "text-primary-foreground" : "text-primary",
                )}
              >
                {t("nav_login")}
              </Link>
              <LinkButton href={ROUTES.register} variant={overlay ? "secondary" : "primary"}>
                {t("nav_become_member")}
              </LinkButton>
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? t("nav_menu_close") : t("nav_menu_open")}
          onClick={() => setMenuOpen((open) => !open)}
          className={cn(
            "flex size-11 items-center justify-center rounded-md md:hidden",
            overlay ? "bg-primary-foreground/15" : "bg-surface-muted",
          )}
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="site-menu"
          className="border-border bg-surface text-foreground absolute inset-x-0 top-full border-b shadow-lg md:hidden"
        >
          <nav aria-label={t("nav_main")} className="flex flex-col px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "py-3 text-base font-medium",
                  isActive(item.href) ? "text-primary" : "text-foreground",
                )}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
          <div className="border-border flex flex-col gap-3 border-t px-4 py-4">
            {me ? (
              <LinkButton
                href={ROUTES.account}
                variant="secondary"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav_account")}
              </LinkButton>
            ) : (
              <>
                <LinkButton href={ROUTES.register} onClick={() => setMenuOpen(false)}>
                  {t("nav_become_member")}
                </LinkButton>
                <LinkButton
                  href={ROUTES.login}
                  variant="secondary"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav_login")}
                </LinkButton>
              </>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      ) : null}
    </header>
  );
}
