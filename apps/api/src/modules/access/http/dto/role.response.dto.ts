import { z } from "zod";

export const roleResponseSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissions: z.array(z.string()),
});

export type TRoleResponse = z.infer<typeof roleResponseSchema>;
