import type { z } from "zod";

import { versionField } from "../common/version.dto.js";
import { createPersonRequestSchema } from "./create-person.request.dto.js";

// A full replacement of the editable fields (names included), checked against
// the version the editor started from.
export const updatePersonRequestSchema = createPersonRequestSchema.extend({
  version: versionField,
});

export type TUpdatePersonRequest = z.infer<typeof updatePersonRequestSchema>;
