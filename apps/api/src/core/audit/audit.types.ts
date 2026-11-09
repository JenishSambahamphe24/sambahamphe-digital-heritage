export interface IAuditEvent {
  action: string;
  entityType?: string;
  entityId?: string | null;
  // Only ids, keys and statuses — never names, emails, phones, dates of birth.
  changes?: Record<string, unknown>;
  actorId?: string | null;
}
