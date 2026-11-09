import { z } from "zod";

export const sessionIdParamsSchema = z.object({ id: z.uuid() });

export type TSessionIdParams = z.infer<typeof sessionIdParamsSchema>;
