import type { z } from "zod";

import { versionField } from "../common/version.dto.js";
import { createPlaceRequestSchema } from "./create-place.request.dto.js";

// A full replacement of the editable fields, alt names included.
export const updatePlaceRequestSchema = createPlaceRequestSchema.extend({ version: versionField });

export type TUpdatePlaceRequest = z.infer<typeof updatePlaceRequestSchema>;
