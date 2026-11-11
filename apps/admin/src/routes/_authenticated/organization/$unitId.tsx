import { createFileRoute } from "@tanstack/react-router";

import { UnitPage } from "#/features/organization/components/UnitPage";

export const Route = createFileRoute("/_authenticated/organization/$unitId")({
  component: UnitPage,
});
