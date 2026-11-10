import { z } from "zod";

const MAX_LABEL_LENGTH = 200;

const label = z.string().trim().min(1).max(MAX_LABEL_LENGTH);

// Short localized labels (place and clan names). At least one language is
// required; the other may be filled in later.
export const i18nTextSchema = z
  .object({ en: label.optional(), ne: label.optional() })
  .refine((text) => text.en !== undefined || text.ne !== undefined, {
    message: "Give the name in at least one language",
  });

export type TI18nText = z.infer<typeof i18nTextSchema>;
