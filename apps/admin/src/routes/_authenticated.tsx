import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "#/features/auth/me.query";
import { AdminLayout } from "#/features/layout/components/AdminLayout";

// Every admin page sits under this gate: no session (or no role) → /login,
// before the page or its data requests run.
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions());
    if (!me) {
      throw redirect({ to: "/login" });
    }
    return { me };
  },
  component: AdminLayout,
});
