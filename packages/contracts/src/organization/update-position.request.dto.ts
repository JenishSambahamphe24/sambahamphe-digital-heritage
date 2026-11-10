import type { z } from "zod";

import { versionField } from "../common/version.dto.js";
import { positionFieldsSchema } from "./position-fields.dto.js";

export const updatePositionRequestSchema = positionFieldsSchema.extend({ version: versionField });

export type TUpdatePositionRequest = z.infer<typeof updatePositionRequestSchema>;
