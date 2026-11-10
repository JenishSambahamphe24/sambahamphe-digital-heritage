"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { QUERY_KEYS } from "#/lib/query-keys";

export function useSessions(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    enabled,
    queryFn: async () => {
      const { data, response } = await apiClient.GET("/api/v1/me/sessions");
      if (!data) {
        throw new Error(`GET /me/sessions failed with ${response.status}`);
      }
      return data.data;
    },
  });
}
