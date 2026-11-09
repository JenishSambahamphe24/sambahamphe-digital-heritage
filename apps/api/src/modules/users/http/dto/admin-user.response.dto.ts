import { z } from "zod";

export const adminUserResponseSchema = z.object({
  id: z.uuid(),
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  displayName: z.string(),
  status: z.enum(["active", "suspended", "deleted"]),
  createdAt: z.iso.datetime(),
  lastLoginAt: z.iso.datetime().nullable(),
});

export type TAdminUserResponse = z.infer<typeof adminUserResponseSchema>;
