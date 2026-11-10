import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginPage } from "#/features/auth/components/LoginPage";
import { meQueryOptions } from "#/features/auth/me.query";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.ensureQueryData(meQueryOptions())) {
      throw redirect({ to: "/users" });
    }
  },
  component: LoginPage,
});
