import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../users/list-users.query.dto.js";

const MAX_SEARCH_LENGTH = 100;

export const listPersonsQuerySchema = z.object({
  q: z.string().trim().min(1).max(MAX_SEARCH_LENGTH).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type TListPersonsQuery = z.infer<typeof listPersonsQuerySchema>;
