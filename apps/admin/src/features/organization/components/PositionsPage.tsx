import type { TPositionResponse } from "@repo/contracts";

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { Button, Card, Spinner } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { QueryError } from "../../layout/components/QueryError";
import { usePositions } from "../hooks/usePositions";
import { PositionForm } from "./PositionForm";

const RANK_STEP = 1;

export function PositionsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const positions = usePositions();
  const [editing, setEditing] = useState<TPositionResponse | "new" | null>(null);
  const nextRank = (positions.data?.at(-1)?.rank ?? 0) + RANK_STEP;
  return (
    <div className="flex flex-col gap-4">
      <Link to="/organization" className="text-primary text-sm hover:underline">
        ← {t("org_back")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("org_positions")}</h1>
        {editing === null ? (
          <Button onClick={() => setEditing("new")}>{t("org_position_add")}</Button>
        ) : null}
      </div>
      <p className="text-foreground-muted text-sm">{t("org_positions_hint")}</p>
      {editing === "new" ? (
        <PositionForm nextRank={nextRank} onDone={() => setEditing(null)} />
      ) : null}
      {positions.isPending ? (
        <Spinner />
      ) : positions.isError ? (
        <QueryError error={positions.error} />
      ) : positions.data.length === 0 ? (
        <p className="text-foreground-muted text-sm">{t("org_positions_empty")}</p>
      ) : (
        <Card className="p-0">
          <ul className="divide-border divide-y text-sm">
            {positions.data.map((position) =>
              editing !== null && editing !== "new" && editing.id === position.id ? (
                <li key={position.id} className="p-4">
                  <PositionForm
                    key={position.version}
                    position={position}
                    nextRank={nextRank}
                    onDone={() => setEditing(null)}
                  />
                </li>
              ) : (
                <li
                  key={position.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {position.rank}. {I18nTextHelper.pick(position.titleI18n, locale)}
                    </span>
                    <span className="text-foreground-muted">
                      {[
                        position.maxHolders === null
                          ? t("org_position_any_holders")
                          : t("org_position_holders", { count: position.maxHolders }),
                        position.isOfficeBearer ? t("org_position_office_bearer") : null,
                        position.active ? null : t("org_position_inactive"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <Button variant="ghost" onClick={() => setEditing(position)}>
                    {t("common_edit")}
                  </Button>
                </li>
              ),
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}
