import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PlacesPage } from "#/features/places/components/PlacesPage";

const MAX_SEARCH_LENGTH = 100;

const placesSearchSchema = z.object({
  q: z.string().trim().max(MAX_SEARCH_LENGTH).optional().catch(undefined),
  parentId: z.uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/places/")({
  validateSearch: placesSearchSchema,
  component: PlacesPage,
});
