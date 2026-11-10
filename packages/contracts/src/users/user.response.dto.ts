import { z } from "zod";

export const userResponseSchema = z.object({
  id: z.uuid(),
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  displayName: z.string(),
  preferredLocale: z.string(),
});

export type TUserResponse = z.infer<typeof userResponseSchema>;
