import type { IFuzzyDateDraft } from "../fuzzy-date-draft.helper";

import { useLocale, useTranslations } from "use-intl";

import { QUALIFIERS } from "@repo/dates";
import { Input } from "@repo/ui";

import { Select } from "#/components/Select";

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
          onChange={(event) => set({ calendar: event.target.value as IFuzzyDateDraft["calendar"] })}
        >
          <option value="BS">{t("date_calendar_bs")}</option>
          <option value="AD">{t("date_calendar_ad")}</option>
        </Select>
        <Select
          aria-label={t("date_qualifier")}
          value={value.qualifier}
          onChange={(event) =>
            set({ qualifier: event.target.value as IFuzzyDateDraft["qualifier"] })
          }
        >
          {QUALIFIERS.map((qualifier) => (
            <option key={qualifier} value={qualifier}>
              {t("date_qualifier_value", { qualifier })}
            </option>
          ))}
        </Select>
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
