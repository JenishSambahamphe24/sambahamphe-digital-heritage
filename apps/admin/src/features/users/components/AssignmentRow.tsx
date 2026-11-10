import type { TRoleAssignmentResponse } from "@repo/contracts";

import { useFormatter, useTranslations } from "use-intl";

import { Button } from "@repo/ui";

export interface AssignmentRowProps {
  assignment: TRoleAssignmentResponse;
  roleName: string;
  onRevoke: (assignment: TRoleAssignmentResponse) => void;
}

export function AssignmentRow({ assignment, roleName, onRevoke }: AssignmentRowProps) {
  const t = useTranslations();
  const format = useFormatter();
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });
  return (
    <tr>
      <td className="px-4 py-2 font-medium">{roleName}</td>
      <td className="px-4 py-2">{t("roles_scope", { scope: assignment.scopeType })}</td>
      <td className="text-foreground-muted px-4 py-2">{date(assignment.grantedAt)}</td>
      <td className="px-4 py-2">
        {assignment.revokedAt
          ? t("roles_status_revoked", { date: date(assignment.revokedAt) })
          : t("roles_status_active")}
      </td>
      <td className="px-4 py-2 text-right">
        {assignment.revokedAt ? null : (
          <Button variant="secondary" onClick={() => onRevoke(assignment)}>
            {t("roles_revoke")}
          </Button>
        )}
      </td>
    </tr>
  );
}
