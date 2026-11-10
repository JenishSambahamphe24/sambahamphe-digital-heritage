import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { VerifyEmail } from "#/features/auth/components/VerifyEmail";

interface VerifyEmailRouteProps {
  params: Promise<{ locale: string }>;
}

// Account and auth pages are personal: keep them out of search results.
export async function generateMetadata({ params }: VerifyEmailRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_verify"), robots: { index: false, follow: false } };
}

export default async function VerifyEmailRoute({ params }: VerifyEmailRouteProps) {
  setRequestLocale((await params).locale);
  return <VerifyEmail />;
}
