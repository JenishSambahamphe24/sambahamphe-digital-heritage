import { z } from "zod";

import { placeSummaryResponseSchema } from "./place-summary.response.dto.js";

export const placeListItemResponseSchema = placeSummaryResponseSchema.extend({
  parentId: z.uuid().nullable(),
  childCount: z.int().min(0),
  // The alt name that matched a search, so "Old VDC name" results make sense.
  matchedAltName: z.string().nullable(),
  ancestors: z.array(placeSummaryResponseSchema),
});

export type TPlaceListItemResponse = z.infer<typeof placeListItemResponseSchema>;
