import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "#/i18n/navigation";
import { BRAND_LOGO, HERITAGE_IMAGES } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

import { LanguageSwitcher } from "../../site/components/LanguageSwitcher";

// A banner above the form on phones, a full-height panel on the right on desktop.
export function AuthPainting() {
  const t = useTranslations();
  return (
    <div className="bg-surface-muted relative h-60 shrink-0 overflow-hidden lg:sticky lg:top-0 lg:order-last lg:h-screen lg:w-5/12">
      <Image
        src={HERITAGE_IMAGES.painting.src}
        alt={t("auth_painting_alt")}
        fill
        preload
        sizes="(min-width: 1024px) 42vw, 100vw"
        className="object-cover object-top"
      />
      <div className="absolute inset-x-4 top-3 flex items-center justify-between lg:hidden">
        <Link href={ROUTES.home}>
          <Image
            src={BRAND_LOGO.src}
            width={BRAND_LOGO.width}
            height={BRAND_LOGO.height}
            alt={t("logo_alt")}
            sizes="40px"
            className="bg-surface size-10 rounded-full object-contain p-1"
          />
        </Link>
        <LanguageSwitcher compact />
      </div>
      <div className="from-overlay/85 absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-linear-to-t to-transparent px-4 pt-12 pb-4 lg:px-12 lg:pt-30 lg:pb-12">
        <p className="font-display text-primary-foreground text-xl font-semibold lg:text-3xl">
          {t("auth_panel_title")}
        </p>
        <p className="text-primary-foreground/90 hidden text-sm lg:block">{t("site_tagline")}</p>
      </div>
    </div>
  );
}
