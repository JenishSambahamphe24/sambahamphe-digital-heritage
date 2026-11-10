import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useTranslations } from "use-intl";

import { Button } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { QUERY_KEYS } from "#/lib/query-keys";

import { LanguageSwitch } from "./LanguageSwitch";

const ICON_SIZE = 18;
const MENU_ICON_SIZE = 22;
const ON_PRIMARY_BUTTON =
  "text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-primary-foreground";

export interface NavbarProps {
  onOpenSidebar: () => void;
}

export function Navbar({ onOpenSidebar }: NavbarProps) {
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
    <header className="bg-primary text-primary-foreground border-b-primary-foreground/20 flex h-18 items-center gap-3 border-b px-4 shadow-md">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label={t("nav_open_menu")}
        className="hover:bg-primary-foreground/10 focus-visible:outline-primary-foreground rounded-md p-2 focus-visible:outline-2 lg:hidden"
      >
        <Menu size={MENU_ICON_SIZE} aria-hidden />
      </button>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-primary-foreground/80 hidden text-sm sm:inline">
          {t("header_signed_in_as", { name: me.displayName })}
        </span>
        <LanguageSwitch onPrimary />
        <Button
          variant="ghost"
          className={ON_PRIMARY_BUTTON}
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut size={ICON_SIZE} aria-hidden />
          <span className="hidden sm:inline">{t("header_logout")}</span>
        </Button>
      </div>
    </header>
  );
}
