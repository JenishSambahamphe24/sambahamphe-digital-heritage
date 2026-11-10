import type {
  TAppointmentResponse,
  TCreateAppointmentRequest,
  TCreateOrgUnitRequest,
  TCreatePositionRequest,
  TCreateTermRequest,
  TOrgUnitResponse,
  TPositionResponse,
  TTermResponse,
  TUpdateAppointmentRequest,
} from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { QUERY_KEYS } from "#/lib/query-keys";

function unwrap<T>(result: {
  data?: T;
  error?: { code: string; status: number; detail: string };
}): T {
  if (result.error) {
    throw new ApiError(result.error);
  }
  return result.data as T;
}

// Every organization write refreshes the organization queries.
export function useOrgMutations() {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAll });

  const saveUnit = useMutation<
    TOrgUnitResponse,
    ApiError,
    { id?: string; version?: number; body: TCreateOrgUnitRequest }
  >({
    mutationFn: async ({ id, version, body }) =>
      unwrap(
        id && version
          ? await apiClient.PATCH("/api/v1/admin/org/units/{id}", {
              params: { path: { id } },
              body: { ...body, version },
            })
          : await apiClient.POST("/api/v1/admin/org/units", { body }),
      ),
    onSettled,
  });
  const saveTerm = useMutation<
    TTermResponse,
    ApiError,
    { unitId: string; id?: string; version?: number; body: TCreateTermRequest }
  >({
    mutationFn: async ({ unitId, id, version, body }) =>
      unwrap(
        id && version
          ? await apiClient.PATCH("/api/v1/admin/org/units/{id}/terms/{childId}", {
              params: { path: { id: unitId, childId: id } },
              body: { ...body, version },
            })
          : await apiClient.POST("/api/v1/admin/org/units/{id}/terms", {
              params: { path: { id: unitId } },
              body,
            }),
      ),
    onSettled,
  });
  const createAppointment = useMutation<
    TAppointmentResponse,
    ApiError,
    { unitId: string; body: TCreateAppointmentRequest }
  >({
    mutationFn: async ({ unitId, body }) =>
      unwrap(
        await apiClient.POST("/api/v1/admin/org/units/{id}/appointments", {
          params: { path: { id: unitId } },
          body,
        }),
      ),
    onSettled,
  });
  const updateAppointment = useMutation<
    TAppointmentResponse,
    ApiError,
    { unitId: string; id: string; body: TUpdateAppointmentRequest }
  >({
    mutationFn: async ({ unitId, id, body }) =>
      unwrap(
        await apiClient.PATCH("/api/v1/admin/org/units/{id}/appointments/{childId}", {
          params: { path: { id: unitId, childId: id } },
          body,
        }),
      ),
    onSettled,
  });
  const retractAppointment = useMutation<
    TAppointmentResponse,
    ApiError,
    { unitId: string; id: string; version: number; reason: string }
  >({
    mutationFn: async ({ unitId, id, version, reason }) =>
      unwrap(
        await apiClient.POST("/api/v1/admin/org/units/{id}/appointments/{childId}/retract", {
          params: { path: { id: unitId, childId: id } },
          body: { version, reason },
        }),
      ),
    onSettled,
  });
  const savePosition = useMutation<
    TPositionResponse,
    ApiError,
    { id?: string; version?: number; body: TCreatePositionRequest }
  >({
    mutationFn: async ({ id, version, body }) =>
      unwrap(
        id && version
          ? await apiClient.PATCH("/api/v1/admin/org/positions/{id}", {
              params: { path: { id } },
              body: { ...body, version },
            })
          : await apiClient.POST("/api/v1/admin/org/positions", { body }),
      ),
    onSettled,
  });
  return {
    saveUnit,
    saveTerm,
    createAppointment,
    updateAppointment,
    retractAppointment,
    savePosition,
  };
}
