import { z } from "zod";

import { offsetPageSchema } from "../common/pagination.dto.js";
import { adminUserResponseSchema } from "./admin-user.response.dto.js";

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserResponseSchema),
  page: offsetPageSchema,
});

export type TAdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;
