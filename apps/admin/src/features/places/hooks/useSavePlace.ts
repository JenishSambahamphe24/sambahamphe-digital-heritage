import type { TCreatePlaceRequest, TPlaceResponse } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export interface ISavePlaceInput {
  id?: string;
  version?: number;
  body: TCreatePlaceRequest;
}

export function useSavePlace() {
  const queryClient = useQueryClient();
  return useMutation<TPlaceResponse, ApiError, ISavePlaceInput>({
    mutationFn: async ({ id, version, body }) => {
      const result =
        id && version
          ? await apiClient.PATCH("/api/v1/admin/places/{id}", {
              params: { path: { id } },
              body: { ...body, version },
            })
          : await apiClient.POST("/api/v1/admin/places", { body });
      if (result.error) {
        throw new ApiError(result.error);
      }
      return result.data;
    },
    onSettled: async (_data, _error, input) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.placesAll });
      if (input.id) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.place(input.id) });
      }
    },
  });
}
