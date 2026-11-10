import { z } from "zod";

import { positionResponseSchema } from "./position.response.dto.js";

export const positionListResponseSchema = z.object({ data: z.array(positionResponseSchema) });

export type TPositionListResponse = z.infer<typeof positionListResponseSchema>;
