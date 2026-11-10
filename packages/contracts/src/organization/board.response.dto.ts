import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { isoDateField } from "../common/iso-date.dto.js";
import { orgUnitNodeResponseSchema } from "./org-unit-node.response.dto.js";
import { APPOINTMENT_TYPES } from "./organization.enums.js";
import { termResponseSchema } from "./term.response.dto.js";

// Who held which position, ordered by the position's rank. A holder whose
// name the viewer may not see (a minor) is left out, not shown as hidden.
export const boardResponseSchema = z.object({
  unit: orgUnitNodeResponseSchema,
  term: termResponseSchema.nullable(),
  on: isoDateField,
  members: z.array(
    z.object({
      position: z.object({
        id: z.uuid(),
        key: z.string(),
        titleI18n: i18nTextSchema,
        rank: z.int(),
        isOfficeBearer: z.boolean(),
      }),
      personId: z.uuid(),
      displayName: z.string(),
      appointmentType: z.enum(APPOINTMENT_TYPES),
      startsOn: isoDateField,
      endsOn: isoDateField.nullable(),
    }),
  ),
});

export type TBoardResponse = z.infer<typeof boardResponseSchema>;
