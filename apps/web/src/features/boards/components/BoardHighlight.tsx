import type { IOrgTreeNode } from "../org-tree.helper";
import type { TBoardResponse } from "@repo/contracts";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "#/i18n/navigation";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ROUTES } from "#/lib/routes";

import { BoardTermHelper } from "../board-term.helper";
import { MemberAvatar } from "./MemberAvatar";

const HIGHLIGHT_OFFICERS = 4;

export interface BoardHighlightProps {
  unit: IOrgTreeNode;
  typeName: string;
  board: TBoardResponse | null;
}

export function BoardHighlight({ unit, typeName, board }: BoardHighlightProps) {
  const t = useTranslations();
  const locale = BoardTermHelper.locale(useLocale());
  const officers = (board?.members ?? [])
    .filter((member) => member.position.isOfficeBearer)
    .slice(0, HIGHLIGHT_OFFICERS);
  const name = I18nTextHelper.pick(unit.nameI18n, locale);
  // "Central Board" is both a type and a name; don't print it twice.
  const typeLabel = typeName === name ? "" : typeName;
  return (
    <Link
      href={`${ROUTES.boards}/${unit.slug}`}
      className="bg-primary text-primary-foreground hover:bg-primary-hover flex flex-wrap items-center gap-x-10 gap-y-6 rounded-xl px-8 py-7 transition-colors"
    >
      <span className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
        <span className="text-inverse-accent text-xs font-semibold tracking-wider uppercase">
          {board?.term
            ? typeLabel
              ? t("boards_type_and_term", {
                  type: typeLabel,
                  term: BoardTermHelper.label(board.term, locale),
                })
              : BoardTermHelper.label(board.term, locale)
            : typeLabel}
        </span>
        <span className="font-display text-3xl font-semibold">{name}</span>
        <span className="text-inverse-muted text-sm">
          {board?.term
            ? t("boards_member_count", { count: board.members.length })
            : t("boards_no_term")}
        </span>
      </span>
      {officers.length > 0 ? (
        <span className="flex flex-wrap gap-5">
          {officers.map((member) => (
            <span
              key={`${member.position.id}-${member.personId}`}
              className="flex w-28 flex-col items-center gap-1.5 text-center"
            >
              <MemberAvatar name={member.displayName} size="lg" className="bg-surface" />
              <span className="text-sm leading-tight font-semibold">{member.displayName}</span>
              <span className="text-inverse-muted text-xs">
                {I18nTextHelper.pick(member.position.titleI18n, locale)}
              </span>
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  );
}
