import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormatter, useTranslations } from "use-intl";

import { Button, Input, Spinner } from "@repo/ui";

import { QueryError } from "../../layout/components/QueryError";
import { USERS_PAGE_SIZE, useUsers } from "../hooks/useUsers";

const route = getRouteApi("/_authenticated/users/");
const FIRST_PAGE = 1;

export function UsersPage() {
  const t = useTranslations();
  const format = useFormatter();
  const navigate = useNavigate({ from: "/users/" });
  const { q = "", page = FIRST_PAGE } = route.useSearch();
  const [draft, setDraft] = useState(q);
  const users = useUsers(q, page);
  const totalPages = users.data
    ? Math.max(1, Math.ceil(users.data.page.total / USERS_PAGE_SIZE))
    : 1;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t("users_title")}</h1>
      <form
        role="search"
        className="flex max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void navigate({ search: { q: draft || undefined, page: FIRST_PAGE } });
        }}
      >
        <Input
          aria-label={t("users_search_label")}
          placeholder={t("users_search_placeholder")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          {t("users_search_label")}
        </Button>
      </form>

      {users.isPending ? (
        <Spinner />
      ) : users.isError ? (
        <QueryError error={users.error} />
      ) : users.data.data.length === 0 ? (
        <p className="text-foreground-muted text-sm">{t("users_empty")}</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-surface-muted text-foreground-muted border-b">
              <tr>
                <th className="px-4 py-2 font-medium">{t("users_col_name")}</th>
                <th className="px-4 py-2 font-medium">{t("users_col_email")}</th>
                <th className="px-4 py-2 font-medium">{t("users_col_verified")}</th>
                <th className="px-4 py-2 font-medium">{t("users_col_status")}</th>
                <th className="px-4 py-2 font-medium">{t("users_col_last_login")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {users.data.data.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 font-medium">{user.displayName}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    {t(user.emailVerified ? "common_yes" : "common_no")}
                  </td>
                  <td className="px-4 py-2">{t("users_status", { status: user.status })}</td>
                  <td className="text-foreground-muted px-4 py-2">
                    {user.lastLoginAt
                      ? format.dateTime(new Date(user.lastLoginAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : t("common_never")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to="/users/$userId"
                      params={{ userId: user.id }}
                      className="text-primary hover:underline"
                    >
                      {t("users_manage_roles")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.data ? (
        <div className="flex items-center gap-3 text-sm">
          <Button
            variant="secondary"
            disabled={page <= FIRST_PAGE}
            onClick={() => void navigate({ search: { q: q || undefined, page: page - 1 } })}
          >
            {t("pagination_prev")}
          </Button>
          <span className="text-foreground-muted">
            {t("users_page_info", { page, pages: totalPages, total: users.data.page.total })}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => void navigate({ search: { q: q || undefined, page: page + 1 } })}
          >
            {t("pagination_next")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
