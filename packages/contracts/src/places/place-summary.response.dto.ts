import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { PLACE_KINDS } from "./place.enums.js";

export const placeSummaryResponseSchema = z.object({
  id: z.uuid(),
  kind: z.enum(PLACE_KINDS),
  nameI18n: i18nTextSchema,
});

export type TPlaceSummaryResponse = z.infer<typeof placeSummaryResponseSchema>;
