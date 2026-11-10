import { z } from "zod";

import { offsetPageSchema } from "../common/pagination.dto.js";
import { personResponseSchema } from "./person.response.dto.js";

export const personListResponseSchema = z.object({
  data: z.array(personResponseSchema),
  page: offsetPageSchema,
});

export type TPersonListResponse = z.infer<typeof personListResponseSchema>;
