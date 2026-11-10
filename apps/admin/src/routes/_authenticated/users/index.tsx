import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { UsersPage } from "#/features/users/components/UsersPage";

const usersSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/users/")({
  validateSearch: usersSearchSchema,
  component: UsersPage,
});
