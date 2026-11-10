import { useFormatter, useTranslations } from "use-intl";

import { Button, Spinner } from "@repo/ui";

import { QueryError } from "../../layout/components/QueryError";
import { useAuditLog } from "../hooks/useAuditLog";

const SHORT_ID_LENGTH = 8;

export function AuditLogPage() {
  const t = useTranslations();
  const format = useFormatter();
  const log = useAuditLog();
  const entries = log.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t("audit_title")}</h1>
      {log.isPending ? (
        <Spinner />
      ) : log.isError ? (
        <QueryError error={log.error} />
      ) : entries.length === 0 ? (
        <p className="text-foreground-muted text-sm">{t("audit_empty")}</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-surface-muted text-foreground-muted border-b">
              <tr>
                <th className="px-4 py-2 font-medium">{t("audit_col_time")}</th>
                <th className="px-4 py-2 font-medium">{t("audit_col_action")}</th>
                <th className="px-4 py-2 font-medium">{t("audit_col_actor")}</th>
                <th className="px-4 py-2 font-medium">{t("audit_col_entity")}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-foreground-muted px-4 py-2 whitespace-nowrap">
                    {format.dateTime(new Date(entry.occurredAt), {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{entry.action}</td>
                  <td className="px-4 py-2">
                    {t("audit_actor", { type: entry.actorType })}
                    {entry.actorId ? (
                      <span className="text-foreground-subtle ml-1 font-mono text-xs">
                        {entry.actorId.slice(0, SHORT_ID_LENGTH)}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-foreground-muted px-4 py-2 font-mono text-xs">
                    {entry.entityType ?? ""}
                    {entry.entityId ? ` ${entry.entityId.slice(0, SHORT_ID_LENGTH)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {log.hasNextPage ? (
        <Button
          variant="secondary"
          loading={log.isFetchingNextPage}
          onClick={() => void log.fetchNextPage()}
        >
          {t("audit_load_more")}
        </Button>
      ) : null}
    </div>
  );
}
