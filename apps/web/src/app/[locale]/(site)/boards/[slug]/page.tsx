import type { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { BoardsDataHelper } from "#/features/boards/boards-data.helper";
import { BoardDetailPage } from "#/features/boards/components/BoardDetailPage";
import { I18nTextHelper } from "#/lib/i18n-text.helper";

interface BoardRouteProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ term?: string | string[] }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BoardRouteProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });
  const unit = (await BoardsDataHelper.units())?.find((candidate) => candidate.slug === slug);
  return { title: unit ? I18nTextHelper.pick(unit.nameI18n, locale) : t("meta_boards") };
}

export default async function BoardRoute({ params, searchParams }: BoardRouteProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { term } = await searchParams;
  return <BoardDetailPage slug={slug} termId={typeof term === "string" ? term : undefined} />;
}
