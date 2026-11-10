import type { TAppointmentResponse } from "@repo/contracts";

import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { Button, Card, ConfirmDialog, FormField, Select, Spinner, ToastHelper } from "@repo/ui";

import { Textarea } from "#/components/Textarea";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { QueryError } from "../../layout/components/QueryError";
import { useAppointments } from "../hooks/useAppointments";
import { useOrgMutations } from "../hooks/useOrgMutations";
import { usePositions } from "../hooks/usePositions";
import { useTerms } from "../hooks/useTerms";
import { OrgDateDraftHelper } from "../org-date-draft.helper";
import { AppointmentForm } from "./AppointmentForm";
import { EndAppointmentForm } from "./EndAppointmentForm";

export interface BoardSectionProps {
  unitId: string;
}

// The board for one term: who holds which position, ordered by rank.
export function BoardSection({ unitId }: BoardSectionProps) {
  const t = useTranslations();
  const locale = useLocale() === "ne" ? "ne" : "en";
  const terms = useTerms(unitId);
  const positions = usePositions();
  const appointments = useAppointments(unitId);
  const { retractAppointment } = useOrgMutations();
  const [chosenTermId, setChosenTermId] = useState<string | null>(null);
  const [ending, setEnding] = useState<string | null>(null);
  const [retracting, setRetracting] = useState<TAppointmentResponse | null>(null);
  const [reason, setReason] = useState("");

  if (terms.isPending || positions.isPending || appointments.isPending) {
    return <Spinner />;
  }
  if (terms.isError || positions.isError || appointments.isError) {
    return <QueryError error={terms.error ?? positions.error ?? appointments.error} />;
  }
  const termId =
    chosenTermId ?? terms.data.find((term) => term.isCurrent)?.id ?? terms.data[0]?.id ?? null;
  const term = terms.data.find((candidate) => candidate.id === termId) ?? null;
  const rank = new Map(positions.data.map((position) => [position.id, position]));
  const members = appointments.data
    .filter(
      (appointment) => appointment.recordStatus === "accepted" && appointment.termId === termId,
    )
    .sort((a, b) => (rank.get(a.positionId)?.rank ?? 0) - (rank.get(b.positionId)?.rank ?? 0));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{t("org_board_title")}</h2>
        {terms.data.length > 0 ? (
          <div className="w-72">
            <FormField id="board-term" label={t("org_board_term")} reserveMessage={false}>
              <Select
                id="board-term"
                value={termId ?? ""}
                onValueChange={setChosenTermId}
                options={terms.data.map((option) => ({
                  value: option.id,
                  label: `${(option.labelI18n ? I18nTextHelper.pick(option.labelI18n, locale) : "") || OrgDateDraftHelper.label(option.startsOn, option.datePrecision, locale)}${option.isCurrent ? ` · ${t("org_term_current")}` : ""}`,
                }))}
              />
            </FormField>
          </div>
        ) : null}
      </div>
      {positions.data.length === 0 ? (
        <p className="text-warning text-sm">{t("org_no_positions")}</p>
      ) : null}
      {members.length === 0 ? (
        <p className="text-foreground-muted text-sm">{t("org_board_empty")}</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {members.map((appointment) => {
            const position = rank.get(appointment.positionId);
            return (
              <li key={appointment.id} className="flex flex-col gap-2 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {position ? I18nTextHelper.pick(position.titleI18n, locale) : ""} —{" "}
                      {appointment.person.displayName}
                    </span>
                    <span className="text-foreground-muted">
                      {t("org_appointment_type_value", { type: appointment.appointmentType })} ·{" "}
                      {OrgDateDraftHelper.label(
                        appointment.startsOn,
                        appointment.datePrecision,
                        locale,
                      )}
                      {appointment.endsOn
                        ? ` – ${OrgDateDraftHelper.label(appointment.endsOn, appointment.datePrecision, locale)} (${t("org_end_reason", { reason: appointment.endReason ?? "other" })})`
                        : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setEnding(appointment.id)}>
                      {t("org_appointment_end_action")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setReason("");
                        setRetracting(appointment);
                      }}
                    >
                      {t("org_appointment_retract")}
                    </Button>
                  </div>
                </div>
                {ending === appointment.id ? (
                  <EndAppointmentForm
                    unitId={unitId}
                    appointment={appointment}
                    onDone={() => setEnding(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {positions.data.length > 0 ? (
        <AppointmentForm
          key={termId ?? "none"}
          unitId={unitId}
          term={term}
          positions={positions.data}
        />
      ) : null}
      <ConfirmDialog
        open={retracting !== null}
        onOpenChange={(open) => (open ? undefined : setRetracting(null))}
        title={t("org_appointment_retract_title", { name: retracting?.person.displayName ?? "" })}
        description={
          <div className="flex flex-col gap-2">
            <p>{t("org_appointment_retract_body")}</p>
            <FormField
              id="retract-appointment-reason"
              label={t("org_appointment_retract_reason")}
              reserveMessage={false}
            >
              <Textarea
                id="retract-appointment-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </FormField>
          </div>
        }
        confirmLabel={t("org_appointment_retract")}
        cancelLabel={t("common_cancel")}
        destructive
        pending={retractAppointment.isPending}
        onConfirm={() => {
          if (!retracting || !reason.trim()) {
            return;
          }
          retractAppointment.mutate(
            { unitId, id: retracting.id, version: retracting.version, reason: reason.trim() },
            {
              onSuccess: () => {
                setRetracting(null);
                ToastHelper.show({ tone: "success", description: t("org_appointment_retracted") });
              },
              onError: (problem) => {
                setRetracting(null);
                ToastHelper.show({
                  tone: "danger",
                  description: t(ProblemMessageHelper.keyFor(problem.code)),
                });
              },
            },
          );
        }}
      />
    </Card>
  );
}
