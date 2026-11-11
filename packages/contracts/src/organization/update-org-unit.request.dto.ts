import type { z } from "zod";

import { versionField } from "../common/version.dto.js";
import { orgUnitFieldsSchema } from "./org-unit-fields.dto.js";

export const updateOrgUnitRequestSchema = orgUnitFieldsSchema.extend({ version: versionField });

export type TUpdateOrgUnitRequest = z.infer<typeof updateOrgUnitRequestSchema>;
