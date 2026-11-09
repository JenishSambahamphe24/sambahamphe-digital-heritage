import { z } from "zod";

export const offsetPageSchema = z.object({
  page: z.int().min(1),
  pageSize: z.int().min(1),
  total: z.int().min(0),
});

export const cursorPageSchema = z.object({
  nextCursor: z.string().nullable(),
  limit: z.int().min(1),
});

export type TOffsetPage = z.infer<typeof offsetPageSchema>;
export type TCursorPage = z.infer<typeof cursorPageSchema>;
