import { z } from "zod";

// A calendar date without a time, "2026-04-14" (AD).
export const isoDateField = z.iso.date();
