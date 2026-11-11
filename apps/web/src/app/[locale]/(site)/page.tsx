import { setRequestLocale } from "next-intl/server";

import { HomePage } from "#/features/site/components/HomePage";

interface HomeRouteProps {
  params: Promise<{ locale: string }>;
}

// Static, refreshed every 5 minutes so the board teaser follows the API. Next
// needs a literal here (it reads the value at build time), not a constant.
export const revalidate = 300;

export default async function HomeRoute({ params }: HomeRouteProps) {
  setRequestLocale((await params).locale);
  return <HomePage />;
}
