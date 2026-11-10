import type { z } from "zod";

import { orgUnitFieldsSchema } from "./org-unit-fields.dto.js";

export const createOrgUnitRequestSchema = orgUnitFieldsSchema;

export type TCreateOrgUnitRequest = z.infer<typeof createOrgUnitRequestSchema>;
