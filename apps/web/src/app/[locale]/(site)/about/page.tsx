import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { AboutPage } from "#/features/about/components/AboutPage";

interface AboutRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_about"), description: t("about_intro") };
}

export default async function AboutRoute({ params }: AboutRouteProps) {
  setRequestLocale((await params).locale);
  return <AboutPage />;
}
