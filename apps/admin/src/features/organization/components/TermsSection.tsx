import type { TTermResponse } from "@repo/contracts";

import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { Button, Card, Spinner } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { QueryError } from "../../layout/components/QueryError";
import { useTerms } from "../hooks/useTerms";
import { OrgDateDraftHelper } from "../org-date-draft.helper";
import { TermForm } from "./TermForm";

export interface TermsSectionProps {
  unitId: string;
}

export function TermsSection({ unitId }: TermsSectionProps) {
  const t = useTranslations();
  const locale = useLocale() === "ne" ? "ne" : "en";
  const terms = useTerms(unitId);
  const [editing, setEditing] = useState<TTermResponse | "new" | null>(null);
  const termName = (term: TTermResponse) =>
    (term.labelI18n ? I18nTextHelper.pick(term.labelI18n, locale) : "") ||
    (term.ordinal ? t("org_term_numbered", { ordinal: term.ordinal }) : t("org_term_unnamed"));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{t("org_terms_title")}</h2>
        {editing === null ? (
          <Button variant="secondary" onClick={() => setEditing("new")}>
            {t("org_term_add")}
          </Button>
        ) : null}
      </div>
      {editing === "new" ? <TermForm unitId={unitId} onDone={() => setEditing(null)} /> : null}
      {terms.isPending ? (
        <Spinner />
      ) : terms.isError ? (
        <QueryError error={terms.error} />
      ) : terms.data.length === 0 ? (
        <p className="text-foreground-muted text-sm">{t("org_terms_empty")}</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {terms.data.map((term) =>
            editing !== null && editing !== "new" && editing.id === term.id ? (
              <li key={term.id} className="py-2">
                <TermForm
                  key={term.version}
                  unitId={unitId}
                  term={term}
                  onDone={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={term.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {termName(term)}
                    {term.isCurrent ? (
                      <span className="bg-success-subtle text-success ml-2 rounded px-2 py-0.5 text-xs">
                        {t("org_term_current")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-foreground-muted">
                    {OrgDateDraftHelper.label(term.startsOn, term.datePrecision, locale)} –{" "}
                    {term.endsOn
                      ? OrgDateDraftHelper.label(term.endsOn, term.datePrecision, locale)
                      : t("org_term_open")}
                  </span>
                </div>
                <Button variant="ghost" onClick={() => setEditing(term)}>
                  {t("common_edit")}
                </Button>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
