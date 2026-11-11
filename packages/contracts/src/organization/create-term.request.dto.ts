import type { z } from "zod";

import { termFieldsSchema } from "./term-fields.dto.js";

export const createTermRequestSchema = termFieldsSchema;

export type TCreateTermRequest = z.infer<typeof createTermRequestSchema>;
