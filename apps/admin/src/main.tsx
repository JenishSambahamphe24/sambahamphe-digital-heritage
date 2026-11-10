import "./styles.css";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LocaleProvider } from "./features/i18n/LocaleProvider";
import { AppToaster } from "./features/layout/components/AppToaster";
import { QUERY_KEYS } from "./lib/query-keys";
import { SessionLossHelper } from "./lib/session-loss.helper";
import { routeTree } from "./routeTree.gen";

function handleError(error: unknown) {
  if (SessionLossHelper.isSessionLost(error)) {
    queryClient.setQueryData(QUERY_KEYS.me, null);
    void router.navigate({ to: "/login" });
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
});
const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("index.html is missing #root");
}

createRoot(rootElement).render(
  <StrictMode>
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <AppToaster />
      </QueryClientProvider>
    </LocaleProvider>
  </StrictMode>,
);
