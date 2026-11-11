import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { isoDateField } from "../common/iso-date.dto.js";
import { DATE_PRECISIONS } from "./organization.enums.js";

export const termResponseSchema = z.object({
  id: z.uuid(),
  orgUnitId: z.uuid(),
  ordinal: z.int().nullable(),
  labelI18n: i18nTextSchema.nullable(),
  startsOn: isoDateField,
  endsOn: isoDateField.nullable(),
  datePrecision: z.enum(DATE_PRECISIONS),
  notes: z.string().nullable(),
  isCurrent: z.boolean(),
  version: z.int(),
});

export type TTermResponse = z.infer<typeof termResponseSchema>;
