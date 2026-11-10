import { z } from "zod";

export const problemFieldErrorSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  code: z.string(),
  message: z.string(),
});

// RFC 9457 problem details, as every error response is shaped (API conventions §3).
export const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.int(),
  code: z.string(),
  detail: z.string(),
  instance: z.string(),
  requestId: z.string().nullable(),
  errors: z.array(problemFieldErrorSchema).optional(),
  // On 409 version_conflict: the version the client should reload.
  currentVersion: z.int().optional(),
});

export type TProblemFieldError = z.infer<typeof problemFieldErrorSchema>;
export type TProblemDetails = z.infer<typeof problemDetailsSchema>;
