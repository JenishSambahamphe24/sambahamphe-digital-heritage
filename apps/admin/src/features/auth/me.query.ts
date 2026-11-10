import type { TUserResponse } from "@repo/contracts";

import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { QUERY_KEYS } from "#/lib/query-keys";

const NOT_SIGNED_IN = new Set([401, 403]);

// Query-option factories are the accepted standalone-function pattern (as in
// Bitsky). 403 counts as signed out too: a session whose last role was
// removed can no longer use the admin site.
export function meQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.me,
    queryFn: async (): Promise<TUserResponse | null> => {
      const { data, response } = await apiClient.GET("/api/v1/me");
      if (NOT_SIGNED_IN.has(response.status)) {
        return null;
      }
      if (!data) {
        throw new Error(`GET /me failed with ${response.status}`);
      }
      return data;
    },
    retry: false,
  });
}
