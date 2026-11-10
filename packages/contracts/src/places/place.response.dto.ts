import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { placeAltNameSchema } from "./place-alt-name.dto.js";
import { placeSummaryResponseSchema } from "./place-summary.response.dto.js";
import { PLACE_KINDS } from "./place.enums.js";

export const placeResponseSchema = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  kind: z.enum(PLACE_KINDS),
  nameI18n: i18nTextSchema,
  notes: z.string().nullable(),
  altNames: z.array(placeAltNameSchema),
  // Root first, ending with the parent: "Nepal › Koshi › Panchthar".
  ancestors: z.array(placeSummaryResponseSchema),
  version: z.int(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type TPlaceResponse = z.infer<typeof placeResponseSchema>;
