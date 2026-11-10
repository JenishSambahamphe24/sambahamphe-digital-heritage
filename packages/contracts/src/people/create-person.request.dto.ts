import { z } from "zod";

import { personFieldsSchema } from "./person-fields.dto.js";

const MAX_REASON_LENGTH = 500;

export const createPersonRequestSchema = personFieldsSchema.extend({
  reason: z.string().trim().max(MAX_REASON_LENGTH).nullish(),
});

export type TCreatePersonRequest = z.infer<typeof createPersonRequestSchema>;
