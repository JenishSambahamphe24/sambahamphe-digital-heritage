import type { TDbExecutor } from "../../../core/database/database.types.js";
import type { TOpType } from "../change-request.constants.js";

import { Injectable } from "@nestjs/common";

import { AuditService } from "../../../core/audit/audit.service.js";
import { ChangeRequestsRepository } from "../internal/change-requests.repository.js";

export interface IOperationInput {
  opType: TOpType;
  payload: Record<string, unknown>;
  targetType: string;
  targetId?: string;
  baseVersion?: number;
}

export interface IApplyResult {
  entityId: string;
  version: number;
  snapshot: Record<string, unknown>;
}

// ADR-012: every genealogy write is an operation inside a change request.
// Genealogy editors' requests are approved on submission; the caller applies
// the operation in the same transaction and the result is recorded with a
// revision snapshot. Contributor submissions and review arrive in M3.2.
@Injectable()
export class ChangeRequestsService {
  constructor(
    private readonly requests: ChangeRequestsRepository,
    private readonly audit: AuditService,
  ) {}

  async applyAsEditor(
    executor: TDbExecutor,
    input: { actorId: string; title: string; reason?: string | null; operation: IOperationInput },
    apply: () => Promise<IApplyResult>,
  ): Promise<IApplyResult & { changeRequestId: string }> {
    const now = new Date();
    const request = await this.requests.insertRequest(
      {
        domain: "genealogy",
        title: input.title,
        rationale: input.reason ?? null,
        status: "approved",
        autoApproved: true,
        submittedBy: input.actorId,
        submittedAt: now,
        decidedBy: input.actorId,
        decidedAt: now,
      },
      executor,
    );
    const operation = await this.requests.insertOperation(
      {
        changeRequestId: request.id,
        seq: 1,
        opType: input.operation.opType,
        payload: input.operation.payload,
        targetType: input.operation.targetType,
        targetId: input.operation.targetId ?? null,
        baseVersion: input.operation.baseVersion ?? null,
      },
      executor,
    );
    const result = await apply();
    await this.requests.markApplied(operation.id, result.entityId, executor);
    await this.requests.insertRevision(
      {
        entityType: input.operation.targetType,
        entityId: result.entityId,
        version: result.version,
        snapshot: result.snapshot,
        changeRequestId: request.id,
        actorId: input.actorId,
        reason: input.reason ?? null,
      },
      executor,
    );
    await this.audit.record(
      {
        action: "change_request.auto_approved",
        entityType: input.operation.targetType,
        entityId: result.entityId,
        actorId: input.actorId,
        changes: {
          changeRequestId: request.id,
          opType: input.operation.opType,
          version: result.version,
        },
      },
      executor,
    );
    return { ...result, changeRequestId: request.id };
  }
}
