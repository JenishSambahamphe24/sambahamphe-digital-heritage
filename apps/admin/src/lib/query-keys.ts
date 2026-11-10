export const QUERY_KEYS = {
  me: ["me"],
  roles: ["roles"],
  users: (q: string, page: number) => ["users", { q, page }] as const,
  user: (id: string) => ["user", id] as const,
  userAssignments: (id: string) => ["user", id, "assignments"] as const,
  auditLog: ["audit-log"],
} as const;
