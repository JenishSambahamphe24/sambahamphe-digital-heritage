import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PersonsPage } from "#/features/persons/components/PersonsPage";

const MAX_SEARCH_LENGTH = 100;

const personsSearchSchema = z.object({
  q: z.string().trim().max(MAX_SEARCH_LENGTH).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/persons/")({
  validateSearch: personsSearchSchema,
  component: PersonsPage,
});
