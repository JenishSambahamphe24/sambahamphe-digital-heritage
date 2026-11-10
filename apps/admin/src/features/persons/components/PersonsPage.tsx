import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { FuzzyDateFormatHelper } from "@repo/dates";
import { Button, Input, Spinner } from "@repo/ui";

import { QueryError } from "../../layout/components/QueryError";
import { PERSONS_PAGE_SIZE, usePersons } from "../hooks/usePersons";

const route = getRouteApi("/_authenticated/persons/");
const FIRST_PAGE = 1;

export function PersonsPage() {
  const t = useTranslations();
  const locale = useLocale() === "ne" ? "ne" : "en";
  const navigate = useNavigate({ from: "/persons/" });
  const { q = "", page = FIRST_PAGE } = route.useSearch();
  const [draft, setDraft] = useState(q);
  const persons = usePersons(q, page);
  const totalPages = persons.data
    ? Math.max(1, Math.ceil(persons.data.page.total / PERSONS_PAGE_SIZE))
    : 1;
  const go = (search: { q?: string; page?: number }) => void navigate({ search });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("persons_title")}</h1>
        <Link
          to="/persons/new"
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
        >
          {t("person_add")}
        </Link>
      </div>
      <form
        role="search"
        className="flex max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          go({ q: draft.trim() || undefined, page: FIRST_PAGE });
        }}
      >
        <Input
          aria-label={t("persons_search_label")}
          placeholder={t("persons_search_placeholder")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          {t("persons_search_label")}
        </Button>
      </form>

      {persons.isPending ? (
        <Spinner />
      ) : persons.isError ? (
        <QueryError error={persons.error} />
      ) : persons.data.data.length === 0 ? (
        <p className="text-foreground-muted text-sm">
          {t(q ? "persons_no_results" : "persons_empty")}
        </p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-surface-muted text-foreground-muted border-b">
              <tr>
                <th className="px-4 py-2 font-medium">{t("persons_col_name")}</th>
                <th className="px-4 py-2 font-medium">{t("persons_col_role")}</th>
                <th className="px-4 py-2 font-medium">{t("persons_col_born")}</th>
                <th className="px-4 py-2 font-medium">{t("persons_col_status")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {persons.data.data.map((person) => (
                <tr key={person.id}>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{person.displayName}</span>
                      {person.matchedName ? (
                        <span className="text-foreground-muted text-xs">
                          {t("persons_matched_name", { name: person.matchedName })}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {t("person_lineage_role_value", { role: person.lineageRole })}
                  </td>
                  <td className="px-4 py-2">
                    {person.birthDate
                      ? FuzzyDateFormatHelper.format(person.birthDate, locale)
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {person.recordStatus !== "active"
                      ? t("person_record_status", { status: person.recordStatus })
                      : t(
                          person.presumedLiving
                            ? "person_presumed_living"
                            : "person_living_status_value",
                          { status: person.livingStatus },
                        )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to="/persons/$personId"
                      params={{ personId: person.id }}
                      className="text-primary hover:underline"
                    >
                      {t("common_edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {persons.data && persons.data.page.total > PERSONS_PAGE_SIZE ? (
        <div className="flex items-center gap-3 text-sm">
          <Button
            variant="secondary"
            disabled={page <= FIRST_PAGE}
            onClick={() => go({ q: q || undefined, page: page - 1 })}
          >
            {t("pagination_prev")}
          </Button>
          <span className="text-foreground-muted">
            {t("pagination_info", { page, pages: totalPages, total: persons.data.page.total })}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => go({ q: q || undefined, page: page + 1 })}
          >
            {t("pagination_next")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
