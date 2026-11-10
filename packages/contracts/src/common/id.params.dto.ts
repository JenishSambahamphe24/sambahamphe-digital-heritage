import { z } from "zod";

export const idParamsSchema = z.object({ id: z.uuid() });

export type TIdParams = z.infer<typeof idParamsSchema>;
