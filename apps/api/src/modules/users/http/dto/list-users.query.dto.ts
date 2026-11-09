import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

export const listUsersQuerySchema = z.object({
  q: z.string().trim().min(1).max(MAX_SEARCH_LENGTH).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type TListUsersQuery = z.infer<typeof listUsersQuerySchema>;
