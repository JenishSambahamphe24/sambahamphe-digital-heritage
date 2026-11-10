import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { RegisterForm } from "#/features/auth/components/RegisterForm";

interface RegisterRouteProps {
  params: Promise<{ locale: string }>;
}

// Account and auth pages are personal: keep them out of search results.
export async function generateMetadata({ params }: RegisterRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_register"), robots: { index: false, follow: false } };
}

export default async function RegisterRoute({ params }: RegisterRouteProps) {
  setRequestLocale((await params).locale);
  return <RegisterForm />;
}
