import { useTranslations } from "next-intl";
import Image from "next/image";

import { LinkButton } from "#/components/LinkButton";
import { BRAND_LOGO, HERITAGE_IMAGES } from "#/lib/brand";
import { ROUTES } from "#/lib/routes";

const WORK = ["family", "history", "culture", "support"] as const;
const SEAL_SYMBOLS = ["mountain", "silam", "diyo"] as const;

export function AboutPage() {
  const t = useTranslations();
  return (
    <>
      <section className="border-border bg-surface border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-4 py-14 md:px-12">
          <div className="flex min-w-0 flex-1 basis-96 flex-col gap-5">
            <p className="text-accent text-xs font-semibold tracking-wider uppercase">
              {t("nav_about")}
            </p>
            <h1 className="font-display text-4xl font-semibold text-balance md:text-5xl">
              {t("about_title")}
            </h1>
            <p className="text-foreground-muted text-lg">{t("about_intro")}</p>
          </div>
          <Image
            src={HERITAGE_IMAGES.dance.src}
            width={HERITAGE_IMAGES.dance.width}
            height={HERITAGE_IMAGES.dance.height}
            alt={t("about_dance_alt")}
            sizes="(min-width: 768px) 560px, 100vw"
            unoptimized
            preload
            className="h-auto w-full max-w-xl min-w-0 flex-1 basis-96 rounded-xl"
          />
        </div>
      </section>

      <section
        aria-labelledby="what-we-do"
        className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-20 md:px-12"
      >
        <h2 id="what-we-do" className="font-display text-3xl font-semibold">
          {t("about_work_title")}
        </h2>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WORK.map((item, index) => (
            <li
              key={item}
              className="border-border bg-surface flex flex-col gap-2.5 rounded-lg border p-6"
            >
              <span
                aria-hidden="true"
                className="bg-info-subtle text-primary font-display flex size-10 items-center justify-center rounded-lg font-semibold"
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold">{t(`about_work_${item}_title`)}</h3>
              <p className="text-foreground-muted text-sm">{t(`about_work_${item}_body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="seal" className="border-border bg-surface border-y">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-14 px-4 py-20 md:px-12">
          <Image
            src={BRAND_LOGO.src}
            width={BRAND_LOGO.width}
            height={BRAND_LOGO.height}
            alt={t("about_seal_alt")}
            sizes="360px"
            className="h-auto w-full max-w-sm min-w-0"
          />
          <div className="flex min-w-0 flex-1 basis-96 flex-col gap-5">
            <h2 id="seal" className="font-display text-3xl font-semibold">
              {t("about_seal_title")}
            </h2>
            <p className="text-foreground-muted">{t("about_seal_intro")}</p>
            <dl className="flex flex-col gap-4">
              {SEAL_SYMBOLS.map((symbol) => (
                <div key={symbol}>
                  <dt className="font-semibold">{t(`about_seal_${symbol}_title`)}</dt>
                  <dd className="text-foreground-muted mt-1">{t(`about_seal_${symbol}_body`)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-foreground-muted text-sm">{t("about_seal_year")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-12">
        <div className="bg-info-subtle flex flex-wrap items-center justify-between gap-6 rounded-xl p-8">
          <div className="flex max-w-2xl flex-col gap-1.5">
            <h2 className="font-display text-2xl font-semibold">{t("about_lead_title")}</h2>
            <p className="text-foreground-muted">{t("about_lead_body")}</p>
          </div>
          <LinkButton href={ROUTES.boards}>{t("about_lead_cta")}</LinkButton>
        </div>
      </section>
    </>
  );
}
