import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PlaceCreatePage } from "#/features/places/components/PlaceCreatePage";

const newPlaceSearchSchema = z.object({ parentId: z.uuid().optional().catch(undefined) });

export const Route = createFileRoute("/_authenticated/places/new")({
  validateSearch: newPlaceSearchSchema,
  component: PlaceCreatePage,
});
