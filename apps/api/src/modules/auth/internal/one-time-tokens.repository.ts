import type { TDbExecutor } from "../../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { oneTimeTokens } from "../../../core/database/schema/index.js";

export type TTokenPurpose = (typeof oneTimeTokens.$inferSelect)["purpose"];
export type TOneTimeTokenRow = typeof oneTimeTokens.$inferSelect;

@Injectable()
export class OneTimeTokensRepository {
  constructor(private readonly database: DatabaseService) {}

  async insert(
    values: { userId: string; purpose: TTokenPurpose; tokenHash: string; expiresAt: Date },
    executor: TDbExecutor = this.database.db,
  ): Promise<void> {
    await executor.insert(oneTimeTokens).values(values);
  }

  async findUsable(
    tokenHash: string,
    purpose: TTokenPurpose,
    now: Date,
    executor: TDbExecutor = this.database.db,
  ): Promise<TOneTimeTokenRow | null> {
    const [row] = await executor
      .select()
      .from(oneTimeTokens)
      .where(
        and(
          eq(oneTimeTokens.tokenHash, tokenHash),
          eq(oneTimeTokens.purpose, purpose),
          isNull(oneTimeTokens.usedAt),
          gt(oneTimeTokens.expiresAt, now),
        ),
      )
      .limit(1)
      .for("update");
    return row ?? null;
  }

  async markUsed(id: string, executor: TDbExecutor = this.database.db): Promise<void> {
    await executor
      .update(oneTimeTokens)
      .set({ usedAt: new Date() })
      .where(eq(oneTimeTokens.id, id));
  }

  async invalidateOutstanding(
    userId: string,
    purpose: TTokenPurpose,
    executor: TDbExecutor = this.database.db,
  ): Promise<void> {
    await executor
      .update(oneTimeTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(oneTimeTokens.userId, userId),
          eq(oneTimeTokens.purpose, purpose),
          isNull(oneTimeTokens.usedAt),
        ),
      );
  }
}
