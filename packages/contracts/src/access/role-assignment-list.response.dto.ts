import { z } from "zod";

import { roleAssignmentResponseSchema } from "./role-assignment.response.dto.js";

export const roleAssignmentListResponseSchema = z.object({
  data: z.array(roleAssignmentResponseSchema),
});

export type TRoleAssignmentListResponse = z.infer<typeof roleAssignmentListResponseSchema>;
