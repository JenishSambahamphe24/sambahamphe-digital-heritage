import type { TAdminPersonResponse } from "@repo/contracts";

import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button, Card, ConfirmDialog, FormField, ToastHelper } from "@repo/ui";

import { Textarea } from "#/components/Textarea";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { usePersonActions } from "../hooks/usePersonActions";

export interface RetractPersonPanelProps {
  person: TAdminPersonResponse;
}

export function RetractPersonPanel({ person }: RetractPersonPanelProps) {
  const t = useTranslations();
  const { retract } = usePersonActions(person.id);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-semibold">{t("person_retract_title")}</h2>
      <p className="text-foreground-muted text-sm">{t("person_retract_hint")}</p>
      <FormField id="retract-reason" label={t("person_retract_reason")}>
        <Textarea
          id="retract-reason"
          value={reason}
          aria-describedby="retract-reason-message"
          onChange={(event) => setReason(event.target.value)}
        />
      </FormField>
      <Button
        variant="danger"
        className="self-start"
        disabled={!reason.trim()}
        onClick={() => setConfirming(true)}
      >
        {t("person_retract")}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("person_retract_confirm_title", { name: person.displayName })}
        description={t("person_retract_confirm_body")}
        confirmLabel={t("person_retract")}
        cancelLabel={t("common_cancel")}
        destructive
        pending={retract.isPending}
        onConfirm={() =>
          retract.mutate(
            { version: person.version, reason: reason.trim() },
            {
              onSuccess: () => {
                setConfirming(false);
                ToastHelper.show({ tone: "success", description: t("person_retracted") });
              },
              onError: (problem) => {
                setConfirming(false);
                ToastHelper.show({
                  tone: "danger",
                  description: t(ProblemMessageHelper.keyFor(problem.code)),
                });
              },
            },
          )
        }
      />
    </Card>
  );
}
