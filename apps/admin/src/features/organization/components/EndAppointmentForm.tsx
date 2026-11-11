import type { TAppointmentEndReason, TAppointmentResponse } from "@repo/contracts";

import { useState } from "react";
import { useTranslations } from "use-intl";

import { APPOINTMENT_END_REASONS } from "@repo/contracts";
import { Button, FormField, Select, ToastHelper } from "@repo/ui";

import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { useOrgMutations } from "../hooks/useOrgMutations";
import { OrgDateDraftHelper } from "../org-date-draft.helper";
import { OrgDateInput } from "./OrgDateInput";

export interface EndAppointmentFormProps {
  unitId: string;
  appointment: TAppointmentResponse;
  onDone: () => void;
}

// Ending is a fact about the tenure (resigned, term ended), unlike retracting a mistake.
export function EndAppointmentForm({ unitId, appointment, onDone }: EndAppointmentFormProps) {
  const t = useTranslations();
  const { updateAppointment } = useOrgMutations();
  const [end, setEnd] = useState(
    OrgDateDraftHelper.fromDate(appointment.endsOn, appointment.datePrecision),
  );
  const [reason, setReason] = useState<TAppointmentEndReason>(
    appointment.endReason ?? "term_ended",
  );
  const endDate = OrgDateDraftHelper.toDate(end);
  return (
    <form
      noValidate
      className="bg-surface-muted flex flex-col gap-1 rounded-md p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!endDate || endDate === "invalid") {
          return;
        }
        updateAppointment.mutate(
          {
            unitId,
            id: appointment.id,
            body: {
              termId: appointment.termId,
              appointmentType: appointment.appointmentType,
              startsOn: appointment.startsOn,
              endsOn: endDate.iso,
              datePrecision: appointment.datePrecision,
              endReason: reason,
              notes: appointment.notes,
              version: appointment.version,
            },
          },
          {
            onSuccess: () => {
              ToastHelper.show({ tone: "success", description: t("org_appointment_saved") });
              onDone();
            },
            onError: (problem) =>
              ToastHelper.show({
                tone: "danger",
                description: t(ProblemMessageHelper.keyFor(problem.code)),
              }),
          },
        );
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField id={`end-${appointment.id}`} label={t("org_appointment_end")}>
          <OrgDateInput id={`end-${appointment.id}`} value={end} onChange={setEnd} />
        </FormField>
        <FormField id={`end-reason-${appointment.id}`} label={t("org_appointment_end_reason")}>
          <Select
            id={`end-reason-${appointment.id}`}
            value={reason}
            onValueChange={(value) => setReason(value as TAppointmentEndReason)}
            options={APPOINTMENT_END_REASONS.map((option) => ({
              value: option,
              label: t("org_end_reason", { reason: option }),
            }))}
          />
        </FormField>
      </div>
      <div className="flex gap-3">
        <Button
          type="submit"
          loading={updateAppointment.isPending}
          disabled={!endDate || endDate === "invalid"}
        >
          {t("common_save")}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t("common_cancel")}
        </Button>
      </div>
    </form>
  );
}
