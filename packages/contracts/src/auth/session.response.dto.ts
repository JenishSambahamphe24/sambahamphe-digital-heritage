import { z } from "zod";

export const sessionResponseSchema = z.object({
  id: z.uuid(),
  client: z.enum(["web", "admin", "mobile"]),
  userAgent: z.string().nullable(),
  createdAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
  current: z.boolean(),
});

export type TSessionResponse = z.infer<typeof sessionResponseSchema>;
