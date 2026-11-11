import { z } from "zod";

const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;

export const personOptionsQuerySchema = z.object({
  unitId: z.uuid(),
  q: z.string().trim().min(MIN_SEARCH_LENGTH).max(MAX_SEARCH_LENGTH),
});

export type TPersonOptionsQuery = z.infer<typeof personOptionsQuerySchema>;
