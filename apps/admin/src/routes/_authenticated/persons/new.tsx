import { createFileRoute } from "@tanstack/react-router";

import { PersonCreatePage } from "#/features/persons/components/PersonCreatePage";

export const Route = createFileRoute("/_authenticated/persons/new")({
  component: PersonCreatePage,
});
