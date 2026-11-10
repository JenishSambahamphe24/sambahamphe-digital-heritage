import type { TTermResponse } from "@repo/contracts";

import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button, FormField, Input, ToastHelper } from "@repo/ui";

import { FieldErrorsHelper } from "#/lib/field-errors.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { useOrgMutations } from "../hooks/useOrgMutations";
import { OrgDateDraftHelper } from "../org-date-draft.helper";
import { OrgDateInput } from "./OrgDateInput";

export interface TermFormProps {
  unitId: string;
  term?: TTermResponse;
  onDone: () => void;
}

export function TermForm({ unitId, term, onDone }: TermFormProps) {
  const t = useTranslations();
  const { saveTerm } = useOrgMutations();
  const [ordinal, setOrdinal] = useState(term?.ordinal?.toString() ?? "");
  const [labelEn, setLabelEn] = useState(term?.labelI18n?.en ?? "");
  const [labelNe, setLabelNe] = useState(term?.labelI18n?.ne ?? "");
  const [start, setStart] = useState(
    OrgDateDraftHelper.fromDate(term?.startsOn, term?.datePrecision),
  );
  const [end, setEnd] = useState(OrgDateDraftHelper.fromDate(term?.endsOn, term?.datePrecision));
  const errors = FieldErrorsHelper.byPath(saveTerm.error);
  const startDate = OrgDateDraftHelper.toDate(start);
  const endDate = OrgDateDraftHelper.toDate(end);
  const ready = startDate !== null && startDate !== "invalid" && endDate !== "invalid";

  return (
    <form
      noValidate
      className="border-border flex flex-col gap-1 rounded-lg border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready || !startDate) {
          return;
        }
        const label =
          labelEn.trim() || labelNe.trim()
            ? { en: labelEn.trim() || undefined, ne: labelNe.trim() || undefined }
            : null;
        saveTerm.mutate(
          {
            unitId,
            id: term?.id,
            version: term?.version,
            body: {
              ordinal: ordinal.trim() ? Number(ordinal) : null,
              labelI18n: label,
              startsOn: startDate.iso,
              endsOn: endDate?.iso ?? null,
              datePrecision: startDate.precision,
            },
          },
          {
            onSuccess: () => {
              ToastHelper.show({ tone: "success", description: t("org_term_saved") });
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
      <div className="grid gap-x-4 sm:grid-cols-3">
        <FormField id="term-ordinal" label={t("org_term_ordinal")}>
          <Input
            id="term-ordinal"
            inputMode="numeric"
            value={ordinal}
            aria-describedby="term-ordinal-message"
            onChange={(event) => setOrdinal(event.target.value)}
          />
        </FormField>
        <FormField id="term-label-en" label={t("org_term_label_en")}>
          <Input
            id="term-label-en"
            value={labelEn}
            aria-describedby="term-label-en-message"
            onChange={(event) => setLabelEn(event.target.value)}
          />
        </FormField>
        <FormField id="term-label-ne" label={t("org_term_label_ne")}>
          <Input
            id="term-label-ne"
            lang="ne"
            value={labelNe}
            aria-describedby="term-label-ne-message"
            onChange={(event) => setLabelNe(event.target.value)}
          />
        </FormField>
      </div>
      <FormField
        id="term-start"
        label={t("org_term_start")}
        error={errors.has("startsOn") ? t(errors.get("startsOn") ?? "field_error_invalid") : null}
      >
        <OrgDateInput id="term-start" value={start} onChange={setStart} />
      </FormField>
      <FormField
        id="term-end"
        label={t("org_term_end")}
        hint={t("org_term_end_hint")}
        error={errors.has("endsOn") ? t(errors.get("endsOn") ?? "field_error_invalid") : null}
      >
        <OrgDateInput id="term-end" value={end} onChange={setEnd} />
      </FormField>
      <div className="mt-2 flex gap-3">
        <Button type="submit" loading={saveTerm.isPending} disabled={!ready}>
          {t("common_save")}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t("common_cancel")}
        </Button>
      </div>
    </form>
  );
}
