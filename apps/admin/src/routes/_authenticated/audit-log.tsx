import { createFileRoute } from "@tanstack/react-router";

import { AuditLogPage } from "#/features/audit/components/AuditLogPage";

export const Route = createFileRoute("/_authenticated/audit-log")({
  component: AuditLogPage,
});
