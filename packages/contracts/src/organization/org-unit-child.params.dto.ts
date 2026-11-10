import { z } from "zod";

export const orgUnitChildParamsSchema = z.object({ id: z.uuid(), childId: z.uuid() });

export type TOrgUnitChildParams = z.infer<typeof orgUnitChildParamsSchema>;
