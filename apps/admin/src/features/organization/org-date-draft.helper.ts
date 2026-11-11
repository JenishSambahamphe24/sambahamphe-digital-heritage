import type { TDatePrecision } from "@repo/contracts";

import { BikramSambatHelper, IsoDateFormatHelper } from "@repo/dates";

export interface IOrgDateDraft {
  calendar: "BS" | "AD";
  year: string;
  month: string;
  day: string;
}

export interface IOrgDate {
  iso: string;
  precision: TDatePrecision;
}

export const EMPTY_ORG_DATE: IOrgDateDraft = { calendar: "BS", year: "", month: "", day: "" };

const FIRST = 1;
const ISO_PAD = 2;
const YEAR_PAD = 4;

// Board dates are stored as AD days (range rules need real dates) plus how
// exact they are; editors usually know them in BS. A date known only to the
// year or month becomes its first day, with that precision.
export class OrgDateDraftHelper {
  static toDate(draft: IOrgDateDraft): IOrgDate | null | "invalid" {
    if (!draft.year.trim()) {
      return null;
    }
    const year = Number(draft.year);
    const month = draft.month.trim() ? Number(draft.month) : FIRST;
    const day = draft.month.trim() && draft.day.trim() ? Number(draft.day) : FIRST;
    const precision: TDatePrecision = !draft.month.trim()
      ? "year"
      : !draft.day.trim()
        ? "month"
        : "day";
    try {
      const ad =
        draft.calendar === "BS"
          ? BikramSambatHelper.toAd({ year, month, day })
          : { year, month, day };
      const iso = `${String(ad.year).padStart(YEAR_PAD, "0")}-${String(ad.month).padStart(ISO_PAD, "0")}-${String(ad.day).padStart(ISO_PAD, "0")}`;
      return Number.isNaN(Date.parse(iso)) ? "invalid" : { iso, precision };
    } catch {
      return "invalid";
    }
  }

  // Shown in BS when the table covers it, else in AD.
  static fromDate(
    iso: string | null | undefined,
    precision: TDatePrecision = "day",
  ): IOrgDateDraft {
    if (!iso) {
      return EMPTY_ORG_DATE;
    }
    const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
    let parts = { year, month, day };
    let calendar: "BS" | "AD";
    try {
      parts = BikramSambatHelper.fromAd({ year, month, day });
      calendar = "BS";
    } catch {
      calendar = "AD";
    }
    return {
      calendar,
      year: String(parts.year),
      month: precision === "year" ? "" : String(parts.month),
      day: precision === "day" ? String(parts.day) : "",
    };
  }

  // "Baisakh 2079 BS" for a month-precision date; AD when outside the BS table.
  static label(iso: string, precision: TDatePrecision, locale: "en" | "ne"): string {
    return IsoDateFormatHelper.format(iso, precision, locale);
  }
}
