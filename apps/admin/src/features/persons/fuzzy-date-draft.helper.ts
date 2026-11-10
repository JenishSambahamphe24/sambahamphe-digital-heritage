import type { QUALIFIERS, TFuzzyDate } from "@repo/dates";

import { FuzzyDateFormatHelper } from "@repo/dates";

export interface IFuzzyDateDraft {
  calendar: "BS" | "AD";
  qualifier: (typeof QUALIFIERS)[number];
  year: string;
  month: string;
  day: string;
  endYear: string;
}

export const EMPTY_DATE_DRAFT: IFuzzyDateDraft = {
  calendar: "BS",
  qualifier: "exact",
  year: "",
  month: "",
  day: "",
  endYear: "",
};

export class FuzzyDateDraftHelper {
  static fromDate(date: TFuzzyDate | null | undefined): IFuzzyDateDraft {
    if (!date) {
      return EMPTY_DATE_DRAFT;
    }
    return {
      calendar: date.calendar,
      qualifier: date.qualifier,
      year: String(date.year),
      month: date.month?.toString() ?? "",
      day: date.day?.toString() ?? "",
      endYear: date.end?.year.toString() ?? "",
    };
  }

  // Null while no year is given: the date is simply unknown.
  static toDate(draft: IFuzzyDateDraft): TFuzzyDate | null {
    if (!draft.year.trim()) {
      return null;
    }
    const number = (value: string) => (value.trim() ? Number(value) : undefined);
    return {
      calendar: draft.calendar,
      qualifier: draft.qualifier,
      year: Number(draft.year),
      month: number(draft.month),
      day: number(draft.month) === undefined ? undefined : number(draft.day),
      end:
        draft.qualifier === "between" && draft.endYear.trim()
          ? { year: Number(draft.endYear) }
          : undefined,
    };
  }

  // The date as the site will show it; nothing while it is incomplete or invalid.
  static preview(date: TFuzzyDate | null, locale: "en" | "ne"): string | null {
    if (!date) {
      return null;
    }
    try {
      return FuzzyDateFormatHelper.format(date, locale);
    } catch {
      return null;
    }
  }
}
