import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";

export const orgUnitTypeResponseSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  nameI18n: i18nTextSchema,
  levelOrder: z.int(),
  allowedParentTypeIds: z.array(z.uuid()),
});

export type TOrgUnitTypeResponse = z.infer<typeof orgUnitTypeResponseSchema>;
