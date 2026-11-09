import { z } from "zod";

// Identical whether or not the email exists, so it reveals nothing.
export const checkEmailResponseSchema = z.object({ status: z.literal("check_email") });

export type TCheckEmailResponse = z.infer<typeof checkEmailResponseSchema>;
