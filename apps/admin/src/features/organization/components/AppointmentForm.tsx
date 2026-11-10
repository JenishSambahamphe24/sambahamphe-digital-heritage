import type { IPickedPerson } from "./PersonOptionPicker";
import type { TAppointmentType, TPositionResponse, TTermResponse } from "@repo/contracts";

import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { APPOINTMENT_TYPES } from "@repo/contracts";
import { Button, FormField, Select, ToastHelper } from "@repo/ui";

import { FieldErrorsHelper } from "#/lib/field-errors.helper";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { useOrgMutations } from "../hooks/useOrgMutations";
import { OrgDateDraftHelper } from "../org-date-draft.helper";
import { OrgDateInput } from "./OrgDateInput";
import { PersonOptionPicker } from "./PersonOptionPicker";

export interface AppointmentFormProps {
  unitId: string;
  term: TTermResponse | null;
  positions: TPositionResponse[];
}

// Adds one board member; the start defaults to the term's start.
export function AppointmentForm({ unitId, term, positions }: AppointmentFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { createAppointment } = useOrgMutations();
  const active = positions.filter((position) => position.active);
  const [positionId, setPositionId] = useState(active[0]?.id ?? "");
  const [person, setPerson] = useState<IPickedPerson | null>(null);
  const [type, setType] = useState<TAppointmentType>("elected");
  const [start, setStart] = useState(
    OrgDateDraftHelper.fromDate(term?.startsOn, term?.datePrecision),
  );
  const errors = FieldErrorsHelper.byPath(createAppointment.error);
  const error = (path: string) =>
    errors.has(path) ? t(errors.get(path) ?? "field_error_invalid") : null;
  const startDate = OrgDateDraftHelper.toDate(start);
  const ready = Boolean(positionId && person && startDate && startDate !== "invalid");

  return (
    <form
      noValidate
      className="border-border flex flex-col gap-1 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready || !person || !startDate || startDate === "invalid") {
          return;
        }
        createAppointment.mutate(
          {
            unitId,
            body: {
              personId: person.id,
              positionId,
              termId: term?.id ?? null,
              appointmentType: type,
              startsOn: startDate.iso,
              datePrecision: startDate.precision,
            },
          },
          {
            onSuccess: () => {
              setPerson(null);
              ToastHelper.show({ tone: "success", description: t("org_appointment_saved") });
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
      <h3 className="text-sm font-medium">{t("org_appointment_add")}</h3>
      <div className="grid gap-x-4 sm:grid-cols-3">
        <FormField id="appointment-position" label={t("org_position")} error={error("positionId")}>
          <Select
            id="appointment-position"
            value={positionId}
            invalid={errors.has("positionId")}
            aria-describedby="appointment-position-message"
            onValueChange={setPositionId}
            options={active.map((position) => ({
              value: position.id,
              label: I18nTextHelper.pick(position.titleI18n, locale),
            }))}
          />
        </FormField>
        <FormField id="appointment-person" label={t("org_person")} error={error("personId")}>
          <PersonOptionPicker
            id="appointment-person"
            unitId={unitId}
            value={person}
            onChange={setPerson}
            invalid={errors.has("personId")}
          />
        </FormField>
        <FormField id="appointment-type" label={t("org_appointment_type")}>
          <Select
            id="appointment-type"
            value={type}
            onValueChange={(value) => setType(value as TAppointmentType)}
            options={APPOINTMENT_TYPES.map((option) => ({
              value: option,
              label: t("org_appointment_type_value", { type: option }),
            }))}
          />
        </FormField>
      </div>
      <FormField
        id="appointment-start"
        label={t("org_appointment_start")}
        error={error("startsOn")}
      >
        <OrgDateInput
          id="appointment-start"
          value={start}
          onChange={setStart}
          invalid={errors.has("startsOn")}
        />
      </FormField>
      <Button
        type="submit"
        className="mt-2 self-start"
        loading={createAppointment.isPending}
        disabled={!ready}
      >
        {t("org_appointment_add_submit")}
      </Button>
    </form>
  );
}
