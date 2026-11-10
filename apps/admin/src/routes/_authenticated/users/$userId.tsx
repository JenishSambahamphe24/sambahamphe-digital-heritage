import { createFileRoute } from "@tanstack/react-router";

import { UserRolesPage } from "#/features/users/components/UserRolesPage";

export const Route = createFileRoute("/_authenticated/users/$userId")({
  component: UserRolesPage,
});
