import { z } from "zod";

import { orgUnitNodeResponseSchema } from "./org-unit-node.response.dto.js";

// The whole tree in one list: a few hundred boards at most, so no paging.
export const orgUnitTreeResponseSchema = z.object({ data: z.array(orgUnitNodeResponseSchema) });

export type TOrgUnitTreeResponse = z.infer<typeof orgUnitTreeResponseSchema>;
