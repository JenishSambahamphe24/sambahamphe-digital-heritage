import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";

export const positionResponseSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  titleI18n: i18nTextSchema,
  rank: z.int(),
  isOfficeBearer: z.boolean(),
  maxHolders: z.int().nullable(),
  active: z.boolean(),
  version: z.int(),
});

export type TPositionResponse = z.infer<typeof positionResponseSchema>;
