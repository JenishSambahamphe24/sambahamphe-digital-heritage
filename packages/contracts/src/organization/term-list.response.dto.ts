import { z } from "zod";

import { termResponseSchema } from "./term.response.dto.js";

// Newest first.
export const termListResponseSchema = z.object({ data: z.array(termResponseSchema) });

export type TTermListResponse = z.infer<typeof termListResponseSchema>;
