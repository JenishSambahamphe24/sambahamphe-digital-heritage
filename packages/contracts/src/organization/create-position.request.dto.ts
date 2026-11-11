import type { z } from "zod";

import { positionFieldsSchema } from "./position-fields.dto.js";

export const createPositionRequestSchema = positionFieldsSchema;

export type TCreatePositionRequest = z.infer<typeof createPositionRequestSchema>;
