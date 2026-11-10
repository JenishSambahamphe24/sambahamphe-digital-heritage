"use client";

import type { TSessionResponse } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Alert, Button, Card, ConfirmDialog, Spinner } from "@repo/ui";

import { useRouter } from "#/i18n/navigation";
import { apiClient } from "#/lib/api-client";
import { QUERY_KEYS } from "#/lib/query-keys";
import { ROUTES } from "#/lib/routes";

import { useMe } from "../hooks/useMe";
import { useSessions } from "../hooks/useSessions";
import { SessionRow } from "./SessionRow";

export function AccountPage() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const sessions = useSessions(Boolean(me.data));
  const [pendingRevoke, setPendingRevoke] = useState<TSessionResponse | null>(null);

  useEffect(() => {
    if (me.data === null) {
      router.replace(ROUTES.login);
    }
  }, [me.data, router]);

  const revoke = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.DELETE("/api/v1/me/sessions/{id}", { params: { path: { id: sessionId } } });
    },
    onSuccess: async () => {
      setPendingRevoke(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await apiClient.POST("/api/v1/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.me, null);
      router.push(ROUTES.login);
    },
  });

  if (!me.data) {
    return (
      <p className="text-foreground-muted flex items-center gap-2 p-8 text-sm">
        <Spinner /> {t("account_loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">{t("account_title")}</h1>
        <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
          {t("account_logout")}
        </Button>
      </div>
      <Card className="flex flex-col gap-2">
        <p className="text-lg font-medium">{me.data.displayName}</p>
        <p className="text-foreground-muted text-sm">{me.data.email}</p>
        <Alert tone={me.data.emailVerified ? "success" : "warning"}>
          {t(me.data.emailVerified ? "account_email_verified" : "account_email_unverified")}
        </Alert>
      </Card>
      <Card>
        <h2 className="font-display text-xl font-semibold">{t("account_sessions_title")}</h2>
        <ul className="divide-border mt-2 divide-y">
          {sessions.data?.map((session) => (
            <SessionRow key={session.id} session={session} onRevoke={setPendingRevoke} />
          ))}
        </ul>
      </Card>
      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => (open ? undefined : setPendingRevoke(null))}
        title={t("account_revoke_title")}
        description={t("account_revoke_body")}
        confirmLabel={t("account_revoke_confirm")}
        cancelLabel={t("common_cancel")}
        pending={revoke.isPending}
        onConfirm={() => (pendingRevoke ? revoke.mutate(pendingRevoke.id) : undefined)}
      />
    </div>
  );
}
