import { setRequestLocale } from "next-intl/server";

import { HomePage } from "#/features/site/components/HomePage";

interface HomeRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function HomeRoute({ params }: HomeRouteProps) {
  setRequestLocale((await params).locale);
  return <HomePage />;
}
