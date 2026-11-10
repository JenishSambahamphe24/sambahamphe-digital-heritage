import { z } from "zod";

import { offsetPageSchema } from "../common/pagination.dto.js";
import { adminPersonListItemResponseSchema } from "./admin-person-list-item.response.dto.js";

export const adminPersonListResponseSchema = z.object({
  data: z.array(adminPersonListItemResponseSchema),
  page: offsetPageSchema,
});

export type TAdminPersonListResponse = z.infer<typeof adminPersonListResponseSchema>;
