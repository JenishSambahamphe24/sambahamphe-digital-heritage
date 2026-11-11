import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { IsoDateFormatHelper } from "@repo/dates";
import { Alert } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ROUTES } from "#/lib/routes";

import { BoardTermHelper } from "../board-term.helper";
import { BoardsDataHelper } from "../boards-data.helper";
import { MembersTable } from "./MembersTable";
import { OfficerCard } from "./OfficerCard";
import { TermTabs } from "./TermTabs";

export interface BoardDetailPageProps {
  slug: string;
  termId?: string;
}

export async function BoardDetailPage({ slug, termId }: BoardDetailPageProps) {
  const t = await getTranslations();
  const locale = BoardTermHelper.locale(await getLocale());
  const units = await BoardsDataHelper.units();
  if (!units) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-12">
        <Alert tone="danger">{t("boards_load_failed")}</Alert>
      </div>
    );
  }
  const node = units.find((unit) => unit.slug === slug);
  if (!node) {
    notFound();
  }
  const terms = (await BoardsDataHelper.terms(node.id)) ?? [];
  // An unknown ?term= falls back to the current board instead of an error page.
  const chosenTerm = terms.find((term) => term.id === termId);
  const [unit, board, types] = await Promise.all([
    BoardsDataHelper.unit(node.id),
    BoardsDataHelper.board(node.id, chosenTerm?.id),
    BoardsDataHelper.unitTypes(),
  ]);
  const children = units
    .filter((candidate) => candidate.parentId === node.id && candidate.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const type = types?.find((candidate) => candidate.key === node.typeKey);
  const term = board?.term ?? null;
  const officers = board?.members.filter((member) => member.position.isOfficeBearer) ?? [];
  const others = board?.members.filter((member) => !member.position.isOfficeBearer) ?? [];

  return (
    <>
      <section className="border-border bg-surface border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-6 md:px-12">
          <nav
            aria-label={t("board_breadcrumb")}
            className="text-foreground-muted flex flex-wrap gap-1.5 text-sm"
          >
            <Link href={ROUTES.boards} className="hover:text-foreground">
              {t("nav_boards")}
            </Link>
            {(unit?.ancestors ?? []).map((ancestor) => (
              <span key={ancestor.id} className="flex gap-1.5">
                <span aria-hidden="true">›</span>
                <Link href={`${ROUTES.boards}/${ancestor.slug}`} className="hover:text-foreground">
                  {I18nTextHelper.pick(ancestor.nameI18n, locale)}
                </Link>
              </span>
            ))}
            <span aria-hidden="true">›</span>
            <span aria-current="page" className="text-foreground">
              {I18nTextHelper.pick(node.nameI18n, locale)}
            </span>
          </nav>
          {type &&
          I18nTextHelper.pick(type.nameI18n, locale) !==
            I18nTextHelper.pick(node.nameI18n, locale) ? (
            <p className="text-accent text-xs font-semibold tracking-wider uppercase">
              {I18nTextHelper.pick(type.nameI18n, locale)}
            </p>
          ) : null}
          <h1 className="font-display text-4xl font-semibold">
            {I18nTextHelper.pick(node.nameI18n, locale)}
          </h1>
          {term ? (
            <p className="text-foreground-muted">
              {term.endsOn
                ? t("board_serving", {
                    start: IsoDateFormatHelper.format(term.startsOn, term.datePrecision, locale),
                    end: IsoDateFormatHelper.format(term.endsOn, term.datePrecision, locale),
                  })
                : t("board_serving_open", {
                    start: IsoDateFormatHelper.format(term.startsOn, term.datePrecision, locale),
                  })}
            </p>
          ) : null}
          {terms.length > 0 ? (
            <TermTabs slug={slug} terms={terms} activeTermId={term?.id ?? null} />
          ) : (
            <div className="pb-6" />
          )}
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pt-10 pb-22 md:px-12">
        {!board ? <Alert tone="danger">{t("boards_load_failed")}</Alert> : null}
        {board && terms.length === 0 ? (
          <p className="text-foreground-muted">{t("board_no_terms")}</p>
        ) : null}
        {board && terms.length > 0 && board.members.length === 0 ? (
          <p className="text-foreground-muted">{t("board_empty")}</p>
        ) : null}

        {officers.length > 0 ? (
          <section aria-labelledby="officers" className="flex flex-col gap-5">
            <h2 id="officers" className="font-display text-2xl font-semibold">
              {t("board_office_bearers")}
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {officers.map((member) => (
                <OfficerCard key={`${member.position.id}-${member.personId}`} member={member} />
              ))}
            </div>
          </section>
        ) : null}

        {others.length > 0 ? (
          <section aria-labelledby="members" className="flex flex-col gap-5">
            <h2 id="members" className="font-display text-2xl font-semibold">
              {t("board_members")}
            </h2>
            <MembersTable members={others} />
          </section>
        ) : null}

        {children.length > 0 ? (
          <section aria-labelledby="children" className="flex flex-col gap-4">
            <h2 id="children" className="font-display text-2xl font-semibold">
              {t("board_children_title")}
            </h2>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`${ROUTES.boards}/${child.slug}`}
                    className="border-border bg-surface hover:bg-surface-muted flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5 font-medium"
                  >
                    {I18nTextHelper.pick(child.nameI18n, locale)}
                    <ChevronRight aria-hidden="true" className="text-foreground-muted size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
