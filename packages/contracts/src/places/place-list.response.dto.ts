import { z } from "zod";

import { offsetPageSchema } from "../common/pagination.dto.js";
import { placeListItemResponseSchema } from "./place-list-item.response.dto.js";

export const placeListResponseSchema = z.object({
  data: z.array(placeListItemResponseSchema),
  page: offsetPageSchema,
});

export type TPlaceListResponse = z.infer<typeof placeListResponseSchema>;
