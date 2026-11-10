import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountPage } from "#/features/account/components/AccountPage";

interface AccountRouteProps {
  params: Promise<{ locale: string }>;
}

// Account and auth pages are personal: keep them out of search results.
export async function generateMetadata({ params }: AccountRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_account"), robots: { index: false, follow: false } };
}

export default async function AccountRoute({ params }: AccountRouteProps) {
  setRequestLocale((await params).locale);
  return <AccountPage />;
}
