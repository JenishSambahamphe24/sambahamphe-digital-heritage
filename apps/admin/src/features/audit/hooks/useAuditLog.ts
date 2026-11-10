import { useInfiniteQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

const AUDIT_PAGE_SIZE = 50;

export function useAuditLog() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.auditLog,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET("/api/v1/admin/audit-log", {
        params: { query: { limit: AUDIT_PAGE_SIZE, cursor: pageParam } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.page.nextCursor ?? undefined,
  });
}
