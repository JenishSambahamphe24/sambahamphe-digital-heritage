import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { placeAltNameSchema } from "./place-alt-name.dto.js";
import { PLACE_KINDS } from "./place.enums.js";

const MAX_NOTES_LENGTH = 2000;
const MAX_ALT_NAMES = 50;
const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

export const createPlaceRequestSchema = z.object({
  parentId: z.uuid().nullish(),
  kind: z.enum(PLACE_KINDS),
  nameI18n: i18nTextSchema,
  latitude: z.number().min(-LATITUDE_LIMIT).max(LATITUDE_LIMIT).nullish(),
  longitude: z.number().min(-LONGITUDE_LIMIT).max(LONGITUDE_LIMIT).nullish(),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).nullish(),
  altNames: z.array(placeAltNameSchema).max(MAX_ALT_NAMES).default([]),
});

export type TCreatePlaceRequest = z.infer<typeof createPlaceRequestSchema>;
