import { z } from "zod";

// The version the client last read; a mismatch is 409 version_conflict.
export const versionField = z.int().min(1);
