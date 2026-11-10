import { z } from "zod";

// Only what an organization manager needs to pick a board member: no dates,
// places or status, even for editors.
export const personOptionListResponseSchema = z.object({
  data: z.array(z.object({ id: z.uuid(), displayName: z.string() })),
});

export type TPersonOptionListResponse = z.infer<typeof personOptionListResponseSchema>;
