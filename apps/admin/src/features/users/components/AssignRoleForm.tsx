import type { TRoleResponse } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button, FormField, Select, ToastHelper } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { QUERY_KEYS } from "#/lib/query-keys";

export interface AssignRoleFormProps {
  userId: string;
  roles: TRoleResponse[];
}

// Boards and branches don't exist yet (Phase 2/3), so roles are granted
// everywhere for now; scoped grants arrive with those screens.
export function AssignRoleForm({ userId, roles }: AssignRoleFormProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [roleKey, setRoleKey] = useState("");

  const assign = useMutation({
    mutationFn: async () => {
      const result = await apiClient.POST("/api/v1/admin/role-assignments", {
        body: { userId, roleKey, scopeType: "global" },
      });
      if (result.error) {
        throw new ApiError(result.error);
      }
    },
    onSuccess: async () => {
      setRoleKey("");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAssignments(userId) });
    },
    onError: (problem: ApiError) =>
      ToastHelper.show({
        tone: "danger",
        description: t(ProblemMessageHelper.keyFor(problem.code)),
      }),
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (roleKey) {
          assign.mutate();
        }
      }}
    >
      <h2 className="font-display text-lg font-semibold">{t("roles_assign_title")}</h2>
      <div className="flex items-end gap-3">
        <FormField id="assign-role" label={t("roles_assign_role_label")} reserveMessage={false}>
          <Select
            id="assign-role"
            value={roleKey}
            onValueChange={setRoleKey}
            placeholder={t("roles_assign_choose")}
            className="min-w-56"
            options={roles.map((role) => ({ value: role.key, label: role.name }))}
          />
        </FormField>
        <Button type="submit" disabled={!roleKey} loading={assign.isPending}>
          {t("roles_assign_submit")}
        </Button>
      </div>
    </form>
  );
}
