import type { TTermResponse } from "@repo/contracts";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@repo/ui";

import { Link } from "#/i18n/navigation";
import { ROUTES } from "#/lib/routes";

import { BoardTermHelper } from "../board-term.helper";

export interface TermTabsProps {
  slug: string;
  terms: TTermResponse[];
  activeTermId: string | null;
}

// Links, not buttons: each term has its own URL, so it can be shared and indexed.
export function TermTabs({ slug, terms, activeTermId }: TermTabsProps) {
  const t = useTranslations();
  const locale = BoardTermHelper.locale(useLocale());
  return (
    <nav aria-label={t("board_terms_label")} className="flex flex-wrap gap-x-7 gap-y-2">
      {terms.map((term) => {
        const active = term.id === activeTermId;
        return (
          <Link
            key={term.id}
            href={
              term.isCurrent
                ? `${ROUTES.boards}/${slug}`
                : `${ROUTES.boards}/${slug}?term=${term.id}`
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pt-2.5 pb-3 text-sm",
              active
                ? "border-primary text-foreground font-semibold"
                : "text-foreground-muted hover:text-foreground border-transparent font-medium",
            )}
          >
            {term.isCurrent
              ? t("board_term_current", { term: BoardTermHelper.label(term, locale) })
              : BoardTermHelper.label(term, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
