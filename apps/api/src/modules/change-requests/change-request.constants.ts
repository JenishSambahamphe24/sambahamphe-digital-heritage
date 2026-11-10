export const OP_TYPE = {
  createPerson: "create_person",
  updatePerson: "update_person",
  retractPerson: "retract_person",
  recordConsent: "record_consent",
  revokeConsent: "revoke_consent",
} as const;

export type TOpType = (typeof OP_TYPE)[keyof typeof OP_TYPE];

export const ENTITY_TYPE = { person: "person" } as const;
