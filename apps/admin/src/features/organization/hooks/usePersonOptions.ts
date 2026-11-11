import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

const MIN_QUERY_LENGTH = 2;

export function usePersonOptions(unitId: string, q: string) {
  return useQuery({
    queryKey: QUERY_KEYS.orgPersonOptions(unitId, q),
    enabled: q.length >= MIN_QUERY_LENGTH,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/admin/org/person-options", {
        params: { query: { unitId, q } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data.data;
    },
  });
}
