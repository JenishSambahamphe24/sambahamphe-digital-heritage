import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "#/features/auth/components/ForgotPasswordForm";

interface ForgotPasswordRouteProps {
  params: Promise<{ locale: string }>;
}

// Account and auth pages are personal: keep them out of search results.
export async function generateMetadata({ params }: ForgotPasswordRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_forgot"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordRoute({ params }: ForgotPasswordRouteProps) {
  setRequestLocale((await params).locale);
  return <ForgotPasswordForm />;
}
