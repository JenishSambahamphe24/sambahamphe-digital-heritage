import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export const USERS_PAGE_SIZE = 20;

export function useUsers(q: string, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.users(q, page),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/admin/users", {
        params: { query: { q: q || undefined, page, pageSize: USERS_PAGE_SIZE } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
  });
}
