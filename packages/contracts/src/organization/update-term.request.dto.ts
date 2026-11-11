import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { isoDateField } from "../common/iso-date.dto.js";
import { versionField } from "../common/version.dto.js";
import { DATE_PRECISIONS } from "./organization.enums.js";

const MAX_ORDINAL = 1000;
const MAX_NOTES_LENGTH = 2000;

export const updateTermRequestSchema = z
  .object({
    ordinal: z.int().min(1).max(MAX_ORDINAL).nullish(),
    labelI18n: i18nTextSchema.nullish(),
    startsOn: isoDateField,
    endsOn: isoDateField.nullish(),
    datePrecision: z.enum(DATE_PRECISIONS).default("day"),
    notes: z.string().trim().max(MAX_NOTES_LENGTH).nullish(),
    version: versionField,
  })
  .refine((term) => !term.endsOn || term.endsOn > term.startsOn, {
    message: "The end must be after the start",
    path: ["endsOn"],
  });

export type TUpdateTermRequest = z.infer<typeof updateTermRequestSchema>;
