import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export const PLACES_PAGE_SIZE = 20;

// Without q: the children of parentId (or the top level). With q: a search.
export function usePlaces(q: string, parentId: string, page: number, pageSize = PLACES_PAGE_SIZE) {
  return useQuery({
    queryKey: [...QUERY_KEYS.places(q, parentId, page), pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/places", {
        params: {
          query: {
            q: q || undefined,
            parentId: q ? undefined : parentId || undefined,
            page,
            pageSize,
          },
        },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
