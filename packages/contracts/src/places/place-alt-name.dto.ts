import { z } from "zod";

import { PLACE_ALT_NAME_KINDS } from "./place.enums.js";

const MAX_NAME_LENGTH = 200;
const MAX_TAG_LENGTH = 16;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

const year = z.int().min(MIN_YEAR).max(MAX_YEAR);

export const placeAltNameSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
    language: z.string().trim().max(MAX_TAG_LENGTH).nullish(),
    script: z.string().trim().max(MAX_TAG_LENGTH).nullish(),
    kind: z.enum(PLACE_ALT_NAME_KINDS).default("variant"),
    validFromYear: year.nullish(),
    validToYear: year.nullish(),
  })
  .refine((alt) => !alt.validFromYear || !alt.validToYear || alt.validFromYear <= alt.validToYear, {
    message: "The end year can't be before the start year",
    path: ["validToYear"],
  });

export type TPlaceAltName = z.infer<typeof placeAltNameSchema>;
