import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { Button, Input, Spinner } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { QueryError } from "../../layout/components/QueryError";
import { usePlace } from "../hooks/usePlace";
import { PLACES_PAGE_SIZE, usePlaces } from "../hooks/usePlaces";
import { PlacePath } from "./PlacePath";

const route = getRouteApi("/_authenticated/places/");
const FIRST_PAGE = 1;

export function PlacesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const navigate = useNavigate({ from: "/places/" });
  const { q = "", parentId = "", page = FIRST_PAGE } = route.useSearch();
  const [draft, setDraft] = useState(q);
  const places = usePlaces(q, parentId, page);
  const parent = usePlace(parentId || undefined);
  const totalPages = places.data
    ? Math.max(1, Math.ceil(places.data.page.total / PLACES_PAGE_SIZE))
    : 1;
  const go = (search: { q?: string; parentId?: string; page?: number }) =>
    void navigate({ search });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("places_title")}</h1>
        <Link
          to="/places/new"
          search={{ parentId: parentId || undefined }}
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
        >
          {t("place_add")}
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
          aria-label={t("places_search_label")}
          placeholder={t("places_search_placeholder")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          {t("places_search_label")}
        </Button>
      </form>

      {!q ? (
        <nav
          aria-label={t("places_breadcrumb")}
          className="flex flex-wrap items-center gap-1 text-sm"
        >
          <button type="button" className="text-primary hover:underline" onClick={() => go({})}>
            {t("places_top_level")}
          </button>
          {parent.data
            ? [...parent.data.ancestors, parent.data].map((crumb) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <span className="text-foreground-subtle">›</span>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => go({ parentId: crumb.id })}
                  >
                    {I18nTextHelper.pick(crumb.nameI18n, locale)}
                  </button>
                </span>
              ))
            : null}
        </nav>
      ) : null}

      {places.isPending ? (
        <Spinner />
      ) : places.isError ? (
        <QueryError error={places.error} />
      ) : places.data.data.length === 0 ? (
        <p className="text-foreground-muted text-sm">
          {t(q ? "places_no_results" : "places_empty")}
        </p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-surface-muted text-foreground-muted border-b">
              <tr>
                <th className="px-4 py-2 font-medium">{t("places_col_name")}</th>
                <th className="px-4 py-2 font-medium">{t("places_col_kind")}</th>
                <th className="px-4 py-2 font-medium">{t("places_col_children")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {places.data.data.map((place) => (
                <tr key={place.id}>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {I18nTextHelper.pick(place.nameI18n, locale)}
                      </span>
                      {place.matchedAltName ? (
                        <span className="text-foreground-muted text-xs">
                          {t("places_matched_alt", { name: place.matchedAltName })}
                        </span>
                      ) : null}
                      {q ? <PlacePath ancestors={place.ancestors} /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">{t("place_kind", { kind: place.kind })}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => go({ parentId: place.id })}
                    >
                      {t("places_open_children", { count: place.childCount })}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to="/places/$placeId"
                      params={{ placeId: place.id }}
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

      {places.data && places.data.page.total > PLACES_PAGE_SIZE ? (
        <div className="flex items-center gap-3 text-sm">
          <Button
            variant="secondary"
            disabled={page <= FIRST_PAGE}
            onClick={() =>
              go({ q: q || undefined, parentId: parentId || undefined, page: page - 1 })
            }
          >
            {t("pagination_prev")}
          </Button>
          <span className="text-foreground-muted">
            {t("pagination_info", { page, pages: totalPages, total: places.data.page.total })}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() =>
              go({ q: q || undefined, parentId: parentId || undefined, page: page + 1 })
            }
          >
            {t("pagination_next")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
