import { z } from "zod";

import { FIELD_GROUPS, VISIBILITY_LEVELS } from "./person.enums.js";

export const fieldVisibilitySchema = z.partialRecord(
  z.enum(FIELD_GROUPS),
  z.enum(VISIBILITY_LEVELS),
);

export type TFieldVisibility = z.infer<typeof fieldVisibilitySchema>;
