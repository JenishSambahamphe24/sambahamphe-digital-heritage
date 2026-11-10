import { z } from "zod";

import { cursorPageSchema } from "../common/pagination.dto.js";
import { auditEntryResponseSchema } from "./audit-entry.response.dto.js";

export const auditEntryListResponseSchema = z.object({
  data: z.array(auditEntryResponseSchema),
  page: cursorPageSchema,
});

export type TAuditEntryListResponse = z.infer<typeof auditEntryListResponseSchema>;
