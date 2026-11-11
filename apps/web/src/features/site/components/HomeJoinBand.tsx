import { useTranslations } from "next-intl";
import Image from "next/image";

import { LinkButton } from "#/components/LinkButton";
import { HERITAGE_IMAGES } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

export function HomeJoinBand() {
  const t = useTranslations();
  return (
    <section className="bg-primary text-primary-foreground relative overflow-hidden">
      <Image
        src={HERITAGE_IMAGES.motif.src}
        width={HERITAGE_IMAGES.motif.width}
        height={HERITAGE_IMAGES.motif.height}
        alt=""
        sizes="360px"
        className="absolute top-1/2 -right-16 size-90 -translate-y-1/2 opacity-20"
      />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-4 py-16 md:px-12">
        <div className="flex max-w-2xl min-w-0 flex-1 basis-96 flex-col gap-3">
          <h2 className="font-display text-3xl font-semibold">{t("home_join_title")}</h2>
          <p className="text-inverse-muted">{t("home_join_body")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={ROUTES.register} variant="secondary">
            {t("home_cta_register")}
          </LinkButton>
          <LinkButton href={ROUTES.login} variant="inverse">
            {t("home_cta_login")}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
