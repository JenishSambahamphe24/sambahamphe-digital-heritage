import { useTranslations } from "next-intl";
import Image from "next/image";

import { LinkButton } from "#/components/LinkButton";
import { HERITAGE_IMAGES } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

import { HomeBoardTeaser } from "./HomeBoardTeaser";
import { HomeJoinBand } from "./HomeJoinBand";

export function HomePage() {
  const t = useTranslations();
  return (
    <>
      <section className="bg-overlay relative flex min-h-180 flex-col overflow-hidden">
        <Image
          src={HERITAGE_IMAGES.village.src}
          alt=""
          fill
          preload
          unoptimized
          sizes="100vw"
          className="object-cover object-right-bottom"
        />
        <div className="from-overlay/95 via-overlay/80 to-overlay/10 absolute inset-0 bg-linear-to-t md:bg-linear-to-r" />
        <div className="text-primary-foreground relative mx-auto mt-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-32 pb-16 md:my-auto md:px-12 md:pb-20">
          <p className="text-inverse-accent flex items-center gap-2.5 text-xs font-semibold tracking-wider uppercase">
            <Image
              src={HERITAGE_IMAGES.motif.src}
              width={HERITAGE_IMAGES.motif.width}
              height={HERITAGE_IMAGES.motif.height}
              alt=""
              sizes="24px"
              className="size-6"
            />
            {t("home_eyebrow")}
          </p>
          <h1 className="font-display max-w-2xl text-4xl font-semibold text-balance md:text-6xl">
            {t("home_title")}
          </h1>
          <p className="text-inverse-muted max-w-xl text-lg">{t("home_intro")}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <LinkButton href={ROUTES.about}>{t("home_cta_about")}</LinkButton>
            <LinkButton href={ROUTES.register} variant="inverse">
              {t("nav_become_member")}
            </LinkButton>
          </div>
          <p className="text-inverse-muted max-w-xl text-sm">{t("home_status")}</p>
        </div>
      </section>
      <HomeBoardTeaser />
      <HomeJoinBand />
    </>
  );
}
