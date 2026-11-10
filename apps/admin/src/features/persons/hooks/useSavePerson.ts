import type { TAdminPersonResponse, TCreatePersonRequest } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

export interface ISavePersonInput {
  id?: string;
  version?: number;
  body: TCreatePersonRequest;
}

export function useSavePerson() {
  const queryClient = useQueryClient();
  return useMutation<TAdminPersonResponse, ApiError, ISavePersonInput>({
    mutationFn: async ({ id, version, body }) => {
      const result =
        id && version
          ? await apiClient.PATCH("/api/v1/admin/persons/{id}", {
              params: { path: { id } },
              body: { ...body, version },
            })
          : await apiClient.POST("/api/v1/admin/persons", { body });
      if (result.error) {
        throw new ApiError(result.error);
      }
      return result.data;
    },
    onSettled: async (_data, _error, input) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personsAll });
      if (input.id) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.person(input.id) });
      }
    },
  });
}
