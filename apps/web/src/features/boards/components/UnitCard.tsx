import type { IOrgTreeNode } from "../org-tree.helper";
import type { TBoardResponse } from "@repo/contracts";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "#/i18n/navigation";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ROUTES } from "#/lib/routes";

import { BoardTermHelper } from "../board-term.helper";

export interface UnitCardProps {
  unit: IOrgTreeNode;
  typeName: string;
  board: TBoardResponse | null;
  childTypeName: (typeKey: string) => string;
}

export function UnitCard({ unit, typeName, board, childTypeName }: UnitCardProps) {
  const t = useTranslations();
  const locale = BoardTermHelper.locale(useLocale());
  return (
    <div className="border-border bg-surface flex flex-col overflow-hidden rounded-lg border">
      <Link
        href={`${ROUTES.boards}/${unit.slug}`}
        className="border-border hover:bg-surface-muted flex flex-col gap-1.5 border-b p-5"
      >
        <span className="text-accent text-xs font-semibold tracking-wide uppercase">
          {typeName}
        </span>
        <span className="font-display text-xl font-semibold">
          {I18nTextHelper.pick(unit.nameI18n, locale)}
        </span>
        <span className="text-foreground-muted text-sm">
          {board?.term
            ? `${BoardTermHelper.label(board.term, locale)} · ${t("boards_member_count", { count: board.members.length })}`
            : t("boards_no_term")}
        </span>
      </Link>
      {unit.children.length > 0 ? (
        <ul className="flex flex-col py-2">
          {unit.children.map((child) => (
            <li key={child.id}>
              <Link
                href={`${ROUTES.boards}/${child.slug}`}
                className="hover:bg-surface-muted flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
              >
                <span>
                  <span className="font-medium">{I18nTextHelper.pick(child.nameI18n, locale)}</span>
                  <span className="text-foreground-muted"> · {childTypeName(child.typeKey)}</span>
                </span>
                <ChevronRight aria-hidden="true" className="text-foreground-muted size-4" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
