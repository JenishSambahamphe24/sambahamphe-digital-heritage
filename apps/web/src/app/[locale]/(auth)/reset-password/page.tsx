import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "#/features/auth/components/ResetPasswordForm";

interface ResetPasswordRouteProps {
  params: Promise<{ locale: string }>;
}

// Account and auth pages are personal: keep them out of search results.
export async function generateMetadata({ params }: ResetPasswordRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_reset"), robots: { index: false, follow: false } };
}

export default async function ResetPasswordRoute({ params }: ResetPasswordRouteProps) {
  setRequestLocale((await params).locale);
  return <ResetPasswordForm />;
}
