import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/admin/users/{id}", {
        params: { path: { id } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
