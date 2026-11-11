import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";

const MAX_KEY_LENGTH = 64;
const MAX_RANK = 1000;
const MAX_HOLDERS_LIMIT = 500;

export const positionFieldsSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(MAX_KEY_LENGTH)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Use lowercase letters, numbers and underscores"),
  titleI18n: i18nTextSchema,
  // Display order on board pages: 1 comes first.
  rank: z.int().min(1).max(MAX_RANK),
  isOfficeBearer: z.boolean().default(false),
  // Omitted or null: any number of holders; 1: one at a time.
  maxHolders: z.int().min(1).max(MAX_HOLDERS_LIMIT).nullish(),
  active: z.boolean().default(true),
});

export type TPositionFields = z.infer<typeof positionFieldsSchema>;
