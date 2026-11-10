import type { TRoleResponse } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Alert, Button, FormField } from "@repo/ui";

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
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      setRoleKey("");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAssignments(userId) });
    },
    onError: (problem: ApiError) => setError(t(ProblemMessageHelper.keyFor(problem.code))),
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
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="flex items-end gap-3">
        <FormField id="assign-role" label={t("roles_assign_role_label")}>
          <select
            id="assign-role"
            value={roleKey}
            onChange={(event) => setRoleKey(event.target.value)}
            className="border-border-strong bg-surface h-10 min-w-56 rounded-md border px-3 text-sm"
          >
            <option value="">{t("roles_assign_choose")}</option>
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </FormField>
        <Button type="submit" disabled={!roleKey} loading={assign.isPending}>
          {t("roles_assign_submit")}
        </Button>
      </div>
    </form>
  );
}
