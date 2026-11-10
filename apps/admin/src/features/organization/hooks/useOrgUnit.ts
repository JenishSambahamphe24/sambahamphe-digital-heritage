import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export function useOrgUnit(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orgUnit(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/org/units/{id}", {
        params: { path: { id: id ?? "" } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
