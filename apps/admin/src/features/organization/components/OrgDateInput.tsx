import type { IOrgDateDraft } from "../org-date-draft.helper";

import { useLocale, useTranslations } from "use-intl";

import { Input, Select } from "@repo/ui";

import { OrgDateDraftHelper } from "../org-date-draft.helper";

export interface OrgDateInputProps {
  id: string;
  value: IOrgDateDraft;
  onChange: (value: IOrgDateDraft) => void;
  invalid?: boolean;
}

export function OrgDateInput({ id, value, onChange, invalid }: OrgDateInputProps) {
  const t = useTranslations();
  const locale = useLocale() === "ne" ? "ne" : "en";
  const set = (patch: Partial<IOrgDateDraft>) => onChange({ ...value, ...patch });
  const date = OrgDateDraftHelper.toDate(value);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          aria-label={t("date_calendar")}
          value={value.calendar}
          onValueChange={(calendar) => set({ calendar: calendar as IOrgDateDraft["calendar"] })}
          options={[
            { value: "BS", label: t("date_calendar_bs") },
            { value: "AD", label: t("date_calendar_ad") },
          ]}
        />
        <Input
          id={id}
          aria-label={t("date_year")}
          placeholder={t("date_year")}
          inputMode="numeric"
          invalid={invalid || date === "invalid"}
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
      </div>
      <p className="text-foreground-muted min-h-5 text-sm">
        {date === "invalid"
          ? t("org_date_invalid")
          : date
            ? t("org_date_preview", {
                date: OrgDateDraftHelper.label(date.iso, date.precision, locale),
                ad: date.iso,
              })
            : null}
      </p>
    </div>
  );
}
