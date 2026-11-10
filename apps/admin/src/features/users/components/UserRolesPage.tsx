import type { TRoleAssignmentResponse } from "@repo/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslations } from "use-intl";

import { Card, ConfirmDialog, Spinner, ToastHelper } from "@repo/ui";

import { apiClient } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";
import { QUERY_KEYS } from "#/lib/query-keys";

import { QueryError } from "../../layout/components/QueryError";
import { useRoles } from "../hooks/useRoles";
import { useUser } from "../hooks/useUser";
import { useUserAssignments } from "../hooks/useUserAssignments";
import { AssignmentRow } from "./AssignmentRow";
import { AssignRoleForm } from "./AssignRoleForm";

const route = getRouteApi("/_authenticated/users/$userId");

export function UserRolesPage() {
  const t = useTranslations();
  const { userId } = route.useParams();
  const queryClient = useQueryClient();
  const user = useUser(userId);
  const assignments = useUserAssignments(userId);
  const roles = useRoles();
  const [pending, setPending] = useState<TRoleAssignmentResponse | null>(null);

  const roleName = (key: string) => roles.data?.find((role) => role.key === key)?.name ?? key;

  const revoke = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await apiClient.DELETE("/api/v1/admin/role-assignments/{id}", {
        params: { path: { id: assignmentId } },
      });
      if (error) {
        throw new ApiError(error);
      }
    },
    onSuccess: async () => {
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAssignments(userId) });
    },
    onError: (problem: ApiError) => {
      setPending(null);
      ToastHelper.show({
        tone: "danger",
        description: t(ProblemMessageHelper.keyFor(problem.code)),
      });
    },
  });

  if (user.isPending) {
    return <Spinner />;
  }
  if (user.isError) {
    return <QueryError error={user.error} />;
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link to="/users" className="text-primary text-sm hover:underline">
        ← {t("roles_back")}
      </Link>
      <h1 className="font-display text-2xl font-semibold">
        {t("roles_title", { name: user.data.displayName })}
      </h1>
      <Card className="p-0">
        {assignments.isPending ? (
          <div className="p-4">
            <Spinner />
          </div>
        ) : assignments.isError ? (
          <div className="p-4">
            <QueryError error={assignments.error} />
          </div>
        ) : assignments.data.length === 0 ? (
          <p className="text-foreground-muted p-4 text-sm">{t("roles_empty")}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-surface-muted text-foreground-muted border-b">
              <tr>
                <th className="px-4 py-2 font-medium">{t("roles_col_role")}</th>
                <th className="px-4 py-2 font-medium">{t("roles_col_scope")}</th>
                <th className="px-4 py-2 font-medium">{t("roles_col_granted")}</th>
                <th className="px-4 py-2 font-medium">{t("roles_col_status")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {assignments.data.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  roleName={roleName(assignment.role)}
                  onRevoke={setPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {roles.data ? (
        <Card>
          <AssignRoleForm userId={userId} roles={roles.data} />
        </Card>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => (open ? undefined : setPending(null))}
        title={t("roles_revoke_title")}
        description={t("roles_revoke_body", { role: pending ? roleName(pending.role) : "" })}
        confirmLabel={t("roles_revoke_confirm")}
        cancelLabel={t("common_cancel")}
        pending={revoke.isPending}
        onConfirm={() => (pending ? revoke.mutate(pending.id) : undefined)}
      />
    </div>
  );
}
