import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "#/features/auth/components/LoginForm";

interface LoginRouteProps {
  params: Promise<{ locale: string }>;
}

// Account and auth pages are personal: keep them out of search results.
export async function generateMetadata({ params }: LoginRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_login"), robots: { index: false, follow: false } };
}

export default async function LoginRoute({ params }: LoginRouteProps) {
  setRequestLocale((await params).locale);
  return <LoginForm />;
}
