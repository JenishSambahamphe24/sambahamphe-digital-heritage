import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export function usePerson(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.person(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/admin/persons/{id}", {
        params: { path: { id } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
