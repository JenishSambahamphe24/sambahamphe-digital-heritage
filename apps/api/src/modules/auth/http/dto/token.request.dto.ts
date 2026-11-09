import { z } from "zod";

import { tokenField } from "./fields.js";

export const tokenRequestSchema = z.object({ token: tokenField });

export type TTokenRequest = z.infer<typeof tokenRequestSchema>;
