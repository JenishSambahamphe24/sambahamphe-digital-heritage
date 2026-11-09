import { z } from "zod";

import { userResponseSchema } from "../../../users/dto/user.response.dto.js";

export const loginResponseSchema = z.object({
  user: userResponseSchema,
  sessionToken: z.string().optional(),
});

export type TLoginResponse = z.infer<typeof loginResponseSchema>;
