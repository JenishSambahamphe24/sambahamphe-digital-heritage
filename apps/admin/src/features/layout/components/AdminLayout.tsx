import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { Button } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { QUERY_KEYS } from "#/lib/query-keys";

import { LanguageSwitch } from "./LanguageSwitch";

const NAV_LINK = "rounded px-3 py-2 text-sm hover:bg-surface-muted";
const NAV_LINK_ACTIVE = "bg-surface-muted font-medium text-primary";

export function AdminLayout() {
  const t = useTranslations();
  const { me } = useRouteContext({ from: "/_authenticated" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = useMutation({
    mutationFn: async () => {
      await apiClient.POST("/api/v1/auth/logout");
    },
    onSuccess: async () => {
      queryClient.setQueryData(QUERY_KEYS.me, null);
      await navigate({ to: "/login" });
    },
  });

  return (
    <div className="bg-background flex min-h-screen">
      <aside className="border-border bg-surface w-56 shrink-0 border-r p-4">
        <p className="font-display text-primary mb-6 text-lg font-semibold">{t("admin_title")}</p>
        <nav className="flex flex-col gap-1">
          <Link to="/users" className={NAV_LINK} activeProps={{ className: NAV_LINK_ACTIVE }}>
            {t("nav_users")}
          </Link>
          <Link to="/audit-log" className={NAV_LINK} activeProps={{ className: NAV_LINK_ACTIVE }}>
            {t("nav_audit_log")}
          </Link>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-border bg-surface flex items-center justify-end gap-4 border-b px-6 py-3">
          <span className="text-foreground-muted text-sm">
            {t("header_signed_in_as", { name: me.displayName })}
          </span>
          <LanguageSwitch />
          <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
            {t("header_logout")}
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
