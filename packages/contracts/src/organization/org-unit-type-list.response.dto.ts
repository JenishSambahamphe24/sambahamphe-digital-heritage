import { z } from "zod";

import { orgUnitTypeResponseSchema } from "./org-unit-type.response.dto.js";

export const orgUnitTypeListResponseSchema = z.object({ data: z.array(orgUnitTypeResponseSchema) });

export type TOrgUnitTypeListResponse = z.infer<typeof orgUnitTypeListResponseSchema>;
