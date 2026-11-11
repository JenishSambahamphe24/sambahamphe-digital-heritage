import { createFileRoute } from "@tanstack/react-router";

import { PositionsPage } from "#/features/organization/components/PositionsPage";

export const Route = createFileRoute("/_authenticated/organization/positions")({
  component: PositionsPage,
});
