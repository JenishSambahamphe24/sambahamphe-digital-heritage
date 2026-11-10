"use client";

import type { TSessionResponse } from "@repo/contracts";

import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@repo/ui";

export interface SessionRowProps {
  session: TSessionResponse;
  onRevoke: (session: TSessionResponse) => void;
}

export function SessionRow({ session, onRevoke }: SessionRowProps) {
  const t = useTranslations();
  const format = useFormatter();
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="text-sm">
        <p className="text-foreground font-medium">
          {t("account_session_client", { client: session.client })}
          {session.current ? (
            <span className="bg-success-subtle text-success ml-2 rounded px-2 py-0.5 text-xs">
              {t("account_session_current")}
            </span>
          ) : null}
        </p>
        <p className="text-foreground-muted">
          {t("account_session_last_seen", {
            date: format.dateTime(new Date(session.lastSeenAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
      </div>
      {session.current ? null : (
        <Button variant="secondary" onClick={() => onRevoke(session)}>
          {t("account_session_revoke")}
        </Button>
      )}
    </li>
  );
}
