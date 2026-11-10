import { createFileRoute } from "@tanstack/react-router";

import { PersonEditPage } from "#/features/persons/components/PersonEditPage";

export const Route = createFileRoute("/_authenticated/persons/$personId")({
  component: PersonEditPage,
});
