import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../users/list-users.query.dto.js";

const MAX_SEARCH_LENGTH = 100;

// Without q: the children of parentId (or the top-level places). With q: a
// search across current and alternative names, anywhere in the tree.
export const listPlacesQuerySchema = z.object({
  q: z.string().trim().min(1).max(MAX_SEARCH_LENGTH).optional(),
  parentId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type TListPlacesQuery = z.infer<typeof listPlacesQuerySchema>;
