import type { TDbExecutor } from "../../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import {
  changeRequestOperations,
  changeRequests,
  entityRevisions,
} from "../../../core/database/schema/index.js";

export type TChangeRequestRow = typeof changeRequests.$inferSelect;
export type TNewChangeRequestRow = typeof changeRequests.$inferInsert;
export type TNewOperationRow = typeof changeRequestOperations.$inferInsert;
export type TOperationRow = typeof changeRequestOperations.$inferSelect;
export type TNewRevisionRow = typeof entityRevisions.$inferInsert;

@Injectable()
export class ChangeRequestsRepository {
  async insertRequest(
    values: TNewChangeRequestRow,
    executor: TDbExecutor,
  ): Promise<TChangeRequestRow> {
    const [row] = await executor.insert(changeRequests).values(values).returning();
    if (!row) {
      throw new Error("Insert into change_requests returned no row");
    }
    return row;
  }

  async insertOperation(values: TNewOperationRow, executor: TDbExecutor): Promise<TOperationRow> {
    const [row] = await executor.insert(changeRequestOperations).values(values).returning();
    if (!row) {
      throw new Error("Insert into change_request_operations returned no row");
    }
    return row;
  }

  async markApplied(
    operationId: string,
    resultEntityId: string,
    executor: TDbExecutor,
  ): Promise<void> {
    await executor
      .update(changeRequestOperations)
      .set({ applyStatus: "applied", resultEntityId })
      .where(eq(changeRequestOperations.id, operationId));
  }

  async insertRevision(values: TNewRevisionRow, executor: TDbExecutor): Promise<void> {
    await executor.insert(entityRevisions).values(values);
  }
}
