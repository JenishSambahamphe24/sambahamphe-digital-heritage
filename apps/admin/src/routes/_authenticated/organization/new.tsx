import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { UnitCreatePage } from "#/features/organization/components/UnitCreatePage";

const newUnitSearchSchema = z.object({ parentId: z.uuid().optional().catch(undefined) });

export const Route = createFileRoute("/_authenticated/organization/new")({
  validateSearch: newUnitSearchSchema,
  component: UnitCreatePage,
});
