import { z } from "zod";

import { isoDateField } from "../common/iso-date.dto.js";

// The board as it stood in a term, or on a date; neither means today.
export const boardQuerySchema = z.object({
  termId: z.uuid().optional(),
  on: isoDateField.optional(),
});

export type TBoardQuery = z.infer<typeof boardQuerySchema>;
