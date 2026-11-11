import { useQuery } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export function useAppointments(unitId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.orgAppointments(unitId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/admin/org/units/{id}/appointments", {
        params: { path: { id: unitId } },
      });
      if (error) {
        throw new ApiError(error);
      }
      return data.data;
    },
  });
}
