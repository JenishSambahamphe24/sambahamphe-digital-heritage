import type { IRouterContext } from "../router-context";

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<IRouterContext>()({
  component: Outlet,
});
