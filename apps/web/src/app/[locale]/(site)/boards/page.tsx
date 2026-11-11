import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { BoardsPage } from "#/features/boards/components/BoardsPage";

interface BoardsRouteProps {
  params: Promise<{ locale: string }>;
}

// Rendered per request from the API, so a build never needs the API running.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BoardsRouteProps): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale });
  return { title: t("meta_boards"), description: t("boards_intro") };
}

export default async function BoardsRoute({ params }: BoardsRouteProps) {
  setRequestLocale((await params).locale);
  return <BoardsPage />;
}
