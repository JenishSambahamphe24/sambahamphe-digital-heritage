import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export function useTerms(unitId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.orgTerms(unitId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/org/units/{id}/terms", {
        params: { path: { id: unitId } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data.data;
    },
  });
}
