"use client";

import type { TUserResponse } from "@repo/contracts";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { QUERY_KEYS } from "#/lib/query-keys";

const UNAUTHENTICATED = 401;

// null means "not signed in" — a normal state, not an error.
export function useMe() {
  return useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async (): Promise<TUserResponse | null> => {
      const { data, response } = await apiClient.GET("/api/v1/me");
      if (response.status === UNAUTHENTICATED) {
        return null;
      }
      if (!data) {
        throw new Error(`GET /me failed with ${response.status}`);
      }
      return data;
    },
    retry: false,
  });
}
