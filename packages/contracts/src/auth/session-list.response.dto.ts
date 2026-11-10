import { z } from "zod";

import { sessionResponseSchema } from "./session.response.dto.js";

export const sessionListResponseSchema = z.object({ data: z.array(sessionResponseSchema) });

export type TSessionListResponse = z.infer<typeof sessionListResponseSchema>;
