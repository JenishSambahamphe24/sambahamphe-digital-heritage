import { createFileRoute } from "@tanstack/react-router";

import { PlaceEditPage } from "#/features/places/components/PlaceEditPage";

export const Route = createFileRoute("/_authenticated/places/$placeId")({
  component: PlaceEditPage,
});
