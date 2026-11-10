import { z } from "zod";

import { roleResponseSchema } from "./role.response.dto.js";

export const roleListResponseSchema = z.object({ data: z.array(roleResponseSchema) });

export type TRoleListResponse = z.infer<typeof roleListResponseSchema>;
