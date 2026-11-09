import { z } from "zod";

import { BikramSambatHelper } from "./bikram-sambat.helper.js";
import { FuzzyDateHelper } from "./fuzzy-date.helper.js";

const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const MAX_DAY = 32;
const MAX_TEXT_LENGTH = 200;

export const QUALIFIERS = ["exact", "about", "before", "after", "between", "calculated"] as const;

const datePartsSchema = z
  .object({
    year: z.int().min(MIN_YEAR).max(MAX_YEAR),
    month: z.int().min(1).max(12).optional(),
    day: z.int().min(1).max(MAX_DAY).optional(),
  })
  .refine((parts) => parts.day === undefined || parts.month !== undefined, {
    message: "A day needs a month",
    path: ["day"],
  });

export type TDateParts = z.infer<typeof datePartsSchema>;

export const fuzzyDateSchema = z
  .object({
    calendar: z.enum(["BS", "AD"]),
    qualifier: z.enum(QUALIFIERS),
    ...datePartsSchema.shape,
    end: datePartsSchema.optional(),
    text: z.string().trim().max(MAX_TEXT_LENGTH).optional(),
  })
  .superRefine((date, context) => {
    let valid = true;
    const fail = (path: Array<string | number>, message: string) => {
      context.addIssue({ code: "custom", path, message });
      valid = false;
    };

    if (date.day !== undefined && date.month === undefined) {
      fail(["day"], "A day needs a month");
    }
    if ((date.qualifier === "between") !== (date.end !== undefined)) {
      fail(["end"], "An end date is required for 'between' and only allowed there");
    }
    if (!FuzzyDateSchemaHelper.dayExists(date.calendar, date)) {
      fail(["day"], "This day doesn't exist in that month");
    }
    if (date.end && !FuzzyDateSchemaHelper.dayExists(date.calendar, date.end)) {
      fail(["end", "day"], "This day doesn't exist in that month");
    }

    // Only compare once each part is valid; normalizing an invalid day throws.
    if (valid && date.qualifier === "between" && date.end) {
      const start = FuzzyDateHelper.normalize({ ...date, qualifier: "exact", end: undefined });
      const end = FuzzyDateHelper.normalize({
        ...date.end,
        calendar: date.calendar,
        qualifier: "exact",
      });
      if (end.to < start.from) {
        fail(["end"], "The end is before the start");
      }
    }
  });

export type TFuzzyDate = z.infer<typeof fuzzyDateSchema>;

export class FuzzyDateSchemaHelper {
  // BS years outside the table can't be checked day by day; 32 is the
  // longest any BS month gets, so that is the bound used there.
  static dayExists(
    calendar: "BS" | "AD",
    parts: { year: number; month?: number; day?: number },
  ): boolean {
    if (parts.month === undefined || parts.day === undefined) {
      return true;
    }
    if (calendar === "AD") {
      return parts.day <= new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
    }
    return BikramSambatHelper.isSupportedYear(parts.year)
      ? parts.day <= BikramSambatHelper.daysInMonth(parts.year, parts.month)
      : parts.day <= MAX_DAY;
  }
}
