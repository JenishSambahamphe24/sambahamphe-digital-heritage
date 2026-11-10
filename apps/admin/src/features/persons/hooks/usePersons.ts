import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export const PERSONS_PAGE_SIZE = 20;

export function usePersons(q: string, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.persons(q, page),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/admin/persons", {
        params: { query: { q: q || undefined, page, pageSize: PERSONS_PAGE_SIZE } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
