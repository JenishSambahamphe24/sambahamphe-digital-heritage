import type { IFuzzyDateDraft } from "../fuzzy-date-draft.helper";

import { useLocale, useTranslations } from "use-intl";

import { QUALIFIERS } from "@repo/dates";
import { Input, Select } from "@repo/ui";

import { FuzzyDateDraftHelper } from "../fuzzy-date-draft.helper";

export interface FuzzyDateInputProps {
  id: string;
  value: IFuzzyDateDraft;
  onChange: (value: IFuzzyDateDraft) => void;
  invalid?: boolean;
}

export function FuzzyDateInput({ id, value, onChange, invalid }: FuzzyDateInputProps) {
  const t = useTranslations();
  const locale = useLocale() === "ne" ? "ne" : "en";
  const set = (patch: Partial<IFuzzyDateDraft>) => onChange({ ...value, ...patch });
  const date = FuzzyDateDraftHelper.toDate(value);
  const preview = FuzzyDateDraftHelper.preview(date, locale);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <Select
          aria-label={t("date_calendar")}
          value={value.calendar}
          onValueChange={(value) => set({ calendar: value as IFuzzyDateDraft["calendar"] })}
          options={[
            { value: "BS", label: t("date_calendar_bs") },
            { value: "AD", label: t("date_calendar_ad") },
          ]}
        />
        <Select
          aria-label={t("date_qualifier")}
          value={value.qualifier}
          onValueChange={(value) => set({ qualifier: value as IFuzzyDateDraft["qualifier"] })}
          options={QUALIFIERS.map((qualifier) => ({
            value: qualifier,
            label: t("date_qualifier_value", { qualifier }),
          }))}
        />
        <Input
          id={id}
          aria-label={t("date_year")}
          placeholder={t("date_year")}
          inputMode="numeric"
          invalid={invalid}
          aria-describedby={`${id}-message`}
          value={value.year}
          onChange={(event) => set({ year: event.target.value })}
        />
        <Input
          aria-label={t("date_month")}
          placeholder={t("date_month")}
          inputMode="numeric"
          value={value.month}
          onChange={(event) => set({ month: event.target.value })}
        />
        <Input
          aria-label={t("date_day")}
          placeholder={t("date_day")}
          inputMode="numeric"
          disabled={!value.month}
          value={value.day}
          onChange={(event) => set({ day: event.target.value })}
        />
        {value.qualifier === "between" ? (
          <Input
            aria-label={t("date_end_year")}
            placeholder={t("date_end_year")}
            inputMode="numeric"
            value={value.endYear}
            onChange={(event) => set({ endYear: event.target.value })}
          />
        ) : null}
      </div>
      {preview ? <p className="text-foreground-muted text-sm">{preview}</p> : null}
    </div>
  );
}
