import type { TConsentResponse, TRecordConsentRequest } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

// Retract, record consent and revoke consent: each refreshes the person.
export function usePersonActions(personId: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.person(personId) });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personsAll });
  };
  const retract = useMutation<void, ApiError, { version: number; reason: string }>({
    mutationFn: async (body) => {
      const { error } = await apiClient.POST("/api/v1/admin/persons/{id}/retract", {
        params: { path: { id: personId } },
        body,
      });
      if (error) {
        throw new ApiError(error);
      }
    },
    onSettled: refresh,
  });
  const recordConsent = useMutation<TConsentResponse, ApiError, TRecordConsentRequest>({
    mutationFn: async (body) => {
      const { data, error } = await apiClient.POST("/api/v1/admin/persons/{id}/consents", {
        params: { path: { id: personId } },
        body,
      });
      if (error) {
        throw new ApiError(error);
      }
      return data;
    },
    onSettled: refresh,
  });
  const revokeConsent = useMutation<void, ApiError, string>({
    mutationFn: async (consentId) => {
      const { error } = await apiClient.DELETE("/api/v1/admin/persons/{id}/consents/{consentId}", {
        params: { path: { id: personId, consentId } },
      });
      if (error) {
        throw new ApiError(error);
      }
    },
    onSettled: refresh,
  });
  return { retract, recordConsent, revokeConsent };
}
