import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export function usePlace(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.place(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/places/{id}", {
        params: { path: { id: id ?? "" } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
