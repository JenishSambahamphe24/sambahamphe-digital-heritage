import type { TAdminPersonResponse, TConsentResponse } from "@repo/contracts";

import { useState } from "react";
import { useFormatter, useTranslations } from "use-intl";

import { Button, Card, ConfirmDialog, ToastHelper } from "@repo/ui";

import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { usePersonActions } from "../hooks/usePersonActions";
import { RecordConsentForm } from "./RecordConsentForm";

export interface ConsentsSectionProps {
  person: TAdminPersonResponse;
}

export function ConsentsSection({ person }: ConsentsSectionProps) {
  const t = useTranslations();
  const format = useFormatter();
  const { revokeConsent } = usePersonActions(person.id);
  const [pending, setPending] = useState<TConsentResponse | null>(null);
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{t("consents_title")}</h2>
        <p className="text-foreground-muted text-sm">{t("consents_hint")}</p>
      </div>
      {person.consents.length === 0 ? (
        <p className="text-foreground-muted text-sm">{t("consents_empty")}</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {person.consents.map((consent) => (
            <li key={consent.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="flex flex-col">
                <span className="font-medium">
                  {consent.grantedByName} ·{" "}
                  {t("consent_relation", { relation: consent.relationToSubject })}
                </span>
                <span className="text-foreground-muted">
                  {t("consent_scope", {
                    level: t("visibility_level", { level: consent.scope.visibility }),
                    groups: consent.scope.fieldGroups
                      .map((group) => t("field_group", { group }))
                      .join(", "),
                  })}
                </span>
                <span className="text-foreground-muted">
                  {consent.revokedAt
                    ? t("consent_revoked_on", {
                        date: format.dateTime(new Date(consent.revokedAt), { dateStyle: "medium" }),
                      })
                    : t("consent_given_on", {
                        date: format.dateTime(new Date(consent.grantedAt), { dateStyle: "medium" }),
                      })}
                </span>
              </div>
              {consent.revokedAt ? null : (
                <Button variant="secondary" onClick={() => setPending(consent)}>
                  {t("consent_revoke")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <RecordConsentForm personId={person.id} />
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => (open ? undefined : setPending(null))}
        title={t("consent_revoke_title")}
        description={t("consent_revoke_body")}
        confirmLabel={t("consent_revoke")}
        cancelLabel={t("common_cancel")}
        destructive
        pending={revokeConsent.isPending}
        onConfirm={() => {
          if (!pending) {
            return;
          }
          revokeConsent.mutate(pending.id, {
            onSuccess: () => {
              setPending(null);
              ToastHelper.show({ tone: "success", description: t("consent_revoked") });
            },
            onError: (problem) => {
              setPending(null);
              ToastHelper.show({
                tone: "danger",
                description: t(ProblemMessageHelper.keyFor(problem.code)),
              });
            },
          });
        }}
      />
    </Card>
  );
}
